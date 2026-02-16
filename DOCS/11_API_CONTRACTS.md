11
# 11_API_CONTRACTS.md (NEW)

## Propósito
Definir contratos canónicos de integración (Frontend/Backend/Workers) para evitar inventos y drift.
Este documento es “fuente de verdad” #4 (ver 00).

---

## Convenciones globales

### Base URL y versionado
- Base: `/api/v1`
- Versionado por ruta (no por headers) para simplicidad.

### Auth
- Sesión por cookie HttpOnly (recomendado) o Bearer token (si aplica).
- Endpoints públicos deben ser explícitos.

### IDs
- Todos los IDs son strings uuid.
- Para sharing: `share_code` string corto.

### Respuestas estándar
**Success (genérico)**
```json
{ "ok": true, "data": { } }
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable",
    "details": { },
    "request_id": "req_..."
  }
}

Paginación
Query:
- limit (default 50, max 200)
- cursor (opaque string)

Response:
{
  "ok": true,
  "data": { "items": [], "next_cursor": "..." }
}

### Filtros y sorting
- q (búsqueda texto)
- sort (ej: name_asc, updated_desc)
- filters[...] (estructura clara, ej: filters[block_id]=...)

Módulos y endpoints
1) Catalog (público)

GET /catalog/blocks
GET /catalog/editions?block_id=...
GET /catalog/races?edition_id=...
GET /catalog/card-types
GET /catalog/rarities

Respuesta típica:

{ "ok": true, "data": { "items": [{ "id": "...", "name": "..." }] } }

2) Cards & Printings (público)

GET /cards

filtros:

q

filters[block_id]

filters[edition_id]

filters[race_id]

filters[card_type_id]

filters[rarity_tier_id]

filters[legal_status]

filters[cost_min], filters[cost_max]

GET /cards/{card_id}
GET /cards/{card_id}/printings

GET /printings/{card_printing_id}

3) Decks (autenticado)

POST /decks
Request:

{ "name": "Mi mazo", "visibility": "PRIVATE" }


GET /decks
GET /decks/{deck_id}

4) Deck Versions (autenticado)

POST /decks/{deck_id}/versions
Request:

{
  "format_id": "...",
  "cards": [
    { "card_printing_id": "...", "qty": 3, "is_starting_gold": false }
  ]
}


Response:

{ "ok": true, "data": { "deck_version_id": "..." } }


GET /decks/{deck_id}/versions
GET /deck-versions/{deck_version_id}

5) Validación (autenticado; opcional público en demo)

POST /deck-versions/{deck_version_id}/validate
Response (canónico de 04):

{
  "ok": true,
  "data": {
    "is_valid": true,
    "messages": [
      {
        "rule_id": "DECK_TOTAL_50",
        "rule_version": 1,
        "severity": "BLOCK",
        "message": "El mazo debe tener 50 cartas.",
        "hint": "Agrega 2 cartas más.",
        "entity_ref": null,
        "context_json": { "expected": 50, "found": 48 }
      }
    ],
    "computed_stats": { },
    "timing": { "duration_ms": 12 }
  }
}

6) Sharing (unlisted/public)

POST /deck-versions/{deck_version_id}/share
Request:

{ "visibility": "UNLISTED" }


Response:

{ "ok": true, "data": { "share_code": "ABCD1234" } }


GET /share/{share_code}

público: retorna deck_version + metadatos según visibilidad

POST /share/{share_code}/revoke (owner/mod)

auditar

7) Export / Copy list (autenticado o vía share)

GET /deck-versions/{deck_version_id}/export?format=txt|csv|json|pdf

txt: text/plain

csv: text/csv

json: application/json

pdf: application/pdf

GET /share/{share_code}/export?format=txt|csv|pdf

permite export según visibilidad del share

Requisitos:

Export de mazo inválido permitido, pero debe marcar VALID: false en TXT/PDF.

8) Import (autenticado; demo opcional)

POST /decks/{deck_id}/import
Request:

{
  "format": "txt",
  "payload": "1x Oro Básico [Mundo Gótico]\n3x Sombra Nocturna [Mundo Gótico]\n"
}


Respuesta posibles:

IMPORTED_RESOLVED con deck_version_id

IMPORTED_AMBIGUOUS con opciones por línea (wizard en UI)

9) Collection (autenticado)

GET /collection
POST /collection/items (add/update qty)
POST /collection/import (CSV)
GET /collection/missing?deck_version_id=...

retorna faltantes vs stock

10) Pricing (autenticado + público lectura parcial)

GET /prices/printings/{card_printing_id}

community summary + scraping history

POST /prices/printings/{card_printing_id}/submit

respeta cooldown semanal (devolver available_at si bloqueado)

POST /prices/submissions/{submission_id}/vote

Moderación:
POST /admin/price-sources/{source_id}/approve|reject

11) Recommendations (cuando exista data)

GET /recommendations/deck-versions/{deck_version_id}
Response:

lista con score + explicación (support/confidence/lift)

Rate limits (referencia)

Aplicar rate limits por endpoint (ver 13) y registrar request_id (ver 12).

Auditoría obligatoria

share, export, import, pricing, moderation deben generar audit_log.