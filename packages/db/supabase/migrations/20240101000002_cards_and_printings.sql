-- Migration: Cards and Card Printings
-- Description: Core card identity + edition-specific printings
-- Doc reference: 03_DATA_MODEL_SQL.md, 00_GLOSSARY_AND_IDS.md

-- ============================================================================
-- CARDS (conceptual identity)
-- ============================================================================
CREATE TABLE cards (
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

  -- Doc 03: si card_type = ALIADO => ally_strength NOT NULL
  -- Doc 03: si card_type != ALIADO => ally_strength IS NULL
  -- These constraints are enforced via triggers since they reference another table.
  -- See trigger at bottom of this migration.
  CONSTRAINT chk_ally_strength_positive CHECK (ally_strength IS NULL OR ally_strength > 0)
);

-- Fuzzy search index on name
CREATE INDEX idx_cards_name_trgm ON cards USING gin (name gin_trgm_ops);

-- Normalized name for exact lookups
CREATE INDEX idx_cards_name_normalized ON cards(name_normalized);

-- ============================================================================
-- CARD PRINTINGS (edition-specific)
-- ============================================================================
CREATE TABLE card_printings (
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

  -- Doc 00: unique by minimal combination
  CONSTRAINT uq_card_printing_identity
    UNIQUE (card_id, edition_id, language_id, finish_id, printing_variant)
);

CREATE INDEX idx_card_printings_edition_rarity ON card_printings(edition_id, rarity_tier_id);
CREATE INDEX idx_card_printings_card_edition ON card_printings(card_id, edition_id);

-- ============================================================================
-- TRIGGER: enforce ally_strength rules based on card_type
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_validate_ally_strength()
RETURNS trigger AS $$
DECLARE
  v_card_type_code text;
BEGIN
  SELECT code INTO v_card_type_code
  FROM card_types
  WHERE card_type_id = NEW.card_type_id;

  IF v_card_type_code = 'ALIADO' AND NEW.ally_strength IS NULL THEN
    RAISE EXCEPTION 'ALIADO cards must have ally_strength set (rule: card_type=ALIADO => ally_strength NOT NULL)';
  END IF;

  IF v_card_type_code != 'ALIADO' AND NEW.ally_strength IS NOT NULL THEN
    RAISE EXCEPTION 'Non-ALIADO cards must not have ally_strength (rule: card_type!=ALIADO => ally_strength IS NULL)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cards_ally_strength
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION trg_validate_ally_strength();

-- ============================================================================
-- TAGS (normalized tag system for cards)
-- ============================================================================
CREATE TABLE tags (
  tag_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE card_tags (
  card_id  uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  tag_id   uuid NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

CREATE INDEX idx_card_tags_tag ON card_tags(tag_id);
