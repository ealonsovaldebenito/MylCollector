# 09 — Agentes y Servicios

## Como opera Claude en este proyecto

Claude trabaja como un equipo de agentes especializados. Cada agente:
- Tiene un ambito de responsabilidad claro y acotado
- Produce entregables verificables y concretos
- No invade el territorio de otros agentes (bajo acoplamiento)
- Usa contratos compartidos (schemas Zod, DTOs, tipos)
- Respeta la jerarquia de fuentes de verdad: 01 → 03 → 04 → 11
- Incluye observabilidad (12) y hardening (13) cuando corresponda

### Regla anti-deriva

Si un cambio afecta DB/validador/API/UI, debe:
1. Reflejarse en el doc correspondiente (03, 04, 11, 08)
2. Incluir migracion SQL si toca schema
3. Incluir tests minimos (A8)
4. Incluir observabilidad (A10) si es accion sensible
5. Pasar revision de seguridad (A9) si toca auth/permisos/datos privados

---

## Agentes (11 roles)

### A1 — Backend Architect

**Ambito:** Diseno de API, estructura de servicios, patrones de integracion.

**Responsabilidades:**
- Diseno REST con versionado `/api/v1`
- Estructura de modulos y boundaries (sin ciclos)
- Patrones: jobs, queues, caches, rate limiting
- Control de ownership/visibilidad (PRIVATE/UNLISTED/PUBLIC)

**Entregables:**
- Rutas API + DTOs Zod (alineado con 11_API_CONTRACTS)
- Errores estandar + `request_id` (alineado con 12)
- Permisos y rate limit por endpoint (alineado con 13)

**NO hace:** Definir schema DB (eso es A2), implementar UI (eso es A4).

---

### A2 — SQL/Data Modeler

**Ambito:** Modelo de datos, migraciones, performance de queries.

**Responsabilidades:**
- Migraciones SQL (up/down)
- Indices y constraints
- RLS policies (Supabase)
- Optimizacion de queries

**Entregables:**
- Migraciones completas en `packages/db/supabase/migrations/`
- Justificacion de indices (por que ese indice)
- Tests de integridad si aplica
- Tipos generados via `supabase gen types`

**NO hace:** Definir logica de negocio (eso es A3), disenar API (eso es A1).

---

### A3 — Deck Rules Engineer

**Ambito:** Motor de validacion, reglas data-driven, mensajes explicables.

**Responsabilidades:**
- Implementar motor de validacion (segun 04)
- Catalogo de reglas con `rule_id` estable
- Mensajes deterministas (mismo input → mismo output + orden)
- Parametrizacion via tablas (format_rules, format_card_limits)

**Entregables:**
- Libreria de validacion en `packages/shared/src/validation/`
- Set de reglas iniciales con tests unitarios
- Output canonico: `{ rule_id, rule_version, severity, message, hint, entity_ref, context_json }`
- Orden estable de mensajes (BLOCK primero, luego WARN, luego INFO)

**NO hace:** Renderizar mensajes en UI (eso es A4), definir schema DB (eso es A2).

---

### A4 — Frontend Engineer

**Ambito:** Implementacion de paginas, componentes, integracion con API.

**Responsabilidades:**
- Paginas Next.js (App Router)
- Componentes React con Shadcn UI
- Estados, hooks, data fetching
- Integracion con API (11)
- Estados UI obligatorios: loading, error, empty

**Entregables:**
- Paginas: Catalogo, Builder, Mis Mazos, Coleccion, Precios, Comunidad, Admin
- Builder con 3 columnas: catalogo | mazo | validacion+metricas
- Import/Export: clipboard, TXT/CSV/JSON/PDF, wizard de ambiguedad
- Accesibilidad basica (teclado, focus, contraste)

**NO hace:** Definir estetica visual (eso es A11), definir reglas de validacion (eso es A3).

---

### A5 — UX Reviewer

**Ambito:** Revision de experiencia de usuario, friccion, flujos.

**Responsabilidades:**
- Evaluar "3 segundos para entender que hacer aqui"
- Reducir friccion innecesaria
- Verificar jerarquia de acciones (1 CTA primario por vista)
- Validar feedback inmediato ante errores/validacion

**Entregables:**
- Checklist UX por pantalla
- Recomendaciones concretas (no abstractas)
- Identificacion de puntos de friccion
- Validacion de estados empty/error/loading

**NO hace:** Implementar codigo (eso es A4), definir estetica (eso es A11).

---

### A11 — Frontend Design Engineer (NUEVO)

**Ambito:** Direccion estetica, sistema de diseno, identidad visual distintiva.

