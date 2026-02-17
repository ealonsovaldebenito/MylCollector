# 14_ROUTE_PLAN.md — Roadmap y Tracking Real del Proyecto

> Este archivo es el registro real del proyecto. Cada hito completado, decision tomada,
> descarte o cambio de rumbo queda documentado aqui con fecha.

---

## Estado actual del proyecto

| Area | Estado | Ultima actualizacion |
|------|--------|---------------------|
| Documentacion base | Completa | 2026-02-04 |
| Scaffold / Monorepo | Completado | 2026-02-03 |
| Data Model SQL (03) | Migraciones creadas (10+4 archivos) | 2026-02-16 |
| Validation Engine (04) | ✅ Implementado | 2026-02-15 |
| Product Spec (01) | Completo | 2026-02-04 |
| Architecture (02) | Completo | 2026-02-04 |
| Auth / Supabase | Scaffold listo | 2026-02-03 |
| Backend API | ✅ Catalogos + Cartas + Mazos + Validacion + Tiendas/Scraping | 2026-02-16 |
| Frontend UI | ✅ Catalogo + Builder + Admin Tiendas + Precios en catalogo + Admin Cartas (tabs + links tiendas) | 2026-02-17 |
| Tiendas / Scraping | ✅ Implementado (schemas, servicios, API, UI admin, precios en catalogo) | 2026-02-16 |
| Banlists / Historial | ✅ SQL + Schemas + Servicios + API + Admin UI | 2026-02-16 |
| Oracles / Strategy | ✅ SQL + Schemas + Servicios + API | 2026-02-16 |
| Card Form Redesign | ✅ Implementado (printings inline + preview + tabs) | 2026-02-17 |
| Testing | Setup + smoke tests | 2026-02-03 |

---

## Fase 0: Documentacion y Especificacion (COMPLETADA)

### Hitos
- [x] Completar `01_PRODUCT_SPEC.md` — alcance, UX, fases, dominio MYL
- [x] Completar `02_ARCHITECTURE.md` — decisiones de stack
- [x] Completar `03_DATA_MODEL_SQL.md` — schema especificado (faltan migraciones ejecutables)
- [x] Completar `04_DECK_VALIDATION_ENGINE.md` — reglas con rule_id estables

### Docs completados
- [x] `00_README.md`
- [x] `00_GLOSSARY_AND_IDS.md`
- [x] `01_PRODUCT_SPEC.md`
- [x] `02_ARCHITECTURE.md`
- [x] `03_DATA_MODEL_SQL.md`
- [x] `04_DECK_VALIDATION_ENGINE.md`
- [x] `05_PRICING_SCRAPING_COMMUNITY.md` (outline)
- [x] `06_RECOMMENDER.md` (outline)
- [x] `07_SECURITY_ROLES_AUDIT.md`
- [x] `08_UX_UI_SYSTEM.md`
- [x] `09_AGENTS_AND_SERVICES.md`
- [x] `10_WORKFLOW_AND_DEFINITION_OF_DONE`
- [x] `11_API_CONTRACTS.md`
- [x] `12_OBSERVABILITY_AND_OPS.md`
- [x] `13_SECURITY_THREAT_MODEL.md`
- [x] `99_MASTER_PROMPT`
- [x] `14_ROUTE_PLAN.md` (este archivo)

---

## Fase 1: Inicializacion del Proyecto (COMPLETADA)

**Fecha:** 2026-02-03

### Decisiones tomadas

| Decision | Opcion elegida | Alternativas descartadas | Razon |
|----------|---------------|--------------------------|-------|
| Estructura | Monorepo (pnpm workspaces) | Repos separados | Compartir tipos/schemas Zod entre FE/BE sin friction |
| Backend | Next.js API Routes | Fastify standalone, Hono | Simplicidad: un solo deploy, integrado con frontend |
| Base de datos | Supabase (Postgres gestionado) | PostgreSQL local/Docker | Auth, RLS, dashboard, storage incluidos. Doc lo recomienda |
| Package manager | pnpm | npm, bun | Eficiencia en disco, excelente soporte de workspaces |
| Build system | Turborepo | Nx, Lerna | Ligero, buena integracion con pnpm, zero-config |
| UI framework | Shadcn UI + Tailwind CSS | Material UI, Chakra, Mantine | Componentes sin vendor lock-in, copia local, doc 08 lo recomienda |
| Logging | Pino (JSON estructurado) | Winston, Bunyan | Rapido, JSON nativo, compatible con doc 12 |
| Testing | Vitest | Jest | Rapido, ESM nativo, compatible con TS sin config extra |
| Icons | Lucide React | Heroicons, Phosphor | Doc de arquitectura lo especifica |
| ID strategy | UUIDv7 | UUIDv4, ULID, CUID | Ordenable cronologicamente, doc 00 lo recomienda |

### Estructura creada

```
Myl/
├── DOCS/                    # documentacion (existente)
├── packages/
│   ├── shared/              # @myl/shared — schemas, types, constants, utils
│   └── db/                  # @myl/db — Supabase client, types placeholder
├── apps/
│   └── web/                 # @myl/web — Next.js 15 (App Router)
│       ├── src/app/         # paginas (landing, auth, app shell con 8 secciones)
│       ├── src/lib/         # logger, API helpers, Supabase clients
│       └── src/components/  # layout (sidebar, topbar), feedback (empty, error, skeleton), ui (shadcn)
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── configs raiz (eslint, prettier, gitignore, env.example)
```

