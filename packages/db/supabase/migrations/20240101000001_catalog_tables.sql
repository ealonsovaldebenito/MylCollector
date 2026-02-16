-- Migration: Catalog Tables
-- Description: blocks, editions, card_types, races, rarities, currencies, etc.
-- Doc reference: 03_DATA_MODEL_SQL.md, 00_GLOSSARY_AND_IDS.md

-- ============================================================================
-- BLOCKS
-- ============================================================================
CREATE TABLE blocks (
  block_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL UNIQUE,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- EDITIONS
-- ============================================================================
CREATE TABLE editions (
  edition_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      uuid NOT NULL REFERENCES blocks(block_id),
  name          text NOT NULL,
  code          text NOT NULL UNIQUE,
  release_date  date,
  sort_order    int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_editions_block_id ON editions(block_id);

-- ============================================================================
-- CARD TYPES
-- ============================================================================
CREATE TABLE card_types (
  card_type_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  code          text NOT NULL UNIQUE,
  sort_order    int  NOT NULL DEFAULT 0
);

-- ============================================================================
-- RACES
-- ============================================================================
CREATE TABLE races (
  race_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL UNIQUE,
  sort_order  int  NOT NULL DEFAULT 0
);

-- ============================================================================
-- RARITY TIERS
-- ============================================================================
CREATE TABLE rarity_tiers (
  rarity_tier_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  code            text NOT NULL UNIQUE,
  sort_order      int  NOT NULL DEFAULT 0
);

-- ============================================================================
-- RARITY ERAS
-- ============================================================================
CREATE TABLE rarity_eras (
  rarity_era_id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  code                    text NOT NULL UNIQUE,
  applies_from_edition_id uuid REFERENCES editions(edition_id),
  sort_order              int  NOT NULL DEFAULT 0
);

-- ============================================================================
-- CURRENCIES
-- ============================================================================
CREATE TABLE currencies (
  currency_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL,
  symbol       text NOT NULL
);

-- ============================================================================
-- STORES
-- ============================================================================
CREATE TABLE stores (
  store_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  url          text,
  currency_id  uuid REFERENCES currencies(currency_id),
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- LANGUAGES (optional catalog)
-- ============================================================================
CREATE TABLE languages (
  language_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,
  name         text NOT NULL
);

-- ============================================================================
-- FINISHES (optional catalog)
-- ============================================================================
CREATE TABLE finishes (
  finish_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  name       text NOT NULL
);

-- ============================================================================
-- CARD CONDITIONS (optional catalog)
-- ============================================================================
CREATE TABLE card_conditions (
  condition_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  sort_order    int  NOT NULL DEFAULT 0
);
