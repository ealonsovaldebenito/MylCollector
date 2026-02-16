# CLAUDE.md — MYL Deck & Card Platform

Este archivo es la guia para Claude Code al trabajar en este proyecto.

## Idioma

**Responder siempre en español.**

## Resumen del proyecto

Plataforma de construccion y gestion de mazos para el juego de cartas MYL. Incluye:
- Catalogo de cartas con filtros avanzados
- Constructor de mazos con validacion en vivo
- Coleccion personal privada
- Sistema de precios comunitario
- Recomendador basado en co-ocurrencia

## Stack tecnologico

- **Runtime:** Node.js >= 20
- **Package manager:** pnpm 9.15 (workspaces)
- **Build system:** Turborepo
- **Framework:** Next.js 15 (App Router, Turbopack)
- **React:** 19
- **Base de datos:** Supabase (PostgreSQL gestionado, RLS, Auth)
- **Validacion:** Zod
- **Testing:** Vitest
- **Estilos:** Tailwind CSS 4 + Shadcn UI
- **Logging:** Pino (JSON estructurado)

## Estructura del monorepo

```
Myl/
├── apps/
│   └── web/                 # @myl/web — Next.js frontend + API routes
├── packages/
│   ├── shared/              # @myl/shared — tipos, schemas Zod, constantes, utils
│   └── db/                  # @myl/db — cliente Supabase, tipos DB
└── DOCS/                    # Especificaciones del proyecto (fuente de verdad)
```

## Comandos principales

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Desarrollo (turbo)
pnpm build            # Build de todo el monorepo
pnpm test             # Correr tests (vitest)
pnpm lint             # Linting
pnpm type-check       # Verificar tipos TypeScript
pnpm format           # Formatear con Prettier
pnpm format:check     # Verificar formato
```

Para un workspace especifico:
```bash
pnpm --filter @myl/web dev
pnpm --filter @myl/shared build
pnpm --filter @myl/db gen-types
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y configurar:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=debug
```

## Fuentes de verdad (orden de precedencia)

1. `DOCS/00_GLOSSARY_AND_IDS.md` — Vocabulario e IDs canonicos
2. `DOCS/01_PRODUCT_SPEC.md` — Alcance, UX, fases
3. `DOCS/03_DATA_MODEL_SQL.md` — Schema DB, constraints, indices
4. `DOCS/04_DECK_VALIDATION_ENGINE.md` — Motor de validacion, rule_id
5. `DOCS/11_API_CONTRACTS.md` — Endpoints, DTOs, errores
6. `DOCS/12_OBSERVABILITY_AND_OPS.md` — Logs, metricas, request_id
7. `DOCS/13_SECURITY_THREAT_MODEL.md` — Riesgos y mitigaciones
8. `DOCS/09_AGENTS_AND_SERVICES.md` — Limites de responsabilidad
9. `DOCS/10_WORKFLOW_AND_DEFINITION_OF_DONE` — Flujo y DoD

**Si hay conflicto entre docs:** detenerse y proponer resolucion (no adivinar).

## Principios no negociables

1. **No inventar** reglas, campos o relaciones que afecten integridad del mazo/datos
2. **Data-driven:** compatibilidades y limites vienen de tablas, sin hardcode por edicion/raza
3. **Determinista:** misma entrada => misma salida (incluye orden de mensajes)
4. **Contrato estable:** DTOs versionados, shape consistente
5. **Autoridad server-side:** backend valida, frontend puede pre-validar pero no decide
6. **Auditable:** `request_id` + `audit_log` para acciones sensibles
7. **Seguridad por defecto:** ownership, RLS, rate limit, sanitizacion

## Orden de implementacion por feature

1. SQL/Data model (migraciones, constraints, indices, RLS)
2. Shared contracts/schemas (Zod + tipos TS)
3. Validation engine (si aplica)
4. Backend service + endpoints
5. Frontend UX
6. Tests (unit + integracion)
7. Observabilidad (logs, audit)

## Formato de errores API

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible",
    "details": {},
    "request_id": "req_..."
  }
}
```

Codigos: `VALIDATION_ERROR`, `NOT_AUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `INTERNAL_ERROR`, `IMPORT_AMBIGUOUS`

## Convenciones de codigo

- **TypeScript estricto** (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`)
- **ESLint:** `@typescript-eslint/consistent-type-imports` (usar `import type`)
- **Prettier:** 100 chars, single quotes, trailing commas
- **IDs:** UUIDv7 (ordenables cronologicamente)
- **request_id:** formato `req_<timestamp>_<random>` generado en middleware

## Testing

- **Framework:** Vitest
- **Web app:** jsdom environment, pattern `src/**/*.test.{ts,tsx}`
- **Shared:** node environment, pattern `src/**/*.test.ts`
- **Smoke tests:** schemas Zod y API response helpers

## Observabilidad minima

Cada request debe tener:
- `request_id` generado en middleware
- Header `X-Request-Id` en response
- Log estructurado: `{ request_id, method, route, status, duration_ms }`

## Tracking del proyecto

Ver `DOCS/14_ROUTE_PLAN.md` para:
- Estado actual de cada area
- Decisiones tomadas con fecha
- Roadmap por fases
- Hitos completados

## Supuestos actuales

1. Tailwind v4 + shadcn: si hay incompatibilidad, usar v3 y migrar despues
2. pino en Edge Runtime: middleware usa alternativa ligera, pino solo en API routes
3. No se requiere Supabase project creado para desarrollo local
4. UUIDv7 via `uuid` package v11+

## Diseno UI (doc 08 seccion 16)

- **Tipografia:** DM Sans (body) + Playfair Display (display) + JetBrains Mono (mono)
- **Paleta:** Indigo oscuro + dorado ambar (tono "refinado-gaming")
- **Animaciones:** CSS-only, reveals escalonados con `animation-delay`
- **Anti-patrones:** NO usar Inter/Arial/Roboto, gradientes purpura, layouts genericos