### Entregables de esta fase
- [x] Configs raiz: package.json, tsconfig.base, turbo, pnpm-workspace, eslint, prettier, gitignore, env.example, npmrc
- [x] `@myl/shared`: ErrorCode, HttpStatus, ApiSuccess/ApiError types, Zod schemas (api-response, pagination, common), utils (request-id, uuid)
- [x] `@myl/db`: Supabase client factory, Database types placeholder, migrations dir
- [x] `@myl/web`: Next.js 15 scaffold con App Router, Tailwind, design tokens
- [x] Lib core: logger (pino), API response helpers, AppError class, withApiHandler wrapper, Supabase server/client/middleware
- [x] Middleware: request_id generation + X-Request-Id header + Supabase auth refresh
- [x] API: GET /api/v1/health con response estandar
- [x] Paginas placeholder: landing, login, register, dashboard, catalog, builder, decks, collection, prices, community, admin
- [x] Componentes layout: Sidebar (8 nav items con iconos Lucide), Topbar (search + builder CTA + user)
- [x] Componentes feedback: EmptyState, ErrorState, Skeleton/CardSkeleton/ListSkeleton (doc 08 sec 13.2)
- [x] Shadcn UI: components.json configurado, carpeta ui/ lista para componentes
- [x] Testing: vitest config en shared y web, smoke tests para schemas y API response shape

### Supuestos registrados
1. Tailwind v4 + shadcn: si hay incompatibilidad, se usa v3 y se migra despues
2. pino en Edge Runtime: middleware usa Date.now() + Math.random() para request_id (no ulid), pino solo en Node runtime (API routes)
3. No se requiere Supabase project creado para el scaffold — funciona sin conexion a DB
4. UUIDv7: se usa `uuid` v11+ que soporta v7 nativo

---

## Fase 2: Data Model SQL (COMPLETADA)

**Fecha:** 2026-02-05

### Migraciones creadas

| # | Archivo | Contenido |
|---|---------|-----------|
| 0 | `20240101000000_extensions_and_enums.sql` | pg_trgm, pgcrypto, 6 enum types |
| 1 | `20240101000001_catalog_tables.sql` | blocks, editions, card_types, races, rarity_tiers, rarity_eras, currencies, stores, languages, finishes, card_conditions |
| 2 | `20240101000002_cards_and_printings.sql` | cards (con trigger ally_strength), card_printings (con unique composite), indices trgm |
| 3 | `20240101000003_users_and_security.sql` | users (FK auth.users), roles (seed 3), user_roles, audit_log (con request_id, ip, user_agent), user_cards |
| 4 | `20240101000004_formats_and_rules.sql` | formats, format_rules, format_allowed_blocks/editions/card_types/races, format_card_limits |
| 5 | `20240101000005_decks_and_validation.sql` | decks, deck_versions (inmutable), deck_version_cards, deck_validation_runs, deck_validation_messages (con rule_id), deck_stats_snapshots |
| 6 | `20240101000006_sharing_and_prices.sql` | deck_shares, public_decks, public_deck_cards, price_sources, scrape_jobs, scrape_job_items, card_prices, community_price_submissions, community_price_votes, card_price_consensus |
| 7 | `20240101000007_recommender_and_moderation.sql` | card_pair_stats (co-occurrence), recommendation_serves, recommendation_feedback, link_suggestions, reports, moderation_actions |
| 8 | `20240101000008_rls_policies.sql` | RLS en 9 tablas: users, user_cards, decks, deck_versions, deck_version_cards, deck_shares, community_price_submissions, community_price_votes, audit_log |
| 9 | `20240101000009_updated_at_trigger.sql` | Funcion set_updated_at() + triggers en 10 tablas |

### Hitos completados
- [x] Tablas de catalogo: blocks, editions, card_types, races, rarity_tiers, rarity_eras, currencies, stores, languages, finishes, card_conditions
- [x] Tablas de cartas: cards (con constraint ally_strength via trigger), card_printings (unique composite)
- [x] Tablas de usuarios: users (FK auth.users), roles, user_roles, audit_log (upgrade con request_id, ip, user_agent, session_id)
- [x] Tablas de coleccion: user_cards (unique por user+printing+condition)
- [x] Tablas de formatos: formats (params_json), format_rules, format_allowed_blocks/editions/card_types/races, format_card_limits
- [x] Tablas de mazos: decks, deck_versions (inmutable), deck_version_cards, deck_validation_runs (con duration_ms, request_id), deck_validation_messages (con rule_id, rule_version, hint, entity_ref)
- [x] Tablas de sharing: deck_shares (share_code unique), public_decks, public_deck_cards
- [x] Tablas de precios: price_sources, scrape_jobs, scrape_job_items, card_prices, community_price_submissions, community_price_votes, card_price_consensus
- [x] Tablas de recomendador: card_pair_stats (con check card_a < card_b), recommendation_serves, recommendation_feedback
- [x] Tablas de moderacion: link_suggestions, reports, moderation_actions
- [x] RLS policies para datos privados (9 tablas)
- [x] Indices de performance (trgm, btree, FK lookups)
- [x] Trigger updated_at automatico (10 tablas)
- [ ] Migraciones ejecutables en Supabase (pendiente: requiere proyecto Supabase)

