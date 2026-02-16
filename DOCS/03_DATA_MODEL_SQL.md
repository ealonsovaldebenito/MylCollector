# Modelo de datos SQL

Este documento sigue siendo la referencia principal de DB.
Upgrade enfocado en: (a) coherencia de IDs, (b) constraints auditables, (c) soporte a validación con `rule_id`,
(d) soporte a compartir/export, (e) performance y seguridad base.

## Extensiones recomendadas (Postgres)
- `pg_trgm` para búsqueda fuzzy (cards.name).
- `pgcrypto` o equivalente para hashes/seguridad (si no lo resuelve la capa app).

## Reglas duras (constraints lógicas)
- Si `card_type = ALIADO` => `ally_strength` NOT NULL
- Si `card_type != ALIADO` => `ally_strength` IS NULL
- Si `is_unique = true` => límite efectivo = 1 (en validador + opcional constraint de formato)

## Tablas principales (sin inventar dominio nuevo)
### Catálogos
- blocks, editions
- card_types, races, legal_statuses
- rarity_tiers, rarity_eras
- currencies, stores
- languages, finishes, card_conditions (opcionales)

### Cartas
- cards (concepto)
- card_printings (impresión por edición)

### Usuarios y seguridad
- users, roles, user_roles, auth_sessions, audit_log

### Colección
- user_cards

### Formatos y reglas (data-driven)
- formats, format_rules
- format_allowed_blocks, format_allowed_editions
- format_allowed_card_types, format_allowed_races
- format_card_limits

### Mazos (con snapshots)
- decks
- deck_versions (inmutable)
- deck_version_cards
- deck_validation_runs
- deck_validation_messages
- deck_stats_snapshots

### Sharing / Publicación (para URL + dataset)
- deck_shares (share_code, visibility, deck_version_id)
- public_decks, public_deck_cards

### Precios
- price_sources, scrape_jobs, scrape_job_items, card_prices
- community_price_submissions, community_price_votes, card_price_consensus

### Recomendador
- card_pair_stats
- recommendation_serves, recommendation_feedback

### Moderación
- link_suggestions, reports, moderation_actions

---

## Cambios clave del upgrade (recomendados)

### 1) `deck_validation_messages` debe soportar `rule_id` estable
Agregar campos:
- `rule_id` (text, NOT NULL)  // ej: "STARTING_GOLD_EXACTLY_ONE"
- `rule_version` (int, NOT NULL default 1)
- `entity_ref` (jsonb) // referencias: {card_id?, card_printing_id?, edition_id?}
- `hint` (text) // “qué hacer”: “marca un Oro inicial”, “reduce copias…”
Mantener:
- `severity` (enum/text)
- `message` (text)
- `context_json` (jsonb)

Índice recomendado:
- `(validation_run_id)`
- `(rule_id)`
- GIN en `context_json` si lo usas para debugging/analytics

### 2) `deck_validation_runs` debe guardar performance y correlación
Agregar campos:
- `duration_ms` (int)
- `computed_stats` (jsonb) // opcional pero útil para UI cache
- `request_id` (text)      // correlación con logs
- `created_at` (timestamp)

### 3) Sharing (export/copy/link) como entidad explícita
`deck_shares` recomendado:
- `share_code` (text UNIQUE, NOT NULL)
- `deck_version_id` (FK, NOT NULL)
- `visibility` (PRIVATE/UNLISTED/PUBLIC)
- `created_by` (FK user)
- `created_at`, `revoked_at` (nullable)
Índices:
- `(share_code)`
- `(deck_version_id)`

### 4) `audit_log` upgrade mínimo para trazabilidad
Agregar:
- `request_id` (text)
- `user_agent` (text)
- `session_id` (uuid nullable)
- `ip` (inet) (si aplica)
Índice:
- `(actor_user_id, created_at desc)`
- `(entity_type, entity_id, created_at desc)`
- `(request_id)`

> Nota: “logs app” y “audit_log” son distintos: audit_log es contractual y persistente.

---

## Índices mínimos (actualizados)
- cards(name) con pg_trgm (ya)
- cards(name_normalized) btree (si existe)
- card_printings(edition_id, rarity_tier_id)
- card_printings(card_id, edition_id)  // muy frecuente
- deck_version_cards(deck_version_id)
- format_card_limits(format_id, card_id)
- card_prices(card_printing_id, captured_at desc)
- deck_shares(share_code)  // resolver links rápido

---

## Notas de seguridad (DB)
- RLS recomendada para:
  - user_cards (solo owner)
  - decks/deck_versions (owner + share visibility)
  - community submissions (escritura autenticada, lectura pública opcional)
- Evitar exponer datos sensibles vía views públicas sin filtros.