**Responsabilidades:**
- Definir direccion estetica del proyecto (tono, personalidad visual)
- Sistema de tipografia (fuentes display, body, mono)
- Paleta de colores con intencion (dominantes + acentos)
- Motion design (animaciones, transiciones, micro-interacciones)
- Composicion espacial (layouts con caracter, no genericos)
- Texturas, fondos, detalles visuales que crean atmosfera

**Principios (basado en Claude Code Frontend Design Skill):**

1. **Design Thinking antes de codear:**
   - Proposito: que problema resuelve esta interfaz?
   - Tono: elegir direccion estetica clara (refinado-gaming para MYL)
   - Diferenciador: que hace esta UI memorable?

2. **Tipografia distintiva:**
   - NO usar fuentes genericas (Inter, Arial, Roboto, system-ui)
   - Elegir fuentes con caracter que eleven la estetica
   - Par recomendado: display distintiva + body refinada + mono para datos

3. **Color con intencion:**
   - Colores dominantes con acentos fuertes
   - NO paletas timidas distribuidas uniformemente
   - CSS variables para consistencia
   - Dark mode como opcion real, no accesorio

4. **Motion de alto impacto:**
   - Priorizar CSS-only para animaciones
   - Foco en momentos clave: page load con reveals escalonados
   - Hover states que sorprendan pero no distraigan
   - `animation-delay` para stagger effects

5. **Composicion con caracter:**
   - Layouts con intencion (asimetria controlada, negative space)
   - Grid-breaking elements para llamar atencion
   - Evitar layouts predecibles y cookie-cutter

6. **Anti-patrones PROHIBIDOS:**
   - Font families genericas (Inter, Roboto, Arial)
   - Gradientes purpura sobre blanco
   - Layouts sin caracter contextual
   - Diseno que luce "generado por IA"
   - Convergencia en elecciones comunes (Space Grotesk, etc.)

**Entregables:**
- Design tokens en `globals.css` (colores, tipografia, spacing, radius)
- Definicion de fuentes (font-display, font-sans, font-mono)
- Keyframes y clases de animacion reutilizables
- Guia de tono visual para el proyecto
- Revision de componentes para asegurar coherencia estetica

**NO hace:** Implementar logica de negocio (eso es A4), definir flujos UX (eso es A5).

---

### A6 — Pricing/Scraping Engineer

**Ambito:** Pipeline de scraping, normalizacion de precios, resiliencia.

**Responsabilidades:**
- Jobs de scraping con adapters por tienda
- Normalizacion de monedas (CLP base)
- Historico de precios (nunca borrar)
- Resiliencia ante cambios externos (timeouts, retries, fallbacks)

**Entregables:**
- Store adapters con allowlist de dominios
- Validaciones anti-rotura (size limits, timeouts)
- Logs de success/fail con reason (alineado con 12)
- Hardening SSRF y moderacion previa (alineado con 13)

**NO hace:** Definir UI de precios (eso es A4), calcular consenso (eso es logica de svc/pricing).

---

### A7 — Recommender Engineer

**Ambito:** Sistema de recomendaciones basado en co-ocurrencia.

**Responsabilidades:**
- Jobs para construir matriz `card_pair_stats`
- Metricas: support, confidence, lift
- Explicabilidad obligatoria (por que aparece esta sugerencia)
- Feedback loop (added/ignored/dismissed)

**Entregables:**
- Job de co-ocurrencia sobre public_decks
- Endpoint de sugerencias (alineado con 11)
- Explicacion del score en cada sugerencia
- Metrica de utilidad via feedback

**NO hace:** Inventar "magia" sin datos, hardcodear compatibilidades.

---

### A8 — QA / Test Engineer

**Ambito:** Tests automatizados, casos borde, regresion.

**Responsabilidades:**
- Tests unitarios (vitest)
- Tests de integracion (API + DB)
- Casos borde criticos
- Regresion minima por release

**Entregables:**
- Test plan por feature
- Suites automatizadas:
  - Validacion: `rule_id` y orden estable
  - Sharing: visibilidad PRIVATE/UNLISTED/PUBLIC
  - Import: resolucion de ambiguedad
  - Export: no rompe aunque mazo sea invalido
  - Pricing: cooldown + rate limit
- Pruebas de seguridad basicas (IDOR, rate limit) alineadas con 13

**NO hace:** Implementar features (eso es A4/A1), definir reglas (eso es A3).

---

### A9 — Security Reviewer

**Ambito:** Auth, permisos, hardening, auditoria.

**Responsabilidades:**
- Validar auth y roles
- Hardening de endpoints sensibles
- Auditoria de acciones criticas
- Threat model liviano

**Entregables:**
- Checklist OWASP basico
- Recomendaciones de rate limit / logging / audit
- Revision de superficies sensibles:
  - Sharing, export PDF, import parsers, scraping URLs, submissions/votes
- Bloqueo si hay huecos de seguridad criticos

**NO hace:** Implementar features, solo valida y bloquea si hay riesgo.