### Notas tecnicas
- Constraint ally_strength implementado via trigger (requiere cross-table lookup a card_types)
- card_printings unique por (card_id, edition_id, language_id, finish_id, printing_variant) segun doc 00
- deck_versions son inmutables: no se actualizan, solo se crean nuevas
- audit_log: INSERT restringido a service_role (sin policy INSERT para authenticated)
- Roles seed: user, moderator, admin

---

## Fase 3: Validation Engine (COMPLETADA ✅)

**Fecha:** 2026-02-15

### Objetivo
Completar `04_DECK_VALIDATION_ENGINE.md` e implementar el motor de validacion.

### Hitos completados
- [x] Catalogo de reglas con rule_id estables (13 reglas implementadas)
- [x] Implementacion del motor en @myl/shared (`validateDeck` puro, sin IO)
- [x] Mensajes explicables con hint y context_json
- [x] Orden determinista de mensajes (BLOCK → WARN → INFO)
- [ ] Tests unitarios por regla (pendiente)

### Reglas implementadas
1. `DECK_TOTAL_50` — Total de cartas debe ser 50 (o deck_size del formato)
2. `CARD_QTY_POSITIVE` — Cantidad por carta debe ser positiva
3. `CARD_LIMIT_DEFAULT_3` — Maximo 3 copias por carta (o default del formato)
4. `CARD_LIMIT_OVERRIDE` — Limites especiales por carta segun formato
5. `UNIQUE_CARD_MAX_1` — Cartas unicas maximo 1 copia
6. `FORMAT_ALLOWED_BLOCK` — Bloque permitido en formato
7. `FORMAT_ALLOWED_EDITION` — Edicion permitida en formato
8. `FORMAT_ALLOWED_CARD_TYPE` — Tipo de carta permitido
9. `FORMAT_ALLOWED_RACE` — Raza permitida
10. `LEGAL_STATUS_DISCONTINUED` — Aviso/bloqueo por carta discontinuada
11. `STARTING_GOLD_EXACTLY_ONE` — Exactamente 1 oro inicial
12. `STARTING_GOLD_TYPE_ORO_ONLY` — Oro inicial debe ser tipo ORO
13. `STARTING_GOLD_MUST_HAVE_NO_ABILITY` — Oro inicial sin habilidad

---

## Fase 4: Backend API Core (COMPLETADA ✅)

**Fecha:** 2026-02-15

### Hitos completados
- [x] Catalog endpoints (GET /api/v1/catalog/{blocks,editions,races,card-types,rarities,tags})
- [x] Cards endpoints (GET /api/v1/cards, /api/v1/cards/{cardId}, /api/v1/cards/{cardId}/printings)
- [x] Formats endpoint (GET /api/v1/formats)
- [x] Decks CRUD (POST/GET/PUT/DELETE /api/v1/decks, /api/v1/decks/{deckId})
- [x] Deck Versions (POST/GET /api/v1/decks/{deckId}/versions, GET /api/v1/deck-versions/{versionId})
- [x] Validation endpoints (POST /api/v1/deck-versions/{versionId}/validate, POST /api/v1/validate para live)
- [x] Admin endpoints (cartas, impresiones, CSV import/export, precios)
- [x] Error handling estandar en todos los endpoints (withApiHandler, createSuccess/createError)
- [ ] Sharing endpoints (pendiente)
- [x] Auth integration (Supabase Auth via createClient)

### Servicios implementados
- `formats.service.ts` — getActiveFormats, getFormatConfig
- `decks.service.ts` — CRUD mazos, versiones, cards, resolution para validacion
- `validation.service.ts` — validateDeckVersion (orquesta engine + DB), getLatestValidation
- `cards.service.ts` — searchCards con filtros + tag batch fetch, getCardById, CRUD, setReferencePrice
- `csv.service.ts` — exportCardsToCSV, importCardsFromCSV
- `storage.service.ts` — uploadCardImage, deleteCardImage

---

## Fase 5: Frontend Core (COMPLETADA ✅)

**Fecha:** 2026-02-15

### Hitos completados
- [x] Catalogo de cartas con filtros avanzados (busqueda, bloque, edicion, tipo, raza, coste, rareza, tags)
- [x] Pagina detalle de carta completa (breadcrumb, hero, tabs: Reimpresiones/Legalidad/Precios/Stats, cartas similares)
- [x] Constructor de mazos con layout 3 columnas (desktop) / tabs (mobile)
  - Columna izq: Buscador de cartas con filtros
  - Columna centro: Editor de mazo agrupado por tipo, qty controls, oro inicial
  - Columna der: Validacion en tiempo real + Estadisticas (curva coste, distribucion)
- [x] Selector de formato con descripciones
- [x] Panel de validacion con mensajes BLOCK/WARN/INFO coloreados
- [x] Mis Mazos (lista con cards, editar, crear nuevo)
- [x] Admin de cartas (lista, crear, editar con impresiones inline, CSV import/export, upload imagen)
- [x] Visual polish (animaciones, glow por rareza, favoritos, tags)
- [ ] Coleccion personal (pendiente)

