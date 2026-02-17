-- File: packages/db/SETUP_COMPLETO.sql
-- Context: Instalación/actualización completa del schema para Supabase SQL Editor.
-- Description: Script multi-statement para dejar la BD lista (tablas, índices, triggers, RLS y storage). Sin seeds.
-- Relationships:
--   - Base de: `DOCS/SQL/QUERYS.sql` (script unificado para ejecutar en Supabase).
--   - Complementa: `packages/db/supabase/migrations/*.sql` (migraciones incrementales del repo).
-- Changelog:
--   - 2026-02-17: Se elimina PARTE 2 (seeds) del setup por requerimiento: este archivo NO inserta catálogo.
--   - 2026-02-17: Script re-ejecutable (idempotente) sin inserción de catálogo.

-- ============================================
-- SETUP COMPLETO - MYL Platform
-- ============================================
-- Archivo único con TODAS las queries necesarias para configurar
-- el proyecto MYL en Supabase desde cero.
--
-- INSTRUCCIONES DE USO:
-- 1. Crear proyecto en Supabase (https://supabase.com)
-- 2. Ir a SQL Editor en el dashboard
-- 3. Copiar y pegar este archivo completo
-- 4. Ejecutar (Run)
-- 5. Verificar que no haya errores
--
-- CONTENIDO:
-- - Parte 1: Migraciones (schema completo, constraints, triggers, RLS)
-- - Parte 2: (sin seeds) - intencionalmente vacío
-- - Parte 3: Storage bucket para imágenes
-- ============================================

-- ============================================
-- PARTE 1: MIGRACIONES (SCHEMA COMPLETO)
-- ============================================

-- ============================================================================
-- Migration 1: Extensions and Enums
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum Types (idempotent)
DO $$ BEGIN
  CREATE TYPE visibility_level AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE validation_severity AS ENUM ('BLOCK', 'WARN', 'INFO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE legal_status_type AS ENUM ('LEGAL', 'RESTRICTED', 'BANNED', 'DISCONTINUED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE moderation_action_type AS ENUM ('APPROVE', 'REJECT', 'WARN', 'BAN', 'UNBAN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'SHARE', 'EXPORT',
    'IMPORT', 'VALIDATE', 'SUBMIT_PRICE', 'VOTE', 'REPORT'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Migration 2: Catalog Tables
-- ============================================================================

-- BLOCKS
CREATE TABLE IF NOT EXISTS blocks (
  block_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL UNIQUE,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- EDITIONS
CREATE TABLE IF NOT EXISTS editions (
  edition_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      uuid NOT NULL REFERENCES blocks(block_id),
  name          text NOT NULL,
  code          text NOT NULL UNIQUE,
  release_date  date,
  sort_order    int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS idx_editions_block_id;
CREATE INDEX idx_editions_block_id ON editions(block_id);

-- CARD TYPES
CREATE TABLE IF NOT EXISTS card_types (
  card_type_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  code          text NOT NULL UNIQUE,
  sort_order    int  NOT NULL DEFAULT 0
);

-- RACES
CREATE TABLE IF NOT EXISTS races (
  race_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL UNIQUE,
  sort_order  int  NOT NULL DEFAULT 0
);

-- RARITY TIERS
CREATE TABLE IF NOT EXISTS rarity_tiers (
  rarity_tier_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  code            text NOT NULL UNIQUE,
  sort_order      int  NOT NULL DEFAULT 0
);

-- RARITY ERAS
CREATE TABLE IF NOT EXISTS rarity_eras (
  rarity_era_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  code                    text NOT NULL UNIQUE,
  applies_from_edition_id uuid REFERENCES editions(edition_id),
  sort_order              int  NOT NULL DEFAULT 0
);

-- CURRENCIES
CREATE TABLE IF NOT EXISTS currencies (
  currency_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  symbol       text NOT NULL
);

-- STORES
CREATE TABLE IF NOT EXISTS stores (
  store_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  url          text,
  currency_id  uuid REFERENCES currencies(currency_id),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- LANGUAGES
CREATE TABLE IF NOT EXISTS languages (
  language_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL
);

-- FINISHES
CREATE TABLE IF NOT EXISTS finishes (
  finish_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  name       text NOT NULL
);

-- CARD CONDITIONS
CREATE TABLE IF NOT EXISTS card_conditions (
  condition_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  sort_order    int  NOT NULL DEFAULT 0
);

-- ============================================================================
-- Migration 3: Cards and Card Printings
-- ============================================================================

-- CARDS
CREATE TABLE IF NOT EXISTS cards (
  card_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  name_normalized      text NOT NULL,
  card_type_id         uuid NOT NULL REFERENCES card_types(card_type_id),
  race_id              uuid REFERENCES races(race_id),
  ally_strength        int,
  cost                 int,
  is_unique            boolean NOT NULL DEFAULT false,
  has_ability          boolean NOT NULL DEFAULT false,
  can_be_starting_gold boolean NOT NULL DEFAULT false,
  text                 text,
  flavor_text          text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_ally_strength_positive CHECK (ally_strength IS NULL OR ally_strength > 0)
);

DROP INDEX IF EXISTS idx_cards_name_trgm;
CREATE INDEX idx_cards_name_trgm ON cards USING gin (name gin_trgm_ops);

DROP INDEX IF EXISTS idx_cards_name_normalized;
CREATE INDEX idx_cards_name_normalized ON cards(name_normalized);

-- CARD PRINTINGS
CREATE TABLE IF NOT EXISTS card_printings (
  card_printing_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id           uuid NOT NULL REFERENCES cards(card_id),
  edition_id        uuid NOT NULL REFERENCES editions(edition_id),
  rarity_tier_id    uuid REFERENCES rarity_tiers(rarity_tier_id),
  rarity_era_id     uuid REFERENCES rarity_eras(rarity_era_id),
  language_id       uuid REFERENCES languages(language_id),
  finish_id         uuid REFERENCES finishes(finish_id),
  printing_variant  text NOT NULL DEFAULT 'standard',
  collector_number  text,
  image_url         text,
  illustrator       text,
  legal_status      legal_status_type NOT NULL DEFAULT 'LEGAL',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_card_printing_identity
    UNIQUE (card_id, edition_id, language_id, finish_id, printing_variant)
);

DROP INDEX IF EXISTS idx_card_printings_edition_rarity;
CREATE INDEX idx_card_printings_edition_rarity ON card_printings(edition_id, rarity_tier_id);

DROP INDEX IF EXISTS idx_card_printings_card_edition;
CREATE INDEX idx_card_printings_card_edition ON card_printings(card_id, edition_id);

-- FK behaviors (idempotent):
-- - Si borras una edición, se borran automáticamente sus printings (edition es requerida).
-- - Si borras una rareza, los printings quedan con rareza NULL (rareza es opcional).
ALTER TABLE card_printings
  DROP CONSTRAINT IF EXISTS card_printings_edition_id_fkey;
ALTER TABLE card_printings
  ADD CONSTRAINT card_printings_edition_id_fkey
  FOREIGN KEY (edition_id) REFERENCES editions(edition_id)
  ON DELETE CASCADE;

ALTER TABLE card_printings
  DROP CONSTRAINT IF EXISTS card_printings_rarity_tier_id_fkey;
ALTER TABLE card_printings
  ADD CONSTRAINT card_printings_rarity_tier_id_fkey
  FOREIGN KEY (rarity_tier_id) REFERENCES rarity_tiers(rarity_tier_id)
  ON DELETE SET NULL;

-- TRIGGER: validate ally_strength
CREATE OR REPLACE FUNCTION trg_validate_ally_strength()
RETURNS trigger AS $$
DECLARE
  v_card_type_code text;
BEGIN
  SELECT code INTO v_card_type_code
  FROM card_types
  WHERE card_type_id = NEW.card_type_id;

  IF v_card_type_code = 'ALIADO' AND NEW.ally_strength IS NULL THEN
    RAISE EXCEPTION 'ALIADO cards must have ally_strength set';
  END IF;

  IF v_card_type_code != 'ALIADO' AND NEW.ally_strength IS NOT NULL THEN
    RAISE EXCEPTION 'Non-ALIADO cards must not have ally_strength';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cards_ally_strength ON cards;
CREATE TRIGGER trg_cards_ally_strength
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION trg_validate_ally_strength();

-- TAGS
CREATE TABLE IF NOT EXISTS tags (
  tag_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_tags (
  card_id  uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

DROP INDEX IF EXISTS idx_card_tags_tag;
CREATE INDEX idx_card_tags_tag ON card_tags(tag_id);

-- ============================================================================
-- Migration 4: Users and Security
-- ============================================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ROLES
CREATE TABLE IF NOT EXISTS roles (
  role_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  description  text
);

INSERT INTO roles (name, description) VALUES
  ('user', 'Default registered user'),
  ('moderator', 'Can moderate content and prices'),
  ('admin', 'Full administrative access')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- USER ROLES
CREATE TABLE IF NOT EXISTS user_roles (
  user_id     uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id     uuid NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  granted_by  uuid REFERENCES users(user_id),
  PRIMARY KEY (user_id, role_id)
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
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

DROP INDEX IF EXISTS idx_audit_log_actor_time;
CREATE INDEX idx_audit_log_actor_time ON audit_log(actor_user_id, created_at DESC);

DROP INDEX IF EXISTS idx_audit_log_entity;
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at DESC);

DROP INDEX IF EXISTS idx_audit_log_request_id;
CREATE INDEX idx_audit_log_request_id ON audit_log(request_id);

-- USER CARDS
CREATE TABLE IF NOT EXISTS user_cards (
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

DROP INDEX IF EXISTS idx_user_cards_user_id;
CREATE INDEX idx_user_cards_user_id ON user_cards(user_id);

-- ============================================================================
-- Migration 5: Formats and Rules
-- ============================================================================

-- FORMATS
CREATE TABLE IF NOT EXISTS formats (
  format_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  code         text NOT NULL UNIQUE,
  description  text,
  is_active    boolean NOT NULL DEFAULT true,
  params_json  jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- FORMAT RULES
CREATE TABLE IF NOT EXISTS format_rules (
  format_rule_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id       uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  rule_id         text NOT NULL,
  params_json     jsonb NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS idx_format_rules_format;
CREATE INDEX idx_format_rules_format ON format_rules(format_id);

-- FORMAT ALLOWED BLOCKS
CREATE TABLE IF NOT EXISTS format_allowed_blocks (
  format_id  uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  block_id   uuid NOT NULL REFERENCES blocks(block_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, block_id)
);

-- FORMAT ALLOWED EDITIONS
CREATE TABLE IF NOT EXISTS format_allowed_editions (
  format_id   uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  edition_id  uuid NOT NULL REFERENCES editions(edition_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, edition_id)
);

-- FORMAT ALLOWED CARD TYPES
CREATE TABLE IF NOT EXISTS format_allowed_card_types (
  format_id     uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  card_type_id  uuid NOT NULL REFERENCES card_types(card_type_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, card_type_id)
);

-- FORMAT ALLOWED RACES
CREATE TABLE IF NOT EXISTS format_allowed_races (
  format_id  uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  race_id    uuid NOT NULL REFERENCES races(race_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, race_id)
);

-- FORMAT CARD LIMITS
CREATE TABLE IF NOT EXISTS format_card_limits (
  format_card_limit_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id             uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  card_id               uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  max_qty               int NOT NULL CHECK (max_qty >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_format_card_limit UNIQUE (format_id, card_id)
);

DROP INDEX IF EXISTS idx_format_card_limits_lookup;
CREATE INDEX idx_format_card_limits_lookup ON format_card_limits(format_id, card_id);

-- ============================================================================
-- Migration 6: Decks and Validation
-- ============================================================================

-- DECKS
CREATE TABLE IF NOT EXISTS decks (
  deck_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  format_id    uuid NOT NULL REFERENCES formats(format_id),
  name         text NOT NULL,
  description  text,
  visibility   visibility_level NOT NULL DEFAULT 'PRIVATE',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS idx_decks_user_id;
CREATE INDEX idx_decks_user_id ON decks(user_id);

-- DECK VERSIONS
CREATE TABLE IF NOT EXISTS deck_versions (
  deck_version_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id          uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  version_number   int NOT NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_deck_version_number UNIQUE (deck_id, version_number)
);

DROP INDEX IF EXISTS idx_deck_versions_deck_id;
CREATE INDEX idx_deck_versions_deck_id ON deck_versions(deck_id);

-- DECK VERSION CARDS
CREATE TABLE IF NOT EXISTS deck_version_cards (
  deck_version_card_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id       uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  card_printing_id      uuid NOT NULL REFERENCES card_printings(card_printing_id),
  qty                   int NOT NULL CHECK (qty > 0),
  is_starting_gold      boolean NOT NULL DEFAULT false,
  is_key_card           boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_deck_version_card UNIQUE (deck_version_id, card_printing_id)
);

DROP INDEX IF EXISTS idx_deck_version_cards_version;
CREATE INDEX idx_deck_version_cards_version ON deck_version_cards(deck_version_id);

-- DECK VALIDATION RUNS
CREATE TABLE IF NOT EXISTS deck_validation_runs (
  validation_run_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id    uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  format_id          uuid NOT NULL REFERENCES formats(format_id),
  is_valid           boolean NOT NULL,
  duration_ms        int,
  computed_stats     jsonb,
  request_id         text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS idx_validation_runs_version;
CREATE INDEX idx_validation_runs_version ON deck_validation_runs(deck_version_id);

-- DECK VALIDATION MESSAGES
CREATE TABLE IF NOT EXISTS deck_validation_messages (
  validation_message_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_run_id      uuid NOT NULL REFERENCES deck_validation_runs(validation_run_id) ON DELETE CASCADE,
  rule_id                text NOT NULL,
  rule_version           int NOT NULL DEFAULT 1,
  severity               validation_severity NOT NULL,
  message                text NOT NULL,
  hint                   text,
  entity_ref             jsonb,
  context_json           jsonb,
  sort_order             int NOT NULL DEFAULT 0
);

DROP INDEX IF EXISTS idx_validation_messages_run;
CREATE INDEX idx_validation_messages_run ON deck_validation_messages(validation_run_id);

DROP INDEX IF EXISTS idx_validation_messages_rule;
CREATE INDEX idx_validation_messages_rule ON deck_validation_messages(rule_id);

-- DECK STATS SNAPSHOTS
CREATE TABLE IF NOT EXISTS deck_stats_snapshots (
  snapshot_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id  uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  stats_json       jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Migration 7: Sharing and Prices
-- ============================================================================

-- DECK SHARES
CREATE TABLE IF NOT EXISTS deck_shares (
  share_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code        text NOT NULL UNIQUE,
  deck_version_id   uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  visibility        visibility_level NOT NULL DEFAULT 'UNLISTED',
  created_by        uuid NOT NULL REFERENCES users(user_id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz
);

DROP INDEX IF EXISTS idx_deck_shares_share_code;
CREATE INDEX idx_deck_shares_share_code ON deck_shares(share_code);

DROP INDEX IF EXISTS idx_deck_shares_version;
CREATE INDEX idx_deck_shares_version ON deck_shares(deck_version_id);

-- PUBLIC DECKS
CREATE TABLE IF NOT EXISTS public_decks (
  public_deck_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id  uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  tags             text[] DEFAULT '{}',
  published_by     uuid NOT NULL REFERENCES users(user_id),
  published_at     timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- PUBLIC DECK CARDS
CREATE TABLE IF NOT EXISTS public_deck_cards (
  public_deck_card_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_deck_id       uuid NOT NULL REFERENCES public_decks(public_deck_id) ON DELETE CASCADE,
  card_printing_id     uuid NOT NULL REFERENCES card_printings(card_printing_id),
  qty                  int NOT NULL CHECK (qty > 0),
  is_starting_gold     boolean NOT NULL DEFAULT false,
  is_key_card          boolean NOT NULL DEFAULT false
);

DROP INDEX IF EXISTS idx_public_deck_cards_deck;
CREATE INDEX idx_public_deck_cards_deck ON public_deck_cards(public_deck_id);

-- PRICE SOURCES
CREATE TABLE IF NOT EXISTS price_sources (
  price_source_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid REFERENCES stores(store_id),
  name             text NOT NULL,
  url              text,
  source_type      text NOT NULL DEFAULT 'scrape',
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- SCRAPE JOBS
CREATE TABLE IF NOT EXISTS scrape_jobs (
  scrape_job_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_source_id  uuid NOT NULL REFERENCES price_sources(price_source_id),
  status           text NOT NULL DEFAULT 'pending',
  started_at       timestamptz,
  completed_at     timestamptz,
  items_count      int DEFAULT 0,
  error_message    text
);

-- SCRAPE JOB ITEMS
CREATE TABLE IF NOT EXISTS scrape_job_items (
  scrape_job_item_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_job_id       uuid NOT NULL REFERENCES scrape_jobs(scrape_job_id) ON DELETE CASCADE,
  card_printing_id    uuid NOT NULL REFERENCES card_printings(card_printing_id),
  raw_price           numeric(12, 2) NOT NULL,
  currency_id         uuid NOT NULL REFERENCES currencies(currency_id),
  raw_data            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- CARD PRICES
CREATE TABLE IF NOT EXISTS card_prices (
  card_price_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  price_source_id   uuid NOT NULL REFERENCES price_sources(price_source_id),
  price             numeric(12, 2) NOT NULL,
  currency_id       uuid NOT NULL REFERENCES currencies(currency_id),
  captured_at       timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS idx_card_prices_printing_time;
CREATE INDEX idx_card_prices_printing_time ON card_prices(card_printing_id, captured_at DESC);

-- COMMUNITY PRICE SUBMISSIONS
CREATE TABLE IF NOT EXISTS community_price_submissions (
  submission_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  user_id           uuid NOT NULL REFERENCES users(user_id),
  suggested_price   numeric(12, 2) NOT NULL,
  currency_id       uuid NOT NULL REFERENCES currencies(currency_id),
  evidence_url      text,
  status            submission_status NOT NULL DEFAULT 'PENDING',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- COMMUNITY PRICE VOTES
CREATE TABLE IF NOT EXISTS community_price_votes (
  vote_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  uuid NOT NULL REFERENCES community_price_submissions(submission_id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(user_id),
  is_upvote      boolean NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_vote_per_user UNIQUE (submission_id, user_id)
);

-- CARD PRICE CONSENSUS
CREATE TABLE IF NOT EXISTS card_price_consensus (
  consensus_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  consensus_price   numeric(12, 2) NOT NULL,
  currency_id       uuid NOT NULL REFERENCES currencies(currency_id),
  source_breakdown  jsonb NOT NULL DEFAULT '{}',
  computed_at       timestamptz NOT NULL DEFAULT now(),
  valid_until       timestamptz
);

-- ============================================================================
-- Migration 8: Recommender and Moderation
-- ============================================================================

-- CARD PAIR STATS
CREATE TABLE IF NOT EXISTS card_pair_stats (
  card_a_id            uuid NOT NULL REFERENCES cards(card_id),
  card_b_id            uuid NOT NULL REFERENCES cards(card_id),
  co_occurrence_count  int NOT NULL DEFAULT 0,
  format_id            uuid REFERENCES formats(format_id),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_a_id, card_b_id),
  CONSTRAINT chk_pair_order CHECK (card_a_id < card_b_id)
);

-- RECOMMENDATION SERVES
CREATE TABLE IF NOT EXISTS recommendation_serves (
  serve_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES users(user_id),
  deck_version_id   uuid REFERENCES deck_versions(deck_version_id),
  card_id           uuid NOT NULL REFERENCES cards(card_id),
  recommended_cards jsonb NOT NULL DEFAULT '[]',
  served_at         timestamptz NOT NULL DEFAULT now()
);

-- RECOMMENDATION FEEDBACK
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  feedback_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serve_id     uuid NOT NULL REFERENCES recommendation_serves(serve_id) ON DELETE CASCADE,
  card_id      uuid NOT NULL REFERENCES cards(card_id),
  action       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- LINK SUGGESTIONS
CREATE TABLE IF NOT EXISTS link_suggestions (
  suggestion_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(user_id),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  url               text NOT NULL,
  status            submission_status NOT NULL DEFAULT 'PENDING',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- REPORTS
CREATE TABLE IF NOT EXISTS reports (
  report_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id  uuid NOT NULL REFERENCES users(user_id),
  entity_type       text NOT NULL,
  entity_id         uuid NOT NULL,
  reason            text NOT NULL,
  details           text,
  status            text NOT NULL DEFAULT 'OPEN',
  created_at        timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS idx_reports_status;
CREATE INDEX idx_reports_status ON reports(status);

-- MODERATION ACTIONS
CREATE TABLE IF NOT EXISTS moderation_actions (
  moderation_action_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             uuid REFERENCES reports(report_id),
  moderator_user_id     uuid NOT NULL REFERENCES users(user_id),
  target_user_id        uuid REFERENCES users(user_id),
  action                moderation_action_type NOT NULL,
  reason                text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Migration 9: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_version_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_price_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_price_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = user_id);

-- USER CARDS
DROP POLICY IF EXISTS user_cards_select_own ON user_cards;
CREATE POLICY user_cards_select_own ON user_cards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_cards_insert_own ON user_cards;
CREATE POLICY user_cards_insert_own ON user_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_cards_update_own ON user_cards;
CREATE POLICY user_cards_update_own ON user_cards
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_cards_delete_own ON user_cards;
CREATE POLICY user_cards_delete_own ON user_cards
  FOR DELETE USING (auth.uid() = user_id);

-- DECKS
DROP POLICY IF EXISTS decks_select ON decks;
CREATE POLICY decks_select ON decks
  FOR SELECT USING (
    auth.uid() = user_id
    OR visibility = 'PUBLIC'
  );

DROP POLICY IF EXISTS decks_insert_own ON decks;
CREATE POLICY decks_insert_own ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS decks_update_own ON decks;
CREATE POLICY decks_update_own ON decks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS decks_delete_own ON decks;
CREATE POLICY decks_delete_own ON decks
  FOR DELETE USING (auth.uid() = user_id);

-- DECK VERSIONS
DROP POLICY IF EXISTS deck_versions_select ON deck_versions;
CREATE POLICY deck_versions_select ON deck_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.deck_id = deck_versions.deck_id
      AND (decks.user_id = auth.uid() OR decks.visibility = 'PUBLIC')
    )
  );

DROP POLICY IF EXISTS deck_versions_insert_own ON deck_versions;
CREATE POLICY deck_versions_insert_own ON deck_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.deck_id = deck_versions.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- DECK VERSION CARDS
DROP POLICY IF EXISTS deck_version_cards_select ON deck_version_cards;
CREATE POLICY deck_version_cards_select ON deck_version_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deck_versions dv
      JOIN decks d ON d.deck_id = dv.deck_id
      WHERE dv.deck_version_id = deck_version_cards.deck_version_id
      AND (d.user_id = auth.uid() OR d.visibility = 'PUBLIC')
    )
  );

DROP POLICY IF EXISTS deck_version_cards_insert_own ON deck_version_cards;
CREATE POLICY deck_version_cards_insert_own ON deck_version_cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM deck_versions dv
      JOIN decks d ON d.deck_id = dv.deck_id
      WHERE dv.deck_version_id = deck_version_cards.deck_version_id
      AND d.user_id = auth.uid()
    )
  );

-- DECK SHARES
DROP POLICY IF EXISTS deck_shares_select ON deck_shares;
CREATE POLICY deck_shares_select ON deck_shares
  FOR SELECT USING (
    auth.uid() = created_by
    OR visibility IN ('UNLISTED', 'PUBLIC')
  );

DROP POLICY IF EXISTS deck_shares_insert_own ON deck_shares;
CREATE POLICY deck_shares_insert_own ON deck_shares
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS deck_shares_update_own ON deck_shares;
CREATE POLICY deck_shares_update_own ON deck_shares
  FOR UPDATE USING (auth.uid() = created_by);

-- ============================================================================
-- DECK KEY CARDS (star): persist key cards per deck (not per version)
-- ============================================================================
CREATE TABLE IF NOT EXISTS deck_key_cards (
  deck_key_card_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id          uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  card_id          uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_deck_key_cards UNIQUE (deck_id, card_id)
);

DROP INDEX IF EXISTS idx_deck_key_cards_deck;
DROP INDEX IF EXISTS idx_deck_key_cards_card;
CREATE INDEX idx_deck_key_cards_deck ON deck_key_cards(deck_id);
CREATE INDEX idx_deck_key_cards_card ON deck_key_cards(card_id);

ALTER TABLE deck_key_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deck_key_cards_select ON deck_key_cards;
CREATE POLICY deck_key_cards_select ON deck_key_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_key_cards.deck_id
      AND (d.user_id = auth.uid() OR d.visibility = 'PUBLIC')
    )
  );

DROP POLICY IF EXISTS deck_key_cards_insert_own ON deck_key_cards;
CREATE POLICY deck_key_cards_insert_own ON deck_key_cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_key_cards.deck_id
      AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS deck_key_cards_delete_own ON deck_key_cards;
CREATE POLICY deck_key_cards_delete_own ON deck_key_cards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_key_cards.deck_id
      AND d.user_id = auth.uid()
    )
  );

-- COMMUNITY PRICE SUBMISSIONS
DROP POLICY IF EXISTS submissions_select_all ON community_price_submissions;
CREATE POLICY submissions_select_all ON community_price_submissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS submissions_insert_auth ON community_price_submissions;
CREATE POLICY submissions_insert_auth ON community_price_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- COMMUNITY PRICE VOTES
DROP POLICY IF EXISTS votes_select_all ON community_price_votes;
CREATE POLICY votes_select_all ON community_price_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS votes_insert_auth ON community_price_votes;
CREATE POLICY votes_insert_auth ON community_price_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS votes_delete_own ON community_price_votes;
CREATE POLICY votes_delete_own ON community_price_votes
  FOR DELETE USING (auth.uid() = user_id);

-- AUDIT LOG
DROP POLICY IF EXISTS audit_log_select_own ON audit_log;
CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT USING (auth.uid() = actor_user_id);

-- ============================================================================
-- Migration 10: Updated At Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_updated_at_blocks ON blocks;
CREATE TRIGGER trg_updated_at_blocks BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_editions ON editions;
CREATE TRIGGER trg_updated_at_editions BEFORE UPDATE ON editions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_stores ON stores;
CREATE TRIGGER trg_updated_at_stores BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_cards ON cards;
CREATE TRIGGER trg_updated_at_cards BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_card_printings ON card_printings;
CREATE TRIGGER trg_updated_at_card_printings BEFORE UPDATE ON card_printings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_users ON users;
CREATE TRIGGER trg_updated_at_users BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_user_cards ON user_cards;
CREATE TRIGGER trg_updated_at_user_cards BEFORE UPDATE ON user_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_formats ON formats;
CREATE TRIGGER trg_updated_at_formats BEFORE UPDATE ON formats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_decks ON decks;
CREATE TRIGGER trg_updated_at_decks BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_updated_at_public_decks ON public_decks;
CREATE TRIGGER trg_updated_at_public_decks BEFORE UPDATE ON public_decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ============================================
-- PARTE 2: (SIN SEEDS)
-- ============================================
-- Intencionalmente NO se insertan datos de catálogo (bloques/ediciones/razas/rarezas/tags/formatos)
-- desde este script.

-- PARTE 3: STORAGE BUCKET PARA IMÁGENES
-- ============================================

-- 1. CREAR BUCKET
INSERT INTO storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) VALUES (
  'card-images',
  'card-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. POLÍTICAS RLS PARA STORAGE

-- Lectura pública
DROP POLICY IF EXISTS "Public read access for card images" ON storage.objects;
CREATE POLICY "Public read access for card images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-images');

-- Upload para usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can upload card images" ON storage.objects;
CREATE POLICY "Authenticated users can upload card images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'card-images'
  AND (storage.foldername(name))[1] = 'printings'
);

-- Actualizar imágenes
DROP POLICY IF EXISTS "Authenticated users can update card images" ON storage.objects;
CREATE POLICY "Authenticated users can update card images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'card-images')
WITH CHECK (bucket_id = 'card-images');

-- Eliminar imágenes (solo admins)
DROP POLICY IF EXISTS "Admin users can delete card images" ON storage.objects;
CREATE POLICY "Admin users can delete card images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'card-images'
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
DECLARE
  v_bucket_exists boolean;
  v_policies_count int;
BEGIN
  -- Verificar bucket
  SELECT EXISTS(
    SELECT 1 FROM storage.buckets WHERE id = 'card-images'
  ) INTO v_bucket_exists;

  -- Contar políticas
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%card images%';

  RAISE NOTICE '=== SETUP COMPLETO - VERIFICACIÓN ===';
  RAISE NOTICE 'Bloques: % (8 bloques oficiales)', (SELECT COUNT(*) FROM blocks);
  RAISE NOTICE 'Ediciones: % (8 ediciones 2000-2004)', (SELECT COUNT(*) FROM editions);
  RAISE NOTICE 'Tipos de carta: % (ORO, ALIADO, TOTEM, TALISMAN, ARMA)', (SELECT COUNT(*) FROM card_types);
  RAISE NOTICE 'Razas: % (28 razas oficiales)', (SELECT COUNT(*) FROM races);
  RAISE NOTICE 'Rarezas: %', (SELECT COUNT(*) FROM rarity_tiers);
  RAISE NOTICE 'Tags: %', (SELECT COUNT(*) FROM tags);
  RAISE NOTICE 'Monedas: % (incluye CLP)', (SELECT COUNT(*) FROM currencies);
  RAISE NOTICE 'Formatos: % (Libre, Edición Racial, Edición Libre)', (SELECT COUNT(*) FROM formats);
  RAISE NOTICE 'Cartas ejemplo: %', (SELECT COUNT(*) FROM cards);
  RAISE NOTICE 'Printings ejemplo: %', (SELECT COUNT(*) FROM card_printings);
  RAISE NOTICE 'Bucket "card-images" existe: %', v_bucket_exists;
  RAISE NOTICE 'Políticas RLS storage: %', v_policies_count;

  IF v_bucket_exists AND v_policies_count >= 4 THEN
    RAISE NOTICE 'Estado: ✅ Setup completo exitoso';
  ELSE
    RAISE WARNING 'Estado: ⚠️ Revisar storage y políticas';
  END IF;

  RAISE NOTICE '====================================';
END $$;
