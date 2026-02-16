00
# 00_GLOSSARY_AND_IDS.md (NEW)

## Propósito
Unificar vocabulario + estrategia de IDs para evitar bugs estructurales y contratos ambiguos.
Este doc es “canónico” para: DB (03), Validación (04) y API (11).

---

## Glosario (entidades del dominio)

### Block (Bloque)
Agrupa ediciones (ej: “Mundo Gótico”).  
**Uso:** compatibilidad por formato, navegación, filtros.

### Edition (Edición)
Set específico dentro de un Block (ej: “Mundo Gótico (2000)”).  
**Uso:** printings, rarezas, disponibilidad.

### Card (Carta / concepto)
La carta como identidad conceptual (nombre, tipo, reglas, atributos base).  
**NO incluye**: arte específico, idioma/finish, variaciones por edición.

### Card Printing (Impresión)
Una versión imprimida de una `card` en una `edition`.  
Puede variar en: ilustración, rareza/era, idioma, finish, condición.

> UI: el usuario agrega al mazo una impresión específica cuando importa/exporta con edición.

### Format (Formato)
Conjunto de reglas data-driven: legalidad (bloques/ediciones/tipos/razas), límites, severidades.

### Deck (Mazo)
Contenedor “vivo”: nombre, dueño, visibilidad.  
No es un snapshot; cambia en el tiempo.

### Deck Version (Versión / Snapshot)
Snapshot **inmutable** del mazo en un punto del tiempo.  
**Unidad canónica de:**
- validación auditable
- export/import
- compartir públicamente
- stats snapshots

### Deck Version Card (Carta en versión)
Línea (card_printing_id, qty, flags como `is_starting_gold`).

### Deck Validation Run
Ejecución auditable del validador sobre una `deck_version`.  
Guarda mensajes + stats + timing.

### Starting Gold (Oro inicial)
Selección especial dentro de las 50 cartas:
- exactamente 1
- debe ser tipo ORO sin habilidad (según reglas)
- opcional: `can_be_starting_gold=true` (data-driven)

### Price Source (Fuente de precio)
Un link aprobado para scraping y/o referencia de tienda por printing.

### Community Price Submission
Sugerencia de precio de usuario (con cooldown y votos).

### Price Consensus (Consenso)
Precio final explicable derivado de community + scraping (sin borrar histórico).

### Public Deck
Publicación de un deck_version (público/unlisted) para dataset y compartir.

---

## Estrategia de IDs (recomendación)
### Reglas
- Todos los IDs internos: `uuid` (recomendado UUIDv7 o UUID estándar).
- Para URLs compartibles: `share_code` corto (base32/base64url) + checksum.
- Nunca usar nombres como IDs.

### IDs canónicos por entidad (DB)
- `block_id` (uuid)
- `edition_id` (uuid)
- `card_id` (uuid)
- `card_printing_id` (uuid)
- `format_id` (uuid)
- `deck_id` (uuid)
- `deck_version_id` (uuid)
- `validation_run_id` (uuid)
- `user_id` (uuid)
- `audit_log_id` (uuid)
- `scrape_job_id` (uuid)
- `price_consensus_id` (uuid)

### IDs para API
- Exponer **siempre** IDs como strings uuid.
- Para acciones de compartir:
  - Exponer `share_code` (string corto) + resolver a `deck_version_id`.

---

## Unicidad y claves lógicas (mínimas)
### Cards / Printings
- `cards`: `name_normalized` único por “card identity” (si aplica) **o** permitir homónimos con `card_key`.
- `card_printings`: único por combinación mínima:
  - `(card_id, edition_id, language_id, finish_id, printing_variant)`  
  Donde `printing_variant` cubre alternate art / reprints.

### Deck versions
- `deck_versions` inmutable: no UPDATE de cartas; solo crear nueva versión.
- `deck_version_cards` único: `(deck_version_id, card_printing_id)`.

### Sharing
- `deck_shares.share_code` único global.

---

## Flags y campos “peligrosos” (convenciones)
- `is_unique` (en card): afecta límites (max 1).
- `legal_status` (en printing o card según modelo): afecta warn/block.
- `can_be_starting_gold` (en printing o card): habilita selector.
- `has_ability` (en card o printing): para restricción “ORO sin habilidad”.

---

## Resolución de ambigüedad (import)
Si el usuario importa por nombre y hay múltiples printings:
Orden de preferencia:
1) Si el input trae `edition` → filtrar por edición.
2) Si trae `block` → filtrar por ediciones del bloque.
3) Si no trae nada → elegir el printing “default” del formato (definido por reglas/tabla) o abrir wizard.

Nunca “adivinar silenciosamente” si cambia el significado del mazo.

---

## Canon de export (resumen)
- Unidad exportable recomendada: `deck_version_id`
- Formatos:
  - TXT humano (torneo/clipboard)
  - CSV simple (nombre/qty/edición opcional)
  - JSON canónico (IDs)
  - PDF (presentación + QR opcional)