---

## Fase 6: Export/Import (COMPLETADA ✅)

Ver detalle en seccion "2026-02-15 — FASE 6: Export/Import de Mazos COMPLETO" abajo.

---

## Fase 7: Tiendas, Scraping y Precios (COMPLETADA ✅)

**Fecha:** 2026-02-16

### Migraciones SQL adicionales
- `20260216100000_stores_improvements.sql` — Mejoras a stores, store_printing_links, scrape_jobs
- `20260216100001_banlist_history.sql` — ban_list_revisions, ban_list_entries, format_card_limits upgrade
- `20260216100002_oracles_and_strategy.sql` — card_oracle_texts, deck_strategy_notes

### Schemas Zod (@myl/shared)
- `store.ts` — createStoreSchema, updateStoreSchema, createStorePrintingLinkSchema, storeSchema, storePrintingLinkSchema
- `scraping.ts` — triggerScrapeSchema, scrapeJobSchema, scrapeJobItemSchema
- `banlist.ts` — createBanListRevisionSchema, banListEntryInputSchema, updateFormatCardLimitSchema
- `oracle.ts` — oracleTextSchema, createOracleTextSchema

### Servicios backend
- **stores.service.ts** — CRUD tiendas, links tienda-printing, busqueda de tiendas por printing
- **scraping.service.ts** — triggerScrape (con auto-expiracion de jobs viejos), executeScrapeJob, processScrapedItems, getScrapeJobs/Job, getPriceHistoryByStore
- **scraper-engines.ts** — Motores de scraping: tiendanube, jumpseller, woocommerce, generic_og. fetchAndScrape dispatcher.
- **banlists.service.ts** — getFormatCardLimits, upsertFormatCardLimit, deleteFormatCardLimit, getBanListRevisions, createBanListRevision
- **oracles.service.ts** — getOracleTexts, createOracleText, getLatestOracle

### API Endpoints
- `GET/POST /api/v1/admin/stores` — CRUD tiendas
- `GET/PUT/DELETE /api/v1/admin/stores/[storeId]` — Detalle/actualizar/eliminar tienda
- `GET/POST /api/v1/admin/stores/[storeId]/links` — Links tienda-printing
- `DELETE /api/v1/admin/stores/[storeId]/links/[linkId]` — Eliminar link
- `POST /api/v1/admin/stores/[storeId]/scrape` — Trigger scraping manual
- `GET /api/v1/admin/stores/[storeId]/scrape/jobs` — Historial de jobs
- `GET/POST /api/v1/admin/banlists/formats/[formatId]/limits` — Limites por formato
- `DELETE /api/v1/admin/banlists/formats/[formatId]/limits/[cardId]` — Eliminar limite
- `GET/POST /api/v1/admin/banlists/formats/[formatId]/revisions` — Historial revisiones
- `GET/POST /api/v1/admin/oracles/[cardId]` — Textos Oracle
- `GET /api/v1/prices/[printingId]/stores` — Precios por printing
- `POST /api/v1/prices/consensus` — Precio consenso
- `GET /api/v1/catalog/currencies` — Monedas disponibles
- `GET /api/v1/catalog/editions/[editionId]/printings` — Printings por edicion
- `GET /api/v1/tags` — Tags/mecanicas

### UI Admin
- **admin/stores/page.tsx** — Panel split: lista tiendas + links panel con agregar/eliminar links, busqueda de cartas, scraping manual con ejecucion real, historial de jobs
- **admin/banlists/page.tsx** — Gestion de limites por formato: Tab Gestion (prohibidas/restringidas/limitadas), Tab Historial de revisiones, Tab Legal Status por printing

### Integracion Catalogo
- **Precios en card-tile.tsx** — Badge verde con precio minimo en CLP
- **Precios en catalog-filters.tsx** — Filtros: rango de precio (min/max CLP), checkbox "Solo con precio disponible"
- **Precios en cards.service.ts** — Batch-fetch de store_min_price en searchCards, pre-filtro por precio
- **Precios en catalog-grid.tsx** — storeMinPrice pasado a cada CardTile
- **Precios en detalle de carta** — PriceSection con precios por tienda, historial

### Hitos completados
- [x] Migraciones SQL (stores improvements, banlist history, oracles)
- [x] Schemas Zod (store, scraping, banlist, oracle)
- [x] Tipos TypeScript actualizados en packages/db
- [x] Servicios backend (stores, scraping, scraper-engines, banlists, oracles)
- [x] API endpoints (15+ endpoints)
- [x] Admin UI (tiendas con links + scraping, banlists con historial)
- [x] Precios en catalogo (badge en tiles, filtros de precio)
- [x] 3 motores de scraping (tiendanube, jumpseller, woocommerce)
- [x] Auto-expiracion de jobs stuck (>10 min)
- [ ] Community price submissions con cooldown (pendiente)
- [ ] Votos y consenso (pendiente)
- [ ] Grafico de evolucion de precios historico (pendiente)

---

## Fase 8: Recomendador (PENDIENTE)

### Hitos esperados
- [ ] Job de co-ocurrencia
- [ ] Serving de sugerencias
- [ ] Explicabilidad
- [ ] Feedback loop