---

### A10 — Observability / Ops Engineer

**Ambito:** Logging, metricas, alertas, playbooks operativos.

**Responsabilidades:**
- Estandares de logging estructurado
- Metricas minimas (latencia, errores, jobs)
- Alertas basicas
- Playbooks para incidentes comunes

**Entregables:**
- Formato de logs (alineado con 12)
- Metricas: latency/endpoint, 5xx rate, scraper success/fail, validation_duration_ms
- Alertas recomendadas
- Playbooks: validacion lenta, scraper roto, picos de abuso

**NO hace:** Implementar features, solo define estandares y playbooks.

---

## Servicios (modulos del sistema)

### Estructura de carpetas

```
apps/web/src/app/api/v1/
├── health/
├── catalog/          # svc/catalog
├── cards/            # svc/cards
├── decks/            # svc/decks
├── validation/       # svc/validation
├── collection/       # svc/collection
├── prices/           # svc/pricing
├── recommendations/  # svc/recommendations
├── admin/            # svc/admin
└── auth/             # svc/auth
```

### Definicion de servicios

| Servicio | Responsabilidad | Dependencias |
|----------|-----------------|--------------|
| svc/catalog | Blocks, editions, races, types, rarities | DB read-only |
| svc/cards | Cards, printings, busqueda fuzzy | svc/catalog |
| svc/decks | Decks, versions, deck_cards, sharing | svc/cards, svc/validation |
| svc/validation | Engine, rules, runs, messages | svc/cards, format_rules |
| svc/collection | user_cards (stock personal) | svc/cards |
| svc/pricing | Sources, prices, consensus, community submissions | svc/cards |
| svc/scraper | Jobs, adapters por tienda | svc/pricing |
| svc/recommendations | card_pair_stats, serving, feedback | svc/cards, public_decks |
| svc/moderation | Reports, link_suggestions, actions | svc/auth |
| svc/auth | Sessions, roles, users | DB |
| svc/export | Export TXT/CSV/JSON/PDF, import parsers | svc/decks |

### Diagrama de dependencias

```
                    ┌─────────────┐
                    │  svc/auth   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ svc/catalog │    │svc/moderation│   │svc/collection│
└──────┬──────┘    └─────────────┘    └──────┬──────┘
       │                                      │
       ▼                                      │
┌─────────────┐                               │
│  svc/cards  │◄──────────────────────────────┘
└──────┬──────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│svc/validation│   │ svc/pricing │    │svc/recommend│
└──────┬──────┘    └──────┬──────┘    └─────────────┘
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│  svc/decks  │    │ svc/scraper │
└──────┬──────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│ svc/export  │
└─────────────┘
```

---

## Matriz de responsabilidades

| Cambio en... | Agente principal | Agentes de revision |
|--------------|------------------|---------------------|
| Schema DB | A2 | A1, A9 |
| API endpoints | A1 | A8, A9, A10 |
| Reglas validacion | A3 | A8 |
| Paginas/componentes | A4 | A5, A11 |
| Estetica/design tokens | A11 | A5 |
| Flujos UX | A5 | A4 |
| Scraping/precios | A6 | A9, A10 |
| Recomendador | A7 | A8 |
| Tests | A8 | — |
| Seguridad | A9 | — |
| Observabilidad | A10 | — |

---

## Limites de responsabilidad (anti-solapamiento)

1. **A3 define reglas, A4 las renderiza.** A4 no inventa logica de validacion.
2. **A2 define schema, A1 lo consume.** A1 no reinventa constraints en la API.
3. **A11 define estetica, A4 la implementa.** A4 no toma decisiones de diseno visual.
4. **A5 revisa UX, no implementa.** A5 da feedback, A4 ejecuta.
5. **A10 define estandares de logging, todos los aplican.**
6. **A9 valida y bloquea, no implementa features.**

---

## Flujo tipico de implementacion de feature

```
1. A5 define flujo UX (wireframe mental)
      │
2. A11 define direccion estetica
      │
3. A2 crea migracion SQL si necesita datos nuevos
      │
4. A1 disena endpoints API
      │
5. A3 implementa reglas de validacion (si aplica)
      │
6. A4 implementa frontend (paginas + componentes)
      │
7. A8 escribe tests
      │
8. A9 revisa seguridad
      │
9. A10 verifica observabilidad
```

---

## Notas para MYL

- **Tono visual:** Refinado-gaming. Limpio, preciso, con acentos dorados que transmiten competitividad.
- **Fuentes definidas:** DM Sans (body), Playfair Display (display), JetBrains Mono (mono).
- **Paleta:** Indigo oscuro + dorado ambar (light), azul noche + dorado luminoso (dark).
- **Diferenciador UI:** Validacion en vivo como pieza central visual. Las restricciones son visibles, no ocultas.
