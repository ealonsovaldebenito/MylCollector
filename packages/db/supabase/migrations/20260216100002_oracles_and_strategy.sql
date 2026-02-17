-- Migration: Oracles & Strategy Content
-- Description: Adds card_oracles for official rulings/errata per card,
--              and deck_strategy_content for rich strategy guides on decks.
-- Doc reference: 03_DATA_MODEL_SQL.md
-- Changelog:
--   2026-02-16 — Initial creation

-- ============================================================================
-- CARD ORACLES: official rulings, errata, and ability explanations per card
-- Each card can have multiple oracle entries (one per ruling/interaction).
-- Oracle documents are versioned by source_document (e.g. "Lootbox Primer Bloque 2025").
-- ============================================================================
CREATE TABLE IF NOT EXISTS card_oracles (
  oracle_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id            uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  source_document    text NOT NULL,
  ruling_text        text NOT NULL,
  ability_type       text CHECK (ability_type IN ('ACTIVADA', 'PASIVA', 'ESPECIAL', 'CONTINUA', 'DISPARADA')),
  sort_order         int NOT NULL DEFAULT 0,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_oracles_card ON card_oracles(card_id);
CREATE INDEX IF NOT EXISTS idx_card_oracles_source ON card_oracles(source_document);

COMMENT ON TABLE card_oracles IS 'Official rulings and ability explanations per card, sourced from Oracle documents.';
COMMENT ON COLUMN card_oracles.ability_type IS 'Type of ability this ruling explains: ACTIVADA, PASIVA, ESPECIAL, CONTINUA, DISPARADA';
COMMENT ON COLUMN card_oracles.source_document IS 'Name of the official document, e.g. "Oráculo Lootbox Primer Bloque 2025"';

-- ============================================================================
-- DECK STRATEGY SECTIONS: modular strategy content blocks for decks
-- Each deck can have multiple content sections organized by type.
-- Types: game_plan, resources, synergies, combos, card_analysis, matchups, mulligan, tips
-- ============================================================================
CREATE TABLE IF NOT EXISTS deck_strategy_sections (
  section_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id          uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  section_type     text NOT NULL CHECK (section_type IN (
    'game_plan', 'resources', 'synergies', 'combos',
    'card_analysis', 'matchups', 'mulligan', 'tips', 'custom'
  )),
  title            text NOT NULL,
  content          text NOT NULL,
  sort_order       int NOT NULL DEFAULT 0,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deck_strategy_deck ON deck_strategy_sections(deck_id);

COMMENT ON TABLE deck_strategy_sections IS 'Rich strategy content blocks for decks: game plans, synergies, combos, card analysis, etc.';

-- ============================================================================
-- DECK STRATEGY CARD REFS: link strategy sections to specific cards
-- Allows highlighting which cards a section discusses.
-- ============================================================================
CREATE TABLE IF NOT EXISTS deck_strategy_card_refs (
  ref_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    uuid NOT NULL REFERENCES deck_strategy_sections(section_id) ON DELETE CASCADE,
  card_id       uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  role_label    text,
  CONSTRAINT uq_strategy_card_ref UNIQUE (section_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_strategy_card_refs_section ON deck_strategy_card_refs(section_id);

COMMENT ON COLUMN deck_strategy_card_refs.role_label IS 'Role of the card in this strategy section, e.g. "finisher", "engine", "removal"';

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE card_oracles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_strategy_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_strategy_card_refs ENABLE ROW LEVEL SECURITY;

-- Oracles: public read, admin write
CREATE POLICY card_oracles_select ON card_oracles FOR SELECT USING (true);

-- Strategy: read if deck is visible/owned, write if owned
CREATE POLICY deck_strategy_sections_select ON deck_strategy_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_strategy_sections.deck_id
      AND (d.user_id = auth.uid() OR d.visibility = 'PUBLIC')
    )
  );

CREATE POLICY deck_strategy_sections_insert ON deck_strategy_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_strategy_sections.deck_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY deck_strategy_sections_update ON deck_strategy_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_strategy_sections.deck_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY deck_strategy_sections_delete ON deck_strategy_sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_strategy_sections.deck_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY deck_strategy_card_refs_select ON deck_strategy_card_refs
  FOR SELECT USING (true);