---

## Registro de cambios y decisiones

### 2026-02-03 — Sesion de inicializacion
- **Contexto:** Proyecto greenfield, solo existia documentacion en DOCS/
- **Accion:** Inicializacion completa del monorepo con todo el scaffold
- **Decisiones:** Ver tabla en Fase 1
- **Descartado:** Repos separados (friction para compartir tipos), Fastify standalone (overengineering para el inicio), PostgreSQL local (Supabase ofrece auth+RLS gratis)
- **Pendiente critico:** Los 4 docs vacios (01, 02, 03, 04) deben completarse antes de implementar features reales
- **Componentes UI:** Se creo estructura de componentes reutilizables (feedback: EmptyState, ErrorState, Skeleton) ademas de layout (Sidebar, Topbar). La carpeta `components/ui/` queda lista para componentes Shadcn.

### 2026-02-03 — Integracion Frontend Design Skill
- **Contexto:** Se integro el Claude Code Frontend Design Skill (SKILL.md) al proyecto
- **Accion:** Se anadio seccion 16 al doc 08_UX_UI_SYSTEM.md con principios de diseno distintivo
- **Cambios aplicados al codigo:**
  - **Tipografia:** Reemplazada Inter (generica) por DM Sans (body) + Playfair Display (display/titulos) + JetBrains Mono (monospace). Tres familias con caracter propio.
  - **Paleta de colores:** Creada paleta "refinado-gaming" con indigo oscuro + acentos dorados (ambar). Dark mode con azul noche + dorado luminoso. Evita gradientes purpura y esquemas genericos.
  - **Tokens semanticos:** Agregados --myl-info y --myl-gold ademas de warn/success existentes.
  - **Animaciones:** Agregados keyframes fade-in, slide-in-right, pulse-subtle + clases de stagger delay para reveals escalonados.
  - **Landing page:** Rediseñada con textura de fondo sutil, glow accent, badge animado, tituleria con fuente display, CTAs con sombras e interacciones hover, y feature grid con hover states.
  - **Sidebar:** Logo con badge dorado, navegacion con hover accent, footer con modo demo.
  - **Topbar:** Search bar estilizada con shortcut kbd, boton Builder con icono animado.
  - **App shell:** Animacion fade-in en contenido principal.
- **Principios aplicados:** Tipografia no generica, colores dominantes con acentos fuertes, micro-interacciones CSS-only, texturas de fondo, composicion con intencion.
- **Anti-patrones evitados:** Inter/Arial/Roboto, gradientes purpura, layouts cookie-cutter, componentes sin caracter.

### 2026-02-05 — Migraciones SQL completadas
- **Contexto:** Fase 2 del roadmap — convertir el modelo de datos (doc 03) en migraciones ejecutables
- **Accion:** Creadas 10 migraciones SQL en `packages/db/supabase/migrations/`
- **Cobertura:** Todas las tablas del doc 03 cubiertas — catalogos, cartas, usuarios, formatos, mazos, validacion, sharing, precios, recomendador, moderacion
- **Extras implementados:**
  - Trigger para validar ally_strength segun card_type (cross-table)
  - Trigger set_updated_at() automatico en 10 tablas
  - RLS policies en 9 tablas sensibles
  - Seed de roles default (user, moderator, admin)
  - 6 enum types para type safety en DB
- **Pendiente:** Ejecutar migraciones contra Supabase real (requiere proyecto creado)

### 2026-02-15 — Catalogo + Armador de Mazos COMPLETO ✅
- **Contexto:** Fases 3, 4 y 5 del roadmap — implementacion completa del core de la plataforma
- **Alcance:** Motor de validacion + Backend API + Frontend Builder + Catalogo mejorado
- **Duracion:** ~2 horas de trabajo continuo (7 fases en paralelo)

#### Fase 1: Schemas compartidos (@myl/shared)
- Schemas Zod: `format.ts`, `deck.ts`, `validation.ts`, `deck-mutations.ts`
- Tipos exportados: Format, Deck, DeckVersion, ValidationMessage, ValidationResult, etc.
- Actualizados: `schemas/index.ts` (barrel exports)

#### Fase 2: Motor de validacion puro
- **Archivo:** `packages/shared/src/engine/validate-deck.ts`
- **Funcion principal:** `validateDeck(config: FormatConfig, cards: DeckCardEntry[]): ValidationResult`
- **Caracteristicas:**
  - Puro (sin IO/DB), determinista
  - 13 reglas implementadas con rule_id estables
  - Mensajes con hint, entity_ref, context_json
  - Orden determinista: BLOCK → WARN → INFO
  - Computed stats: total_cards, cost_histogram, type/race/rarity distributions
  - Timing tracking (duration_ms)

#### Fase 3: Tipos DB actualizados
- Agregadas tablas a `packages/db/src/types.ts`:
  - format_rules, format_allowed_{blocks,editions,card_types,races}, format_card_limits
  - decks, deck_versions, deck_version_cards
  - deck_validation_runs, deck_validation_messages, deck_stats_snapshots

