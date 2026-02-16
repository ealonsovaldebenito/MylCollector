04
# Motor de Validación de Mazos

## Objetivo
Validar en tiempo real y de forma auditable:
- total = 50
- límites por carta (default 3, overrides por formato)
- edición/bloque permitido (según formato)
- carta única (is_unique => max 1)
- oro inicial obligatorio (exactamente 1; debe ser ORO sin habilidad; opcional can_be_starting_gold=true)
- cartas discontinuadas => warn o block (según rule severity)
- aliados requieren raza (si aplica por reglas del formato)

**Principio:** data-driven. Nunca hardcodear “si edición = X”.

---

## Entrada / salida (contrato)
### Entrada
- `format_id`
- `deck_version_cards: [{ card_printing_id, qty, is_starting_gold }]`

### Salida
- `is_valid: boolean`
- `messages: [{ rule_id, rule_version, severity, message, hint?, entity_ref?, context_json }]`
- `computed_stats` (opcional): histograma coste, tipos, rarezas
- `timing`: { duration_ms }

---

## Upgrade crítico: `rule_id` estable y catálogo de reglas
### Por qué
Sin `rule_id` estable, la UI no puede:
- linkear a cartas específicas consistentemente
- testear reglas sin fragilidad
- medir cuáles reglas fallan más
- internacionalizar mensajes sin romper contracts

### Campos del mensaje (canónico)
- `rule_id` (string, estable) ej: `DECK_TOTAL_50`
- `rule_version` (int) ej: 1
- `severity` (BLOCK | WARN | INFO)
- `message` (string humano)
- `hint` (string accionable, opcional)
- `entity_ref` (obj, opcional): `{ card_id?, card_printing_id?, edition_id?, block_id? }`
- `context_json` (obj): `{ found, expected, limit, format_id, ... }`

### Orden determinista de mensajes
Para evitar “flicker” en UI:
1) BLOCK por prioridad (reglas core primero)
2) WARN
3) INFO
Dentro de cada grupo: orden por `rule_id` + `entity_ref` + nombre carta.

---

## Reglas (mínimas) y `rule_id` sugeridos
### Core Deck Integrity
- `DECK_TOTAL_50` (BLOCK)
- `CARD_QTY_POSITIVE` (BLOCK)
- `CARD_LIMIT_DEFAULT_3` (BLOCK)
- `CARD_LIMIT_OVERRIDE` (BLOCK)  // cuando format_card_limits aplique
- `UNIQUE_CARD_MAX_1` (BLOCK)

### Formato y legalidad
- `FORMAT_ALLOWED_BLOCK` (BLOCK)
- `FORMAT_ALLOWED_EDITION` (BLOCK)
- `FORMAT_ALLOWED_CARD_TYPE` (BLOCK)
- `FORMAT_ALLOWED_RACE` (BLOCK)
- `LEGAL_STATUS_DISCONTINUED` (WARN o BLOCK según formato)

### Oro inicial
- `STARTING_GOLD_EXACTLY_ONE` (BLOCK)
- `STARTING_GOLD_TYPE_ORO_ONLY` (BLOCK)
- `STARTING_GOLD_MUST_HAVE_NO_ABILITY` (BLOCK)
- `STARTING_GOLD_NOT_ALLOWED_FOR_PRINTING` (BLOCK) // si can_be_starting_gold aplica

### Aliados y raza
- `ALLY_REQUIRES_RACE` (BLOCK/WARN según reglas del formato)

---

## Data-driven: cómo se parametriza
- `format_rules` define reglas globales con `params_json`
  - Ej: `{ "deck_size": 50, "default_card_limit": 3, "discontinued_severity": "WARN" }`
- `format_card_limits` define límites por carta (sobre el default)
- `format_allowed_*` define compatibilidades

> Nunca hardcodear compatibilidades por edición/raza.

---

## UX (no negociable)
- Bloquea guardar si `is_valid=false`
- Siempre mostrar el “por qué” y el “qué lo causó”
- Mensajes deben referenciar carta específica cuando aplique (`entity_ref`)

---

## Auditoría (validación como evento)
Cada validación “persistida” debe crear:
- `deck_validation_run`
- `deck_validation_messages`
Con `duration_ms` + `request_id` para correlación de logs.

---

## Tests mínimos (upgrade)
- Unit: cada `rule_id` con casos borde
- Integración:
  - payload → run → mensajes deterministas
  - misma entrada produce misma salida (orden y contenido)

