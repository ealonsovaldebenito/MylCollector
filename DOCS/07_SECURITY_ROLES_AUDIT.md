# Seguridad, roles y auditoría (UPGRADED)

Este módulo se mantiene, pero se refuerza con:
- Threat model liviano (13)
- Rate limiting y anti-abuso
- Trazabilidad (request_id) en audit
- Control de visibilidad (PRIVATE/UNLISTED/PUBLIC) consistente

---

## Autenticación
- Email + password_hash (recomendado Argon2id o bcrypt con costo alto)
- auth_sessions:
  - refresh_token_hash (si aplica)
  - expires_at
  - rotated_at (si implementas rotación)
- Cookies:
  - HttpOnly + Secure + SameSite=Lax/Strict (según flujos)
- Protección:
  - rate limit login
  - lockout progresivo (suave) ante fallos
  - opcional: email verification antes de acciones sensibles (precios/links)

---

## Autorización (RBAC + ownership)
Roles:
- admin
- moderator
- editor (cartas)
- user

Reglas:
- Colección (`user_cards`) siempre privada por defecto.
- Mazos:
  - PRIVATE: solo owner
  - UNLISTED: acceso por `share_code`
  - PUBLIC: listado y accesible
- Acciones de moderación siempre auditadas.

Recomendación DB:
- RLS (Row Level Security) para enforcement en capa DB cuando sea posible.

---

## Auditoría (no negociable)
audit_log:
- actor_user_id
- entity_type, entity_id
- action (CREATE/UPDATE/DELETE/APPROVE/REJECT/EXPORT/SHARE/IMPORT)
- before_json, after_json
- request_id (correlación)
- ip (si aplica), user_agent, session_id
- created_at

Eventos clave a auditar:
- SHARE_DECK / REVOKE_SHARE
- EXPORT_DECK (pdf/txt/csv/json)
- IMPORT_DECK (con resultado: resolved/ambiguous)
- PRICE_SUBMIT / PRICE_VOTE / CONSENSUS_UPDATE
- MODERATION_ACTIONS

---

## Moderación (mínimo viable)
- links sugeridos:
  - pending / approved / rejected
- acciones auditadas
- límites anti-spam:
  - cooldown por usuario
  - rate limit por IP/usuario
  - flagging de fuentes sospechosas

---

## Anti-abuso (recomendado)
- Rate limiting:
  - login, search, export, price submissions, share create
- Throttling de endpoints “caros” (export PDF, recomendaciones, scraping triggers)
- Validación estricta de input (Zod)
- Sanitización de strings para UI (evitar XSS reflejado)

---

## Referencia obligatoria
- Ver 13_SECURITY_THREAT_MODEL.md para riesgos y mitigaciones por módulo.

