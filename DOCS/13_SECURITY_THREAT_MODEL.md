# 13_SECURITY_THREAT_MODEL.md (NEW)

## Propósito
Threat model liviano para MYL: identificar riesgos reales y mitigaciones prácticas.
No es “paper”; es guía de implementación y revisión.

---

## 1) Activos (qué protegemos)
- Cuentas/sesiones (auth_sessions)
- Colección privada (user_cards)
- Mazos privados (decks/deck_versions PRIVATE)
- Integridad del dataset público (public_decks, co-ocurrencia)
- Integridad de precios (scraping + comunidad + consenso)
- Moderación (acciones y evidencia)
- Infra de jobs scraping (evitar SSRF/abuso)

---

## 2) Actores y motivaciones
- Usuario normal (uso legítimo)
- Spammer (ensuciar precios, links, reportes)
- Competidor (poisoning de recomendaciones/precios)
- Atacante oportunista (XSS/CSRF/IDOR)
- Usuario malicioso autenticado (abuso de endpoints caros, enumeración)
- Supply-chain (dependencias NPM vulnerables)

---

## 3) Superficies de ataque
- Auth endpoints (login, sesiones)
- Endpoints de sharing/public decks
- Import de decklists (TXT/CSV) y export (PDF)
- Community submissions y votes
- Link suggestions y price_sources (posible SSRF indirecto)
- Scrapers/Workers (fetch de URLs)
- UI (XSS) y API (inyección)

---

## 4) Principales amenazas y mitigaciones

### T1 — IDOR (acceso a recursos ajenos)
Riesgo: leer deck_version o colección de otro usuario con IDs.
Mitigación:
- Enforce ownership + visibilidad en backend
- RLS en DB cuando aplique
- share_code como “capability” para UNLISTED (no exponer uuid privado)

### T2 — Account Takeover
Riesgo: credenciales robadas / fuerza bruta.
Mitigación:
- rate limit login + backoff
- hashing fuerte
- invalidación de sesiones al cambiar password
- alertas de login sospechoso (opcional)

### T3 — CSRF / sesión abusada
Mitigación:
- SameSite cookies + CSRF token para POST sensibles (si cookie-based)
- CORS estricto

### T4 — XSS (reflejado o almacenado)
Vectores:
- nombres de mazos, notas de submissions, textos importados
Mitigación:
- sanitizar output en UI
- validar input (Zod) + limitar longitud + permitir solo subset seguro
- CSP (Content-Security-Policy) razonable

### T5 — SSRF / fetch malicioso en scraping
Vectores:
- usuarios sugieren links a “tiendas”
Mitigación:
- Moderación obligatoria antes de scraping
- Allowlist de dominios por store
- Bloquear IP ranges internos/metadata endpoints
- Timeouts + tamaño máximo + user-agent controlado

### T6 — Poisoning de precios (comunidad)
Mitigación:
- cooldown semanal por carta
- votos con reputación mínima (opcional)
- detección de outliers
- `explain_json` obligatorio en consenso (transparencia)
- rate limit submissions/votes

### T7 — DoS por endpoints caros (PDF/recommendations/search)
Mitigación:
- rate limit por usuario/IP
- colas para PDF (si se vuelve pesado)
- caching de resultados (catálogos, stats)
- límites estrictos de `limit` paginación

### T8 — Inyección (SQL/NoSQL)
Mitigación:
- queries parametrizadas
- evitar concatenación de filtros
- validación de payloads
- permisos mínimos DB

### T9 — Supply chain
Mitigación:
- lockfile estricto
- auditoría de dependencias
- actualizaciones regulares
- CI con escaneo básico

---

## 5) Trust boundaries (modelo simple)
- Browser/UI (no confiable)
- API Backend (autoridad)
- DB (enforce adicional con RLS)
- Workers/Jobs (privilegiados, solo internal)
- Fuentes externas (no confiables)

---

## 6) Controles mínimos obligatorios (checklist)
- [ ] Ownership/visibilidad en cada endpoint sensible (decks, versions, collection)
- [ ] Rate limit en login, export, share, submit/vote
- [ ] `request_id` en respuestas y logs
- [ ] audit_log para acciones sensibles
- [ ] Validación Zod de inputs (longitudes, enums, formatos)
- [ ] CSP + sanitización output UI
- [ ] Allowlist + moderación para URLs de scraping
- [ ] No filtrar datos privados en endpoints públicos

---

## 7) Tests de seguridad (mínimos)
- Intento de leer deck PRIVATE de otro usuario (debe fallar)
- share_code permite leer UNLISTED, pero no lista en índice público
- import con payload gigante (debe rechazar por size limit)
- submissions spam (rate limit/cooldown se aplica)
- SSRF: URL a IP interna (debe ser bloqueada en worker)

---

## Nota de plataforma
El stack recomendado incluye Postgres gestionado vía :contentReference[oaicite:0]{index=0}, pero estas mitigaciones aplican igual si corres Postgres + API por tu cuenta: el diseño manda, no la marca.