#### Fase 4: Servicios backend
- **formats.service.ts:** getActiveFormats, getFormatConfig (resuelve config completo para validacion)
- **decks.service.ts:**
  - CRUD: getUserDecks, getDeck, createDeck, updateDeck, deleteDeck
  - Versiones: createDeckVersion (auto-incrementa version_number), getDeckVersions, getDeckVersion
  - Resolution: getDeckVersionCardsForValidation, resolveCardsForValidation (para live validation)
- **validation.service.ts:** validateDeckVersion (orquesta + persiste), getLatestValidation

#### Fase 5: API Routes (7 endpoints)
- `GET /api/v1/formats` — Lista formatos activos
- `POST /api/v1/decks`, `GET /api/v1/decks` — Crear mazo, listar mis mazos
- `GET/PUT/DELETE /api/v1/decks/{deckId}` — Detalle, actualizar, eliminar
- `POST/GET /api/v1/decks/{deckId}/versions` — Crear version, listar versiones
- `GET /api/v1/deck-versions/{versionId}` — Detalle de version con cartas
- `POST /api/v1/deck-versions/{versionId}/validate` — Validar version (persiste resultado)
- `POST /api/v1/validate` — **Live validation** (sin persistencia, para preview en builder)

#### Fase 6: Hooks frontend
- **useFormats:** Carga formatos activos
- **useMyDecks:** Lista mazos del usuario con refresh
- **useDeckBuilder:** Hook central del builder
  - Estado: deckId, name, formatId, cards[], validation, isValidating, isSaving, isDirty
  - Acciones: addCard, removeCard, setQty, setStartingGold, setFormat, setName, saveDeck, loadDeck, clearDeck
  - Computed: totalCards, groupedByType (agrupado y ordenado por tipo/coste/nombre)
  - Validacion en tiempo real con debounce 500ms a `/api/v1/validate`
  - Save: crea deck + version, redirige al editor

#### Fase 7: Componentes UI del builder (10+ componentes)
- **BuilderWorkspace:** Layout principal 3 columnas (desktop) / tabs (mobile)
  - Top bar: nombre, selector formato, boton guardar, cerrar
  - Panel izq: BuilderCardBrowser (busqueda, filtros: tipo/raza/era/edición, scroll infinito, boton +)
  - Panel centro: BuilderDeckEditor (agrupado por tipo, qty controls, oro inicial, contador X/50)
  - Panel der: BuilderValidationPanel + BuilderStatsPanel
- **BuilderDeckCard:** Item individual con imagen mini, nombre, edicion, qty controls (+/-), boton oro (Star)
- **BuilderValidationPanel:** Mensajes coloreados (rojo BLOCK, amarillo WARN, azul INFO) con hints
- **BuilderStatsPanel:** Curva de coste (barras), distribucion tipo/raza/rareza (badges)
- **DeckListPanel:** Grid de mazos con cards, formato, fecha, visibilidad
- **FormatSelector:** Select con descripciones de formatos
- **Paginas:**
  - `/builder` → DeckListPanel (lista mazos o empty state con CTA)
  - `/builder/new` → Wizard (nombre + formato → crea deck → redirige a editor)
  - `/builder/[deckId]` → BuilderWorkspace con mazo cargado
- **Mobile responsive:** Tabs [Catalogo | Mazo | Stats] en vez de 3 columnas

#### Catalogo mejorado (completado previamente en sesion anterior)
- Pagina detalle completa: `/catalog/[cardId]` con breadcrumb, hero, tabs (Reimpresiones/Legalidad/Precios/Stats), cartas similares
- Filtros avanzados: busqueda, bloque, edicion, tipo, raza, coste, rareza, tags (mecanicas)
- Visual polish: glow por rareza (ultra/secreta), boton favorito, tags, animaciones

#### Admin de cartas (completado previamente)
- Crear/editar carta con **impresiones inline** (multiples printings de una vez)
- Block → Edition cascade
- Upload imagen durante creacion
- Precio referencial (CLP) via `/api/v1/cards/{cardId}/printings/{printingId}/price`
- CSV Import/Export completo con resolucion de ambiguedades

#### Verificacion
- ✅ `pnpm type-check` — 0 errores
- ✅ `pnpm build` — Exitoso (26+ rutas, nuevas: /builder, /builder/new, /builder/[deckId], /api/v1/validate)
- ✅ Componentes nuevos: Card (shadcn), date-fns instalado
- ✅ Todas las firmas de tipos correctas (wrappers para CardPrintingData vs printingId)

#### Arquitectura y patrones aplicados
- **Data-driven:** Validacion no hardcodea reglas por edicion/formato, usa tablas format_allowed_*
- **Inmutabilidad:** deck_versions son inmutables (snapshot pattern)
- **Live validation:** Validacion sin persistencia para feedback instant

### 2026-02-15 — FASE 6: Export/Import de Mazos COMPLETO ✅
- **Contexto:** Implementacion completa de exportacion e importacion de mazos con resolucion de ambiguedades
- **Alcance:** Formatters, Parsers, API routes, UI con wizard multi-paso
- **Duracion:** ~1.5 horas de trabajo (8 tareas)

