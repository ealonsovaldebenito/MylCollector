# 12_OBSERVABILITY_AND_OPS.md (NEW)

## Propósito
Hacer el sistema operable: debug rápido, métricas mínimas, jobs confiables y auditoría trazable.

---

## 1) Correlación: `request_id` como hilo conductor
### Reglas
- Cada request entrante genera `request_id` (ej: `req_<ulid>`).
- Se propaga a:
  - logs estructurados
  - `deck_validation_runs.request_id`
  - `audit_log.request_id`
  - `scrape_jobs.request_id` (si aplica)

### Header recomendado
- Responder `X-Request-Id: <request_id>`

---

## 2) Logging estructurado (JSON)
Campos mínimos por log:
- `ts`
- `level` (debug/info/warn/error)
- `request_id`
- `actor_user_id` (si existe)
- `route`, `method`, `status`
- `duration_ms`
- `entity_type`, `entity_id` (cuando aplique)
- `error_code` (si falla)

No loggear:
- tokens, passwords, refresh tokens
- datos sensibles de colección salvo agregados

---

## 3) Auditoría vs Logs (diferencia contractual)
- Logs: para operación, retención corta, volumen alto.
- Audit_log: contractual, retención larga, acciones sensibles.

Acciones que SIEMPRE van a audit:
- SHARE/REVOKE
- EXPORT
- IMPORT (resultado + ambigüedad)
- PRICE_SUBMIT/VOTE
- MODERATION actions
- CRUD cartas (editor)

---

## 4) Métricas mínimas (sin volverse NASA)
### API
- `http_requests_total{route,status}`
- `http_request_duration_ms{route}`
- `validation_duration_ms`
- `export_pdf_duration_ms`
- `db_query_duration_ms` (agregado si tienes instrumentation)

### Jobs scraping
- `scrape_job_success_total`
- `scrape_job_fail_total`
- `scrape_job_duration_ms`
- `price_rows_inserted_total`
- `source_error_rate{store}`

### Recomendador (cuando exista)
- `pair_stats_build_duration_ms`
- `recommendation_serves_total`
- `recommendation_feedback_rate`

---

## 5) Alertas recomendadas (mínimas)
- 5xx rate > umbral por 10 min
- export PDF p95 > umbral sostenido
- scraping fail rate > umbral por fuente/tienda
- incremento anormal de VALIDATION_ERROR (posible bug release)
- spikes de submissions/votes (posible abuso)

---

## 6) Retención (sana)
- Logs app: 7–30 días (según volumen)
- Audit_log: largo plazo (según compliance/uso)
- Precios históricos: nunca borrar (según spec)
- Deck versions: nunca mutar; se puede soft-delete por usuario (según decisión)

---

## 7) Playbooks (operación)
### “Validación está lenta”
1) revisar p95 `validation_duration_ms`
2) inspeccionar queries más frecuentes
3) revisar índices: deck_version_cards, card_printings joins
4) cache de catálogos (bloques/ediciones) en app

### “Scraper roto”
1) identificar store/source con fail rate
2) aislar parser
3) marcar `price_source` como degraded/pending review
4) no romper UI: mostrar “fuente temporalmente no disponible”

---

## 8) Entornos
- dev: logs verbosos, sin datos reales
- staging: datos seed + pruebas de scraping en modo safe
- prod: rate limit real + auditoría estricta