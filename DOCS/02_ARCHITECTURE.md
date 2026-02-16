# Arquitectura (alto nivel)

## Tipo de app
- Web App responsiva (PWA-ready)
- Desktop-first, usable en móvil
- Next.js (recomendado) + Shadcn + Tailwind + Lucide
- Temas centralizados en CSS (design tokens)

## Capas
- Frontend: UI/UX + state + validación en tiempo real (llamando backend o librería compartida).
- Backend: reglas, validaciones, recomendador, scraping.
- DB: cartas, printings, mazos, usuarios, precios, métricas, auditoría.
- Servicios: scraping, stats, cache, jobs.

## Decisiones recomendadas
- DB: Postgres (por pg_trgm, JSONB, índices potentes) (Supabase).
- Backend: Node (Fastify/Nest) o Next API routes (si pequeño).
- Validación: librería compartida (paquete) + “autoridad” final en backend.
- Jobs scraping: worker separado.
- Observabilidad: logs estructurados + audit_log.

## No negociables (calidad)
- Modularidad: alta cohesión, bajo acoplamiento.
- Sin dependencias cíclicas entre módulos (ADP).
- Contratos estables: schemas versionados (DTOs / Zod).
- Cada release de módulo tiene changelog y versión (REP).