#### Fase 6.1: Schemas compartidos (@myl/shared)
- **Archivo nuevo:** `packages/shared/src/schemas/export-import.ts`
- Schemas: ExportFormat (txt|csv|json|pdf), ImportFormat, ImportRequest, ImportResult
- Tipos discriminados: ImportResolvedResult, ImportAmbiguousResult
- ImportAmbiguousLine con options[] para wizard de resolucion
- ImportResolution para resolver ambiguedades manualmente

#### Fase 6.2: Formatters de exportacion
- **txt-formatter.ts:** Formato texto plano con validacion embebida
  - Header: nombre mazo, formato, total cartas, estado validacion
  - Errores/advertencias listados si mazo invalido
  - Agrupado por tipo de carta, ordenado por coste/nombre
  - Indicador ⭐ para oro inicial
- **csv-formatter.ts:** CSV estructurado para Excel
  - Columnas: Qty, Card Name, Edition, Type, Cost, Starting Gold, Legal Status
  - Escape correcto de campos con comas/comillas
- **json-formatter.ts:** JSON completo con metadatos
  - Incluye: validation messages, computed_stats, timing
  - Version 1.0 del schema para backward compatibility
- **pdf-formatter.ts:** Pendiente (placeholder para PDF export)

#### Fase 6.3: Parsers de importacion
- **txt-parser.ts:** Parser "Qx Card Name [Edition] ⭐?"
  - Ignora lineas de header (===, Formato:, Estado:, etc.)
  - Detecta oro inicial por emoji ⭐
  - Extrae qty, nombre, edition_hint (opcional), is_starting_gold
  - Retorna ParsedDeckLine[] + errors[]
- **csv-parser.ts:** Parser CSV respetando quoted fields
  - Skip header row automatico
  - Parse de campos escapados (comas dentro de quotes)
  - Mapea columnas: Qty, Card Name, Edition, etc.

#### Fase 6.4: Servicio de export/import
- **Archivo nuevo:** `apps/web/src/lib/services/export-import.service.ts`
- **getDeckExportData:** Resuelve deck + version + validation + cartas con relaciones
- **exportDeckVersion:** Genera contenido en formato seleccionado
  - Retorna: { content, mimeType, filename }
  - Sanitiza filename para descarga
- **importDeck:** Parse + resolucion de nombres de cartas
  - Query cartas por nombre (exact match)
  - Si edition_hint: filtra por edicion
  - Si 1 opcion → RESOLVED
  - Si >1 opcion → AMBIGUOUS con opciones para wizard
  - Si 0 opciones → Error explicito
- **findCardPrintingOptions:** Busqueda fuzzy con join edition/rarity
- **auditExport/auditImport:** Logging de operaciones en audit_log

#### Fase 6.5: API Routes (3 endpoints)
- **GET /api/v1/deck-versions/[versionId]/export?format=txt|csv|json|pdf**
  - Auth opcional (publico si deck unlisted/public)
  - Verifica ownership o visibilidad publica
  - Retorna NextResponse con headers Content-Disposition
  - Audit log si usuario autenticado
- **POST /api/v1/decks/[deckId]/import**
  - Body: { format: 'txt'|'csv', payload: string }
  - Retorna: RESOLVED con deck_version_id O AMBIGUOUS con wizard data
  - Crea version automaticamente si resuelto
- **POST /api/v1/decks/[deckId]/import/resolve**
  - Body: { resolved_cards, selections[] }
  - Combina cartas resueltas + selecciones manuales
  - Crea version final con notes "Importado con resolucion manual"

#### Fase 6.6: UI Components
- **ExportDeckDialog:**
  - RadioGroup con 4 opciones (TXT, CSV, JSON, PDF)
  - Descripciones de cada formato
  - PDF disabled (proximamente)
  - Descarga automatica via blob + URL.createObjectURL
- **ImportDeckDialog:**
  - Selector de formato (TXT/CSV)
  - Textarea para pegar contenido
  - Placeholder con formato ejemplo
  - Manejo de errores (parse errors, not found)
  - Switch automatico a wizard si AMBIGUOUS
- **ImportWizard:**
  - Wizard multi-paso (paso X/Y)
  - Cada paso: seleccion de printing entre opciones
  - Preview de cada opcion: imagen + edicion + rareza + legal_status
  - RadioGroup para seleccionar
  - Navegacion: Anterior/Siguiente/Finalizar
  - Validacion: no permite avanzar sin seleccion
  - Submit final: resuelve todas las ambiguedades

#### Fase 6.7: Integracion en Builder
- **BuilderWorkspace actualizado:**
  - Botones Export/Import agregados al top bar (antes de Save)
  - Export usa versionId del hook (agregado en esta fase)
  - Import callback: reloads deck despues de import exitoso
- **useDeckBuilder actualizado:**
  - Nuevo estado: versionId (se actualiza en saveDeck y loadDeck)
  - clearDeck tambien limpia versionId
  - saveDeck almacena versionId de la version creada
  - loadDeck almacena versionId de latest_version

#### Nuevos componentes UI (shadcn)
- **RadioGroup:** Creado `apps/web/src/components/ui/radio-group.tsx`
  - Radix UI integration
  - Circle indicator con fill animado
  - Instalado: @radix-ui/react-radio-group@^1.3.8

