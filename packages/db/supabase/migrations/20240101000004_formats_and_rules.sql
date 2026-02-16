-- Migration: Formats and Rules (data-driven)
-- Description: Format definitions, rules, allowed blocks/editions/types/races, card limits
-- Doc reference: 03_DATA_MODEL_SQL.md, 04_DECK_VALIDATION_ENGINE.md

-- ============================================================================
-- FORMATS
-- ============================================================================
CREATE TABLE formats (
  format_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  code         text NOT NULL UNIQUE,
  description  text,
  is_active    boolean NOT NULL DEFAULT true,
  -- params_json: { deck_size, default_card_limit, discontinued_severity, ... }
  params_json  jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- FORMAT RULES (per-format rule overrides)
-- ============================================================================
CREATE TABLE format_rules (
  format_rule_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id       uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  rule_id         text NOT NULL,
  params_json     jsonb NOT NULL DEFAULT '{}',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_format_rules_format ON format_rules(format_id);

-- ============================================================================
-- FORMAT ALLOWED BLOCKS
-- ============================================================================
CREATE TABLE format_allowed_blocks (
  format_id  uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  block_id   uuid NOT NULL REFERENCES blocks(block_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, block_id)
);

-- ============================================================================
-- FORMAT ALLOWED EDITIONS
-- ============================================================================
CREATE TABLE format_allowed_editions (
  format_id   uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  edition_id  uuid NOT NULL REFERENCES editions(edition_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, edition_id)
);

-- ============================================================================
-- FORMAT ALLOWED CARD TYPES
-- ============================================================================
CREATE TABLE format_allowed_card_types (
  format_id     uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  card_type_id  uuid NOT NULL REFERENCES card_types(card_type_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, card_type_id)
);

-- ============================================================================
-- FORMAT ALLOWED RACES
-- ============================================================================
CREATE TABLE format_allowed_races (
  format_id  uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  race_id    uuid NOT NULL REFERENCES races(race_id) ON DELETE CASCADE,
  PRIMARY KEY (format_id, race_id)
);

-- ============================================================================
-- FORMAT CARD LIMITS (overrides default per card)
-- ============================================================================
CREATE TABLE format_card_limits (
  format_card_limit_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id             uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  card_id               uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  max_qty               int NOT NULL CHECK (max_qty >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_format_card_limit UNIQUE (format_id, card_id)
);

-- Doc 03: recommended index
CREATE INDEX idx_format_card_limits_lookup ON format_card_limits(format_id, card_id);
