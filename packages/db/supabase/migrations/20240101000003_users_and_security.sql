-- Migration: Users, Roles, and Audit Log
-- Description: User profiles linked to Supabase Auth, role system, audit trail
-- Doc reference: 03_DATA_MODEL_SQL.md, 00_GLOSSARY_AND_IDS.md

-- ============================================================================
-- USERS (profile linked to auth.users)
-- ============================================================================
CREATE TABLE users (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROLES
-- ============================================================================
CREATE TABLE roles (
  role_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  description  text
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
  ('user', 'Default registered user'),
  ('moderator', 'Can moderate content and prices'),
  ('admin', 'Full administrative access');

-- ============================================================================
-- USER ROLES (many-to-many)
-- ============================================================================
CREATE TABLE user_roles (
  user_id     uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id     uuid NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  granted_by  uuid REFERENCES users(user_id),
  PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- AUDIT LOG
-- Doc 03 upgrade: request_id, user_agent, session_id, ip for traceability
-- ============================================================================
CREATE TABLE audit_log (
  audit_log_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   uuid REFERENCES users(user_id),
  action          audit_action NOT NULL,
  entity_type     text NOT NULL,
  entity_id       uuid,
  old_data        jsonb,
  new_data        jsonb,
  request_id      text,
  user_agent      text,
  session_id      uuid,
  ip              inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Doc 03: recommended indexes for audit_log
CREATE INDEX idx_audit_log_actor_time ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_request_id ON audit_log(request_id);

-- ============================================================================
-- USER CARDS (personal collection)
-- ============================================================================
CREATE TABLE user_cards (
  user_card_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  condition_id      uuid REFERENCES card_conditions(condition_id),
  qty               int NOT NULL DEFAULT 1 CHECK (qty > 0),
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_user_card_printing_condition
    UNIQUE (user_id, card_printing_id, condition_id)
);

CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);