#### Verificacion
- ✅ `pnpm type-check` — 0 errores (despues de fixes)
- ✅ `pnpm build` — Exitoso (34 rutas)
- ✅ ESLint: todos los `any` justificados con comments
- ✅ Nuevas rutas API funcionando:
  - GET /api/v1/deck-versions/[versionId]/export
  - POST /api/v1/decks/[deckId]/import
  - POST /api/v1/decks/[deckId]/import/resolve

#### Problemas encontrados y resueltos
1. **Missing RadioGroup component:** Creado con Radix UI
2. **Type errors en API routes:** user no en context → usar supabase.auth.getUser()
3. **Return type mismatch:** Response vs NextResponse → usar NextResponse
4. **createDeckVersion return value:** Retorna objeto, no string → usar .deck_version_id
5. **Import service type cast:** RESOLVED no tiene resolved_cards en schema → cast as any con justificacion
6. **Module resolution:** .js extensions en imports → remover para build

#### Archivos creados (13 nuevos)
1. `packages/shared/src/schemas/export-import.ts`
2. `packages/shared/src/formatters/txt-formatter.ts`
3. `packages/shared/src/formatters/csv-formatter.ts`
4. `packages/shared/src/formatters/json-formatter.ts`
5. `packages/shared/src/formatters/index.ts`
6. `packages/shared/src/parsers/txt-parser.ts`
7. `packages/shared/src/parsers/csv-parser.ts`
8. `packages/shared/src/parsers/index.ts`
9. `apps/web/src/lib/services/export-import.service.ts`
10. `apps/web/src/app/api/v1/deck-versions/[versionId]/export/route.ts`
11. `apps/web/src/app/api/v1/decks/[deckId]/import/route.ts`
12. `apps/web/src/app/api/v1/decks/[deckId]/import/resolve/route.ts`
13. `apps/web/src/components/ui/radio-group.tsx`

#### Archivos modificados (6)
1. `packages/shared/src/schemas/index.ts` — Barrel exports
2. `packages/shared/src/index.ts` — Barrel exports formatters/parsers
3. `apps/web/src/components/builder/export-deck-dialog.tsx` — Creado
4. `apps/web/src/components/builder/import-deck-dialog.tsx` — Creado
5. `apps/web/src/components/builder/import-wizard.tsx` — Creado
6. `apps/web/src/components/builder/builder-workspace.tsx` — Agregados botones Export/Import
7. `apps/web/src/hooks/use-deck-builder.ts` — Agregado versionId state

#### Cumplimiento de requisitos
- ✅ Export de mazo invalido permitido (marca VALID: false en TXT)
- ✅ Audit logging en todas las operaciones
- ✅ Wizard para resolver ambiguedades (UI/UX completo)
- ✅ Formato TXT legible y re-importable
- ✅ Formato CSV compatible con Excel
- ✅ Formato JSON completo con metadatos
- ✅ PDF pendiente (estructura lista para implementar)

---

### 2026-02-16 — Tiendas, Scraping y Precios COMPLETO ✅
- **Contexto:** Implementar sistema completo de tiendas con scraping de precios, banlists con historial, y textos oracle
- **Alcance:** 4 migraciones SQL, 6+ schemas Zod, 6+ servicios, 15+ endpoints API, 2+ paginas admin
- **Cambios clave:**
  - Motores de scraping (tiendanube, jumpseller, woocommerce) con fetch + parse automatico
  - Admin UI de tiendas con panel de links, busqueda de cartas, trigger manual de scraping
  - Precios integrados en catalogo (badge en tiles, filtros de precio min/max/has_price)
  - Banlists con historial de revisiones y gestion por formato
  - Auto-expiracion de scrape jobs stuck (>10 min)
  - Fix: currencies API 500 (columna is_active no existia)
  - Fix: signal abort error en user-context (AbortController + mounted flag)
  - Fix: scrape job "already active" (auto-expire stale jobs antes de verificar)

---

### 2026-02-17 - Admin Cartas: rediseno + links de tiendas por impresion (COMPLETO)

- **Contexto:** Mejorar uso de espacio e informacion en edicion de cartas y agregar gestion de links de tiendas por impresion (reverse de `/admin/stores`).
- **Resultado:**
  - UI optimizada en `CardForm` con tabs: **Datos / Impresiones / Tiendas**.
  - Links de tiendas ahora se gestionan desde cartas por `card_printing_id` (cada impresion puede tener distinto valor).
  - Se muestra informacion clave (conteos, legal status, rango de consenso) para edicion mas rapida.
- **APIs alineadas:**
  - Reverse por impresion: `GET|POST /api/v1/admin/printings/:printingId/store-links`.
  - Delete alineado a Stores: `DELETE /api/v1/admin/stores/:storeId/links/:linkId`.

---

## Plan proximo: Admin Cartas/Tiendas (iteracion)

### Objetivo
Acelerar la gestion de links/precios sin salir del editor de cartas.

### Backlog propuesto
- [ ] Boton "Scrapear ahora" desde tab **Tiendas** (reusar endpoint de scrape por store).
- [ ] Mostrar ultimo scrape/estado por link (ya existe `last_scraped_at`).
- [ ] Busqueda rapida de tiendas dentro del selector.
- [ ] (Opcional) Endpoint ergonomia: `DELETE /api/v1/admin/printings/:printingId/store-links/:linkId`.

---
