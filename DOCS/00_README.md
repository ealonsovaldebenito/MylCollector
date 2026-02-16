00
# MYL Deck & Card Platform — Claude Code Pack

Este directorio define cómo el asistente debe trabajar en el proyecto:
- Responde SIEMPRE en español
- Alcance del producto (qué sí / qué no).
- Arquitectura y decisiones técnicas.
- Esquema de datos SQL (fuente de verdad).
- Reglas del motor de validación (auditable).
- Contratos de API (fuente de verdad para integración FE/BE).
- Observabilidad y operación (logs/metrics/tracing/jobs).
- Seguridad, roles, auditoría y threat model.
- Sistema de diseño UI/UX.
- Agentes (roles) y servicios (módulos).
- Workflow y Definition of Done.

## Regla #0 (fuentes de verdad, en orden)
La fuente de verdad funcional es:
1) PRODUCT_SPEC (01)
2) DATA_MODEL_SQL (03)
3) DECK_VALIDATION_ENGINE (04)
4) API_CONTRACTS (11)  

> Nada se inventa “por intuición” si afecta reglas de mazo, integridad de datos o contratos.

## Regla #0.1 (IDs y vocabulario)
Antes de implementar reglas/DB/API, usar:
- 00_GLOSSARY_AND_IDS.md (00)  ← nuevo
Para evitar mezclar card vs printing, deck vs deck_version, edition vs block, etc.

## Regla #1 (cambios que afectan integridad)
Si un cambio afecta integridad/mazos/visibilidad/seguridad, DEBE incluir:
- Migración SQL (con índices + constraints).
- Actualización de validación (04) + catálogo de reglas `rule_id`.
- Actualización de API_CONTRACTS (11) si cambian payloads/endpoints.
- Tests mínimos (unit + integración).
- Observabilidad mínima (12) cuando aplique (trace_id/logs/audit).
- Nota de bugfix/changelog (en el archivo o en release notes del módulo).

## Entregables esperados (siempre)
- Cambios propuestos con justificación (qué mejora y por qué).
- Archivos a crear/modificar (rutas exactas).
- SQL migración + índices + constraints.
- Tipos/contratos (DTOs / schemas Zod) alineados con (11).
- Tests mínimos:
  - Unit (reglas, parsers, normalizadores)
  - Integración (endpoint + DB + RLS básico cuando aplique)
- Checklist DoD cumplida (10).
- Historial de Bug Fixes (breve, por módulo).

## Reglas de output (anti-caos)
- No duplicar lógica: validación “real” vive en (04) y el backend es autoridad final.
- No hardcodear compatibilidades por edición/raza: todo data-driven vía tablas (03).
- Mensajes de validación deben llevar `rule_id` estable + `context_json` estable.
- Si hay conflicto con spec/datos: detenerse y proponer resolución (no adivinar).

## Feature UX clave (aprobadas en el pack)
- Export/Import de mazos:
  - Copiar listado (clipboard)
  - Descargar TXT/CSV/JSON
  - Export PDF (torneo/impresión)
- Compartir mazos por URL (PUBLIC/UNLISTED) con permisos y auditoría.
- Resolver ambigüedad de printings en import (diálogo/wizard).


# Plan
En este plan definido en archivo .md 14_ROUTE_PLAN
debe estar todo el roadmap de nuestro proyecto, cada vez que se cumpla un hito, se debe dejar registrado.
Es el tracking real, debe estar todo el roadmap de nuestro proyecto, cada vez que se cumpla un hito, se debe dejar registrado, ahí iras definiendo lo que se habla y zanja acá. para que vaya quedando registro de todo lo que se habla, lo que se descarta, lo que se define, etc.
