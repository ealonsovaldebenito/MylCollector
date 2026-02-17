-- Migration: Deck tags and extra deck metadata
-- Description: Adds deck_tags join table + extra metadata fields for decks.
-- Doc reference: 03_DATA_MODEL_SQL.md
-- Changelog:
--   2026-02-17 — Make RLS policies idempotent (DROP POLICY IF EXISTS) for reruns.

-- ============================================================================
-- DECKS: extra metadata
-- ============================================================================
ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS strategy text,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- ============================================================================
-- DECK TAGS: many-to-many between decks and tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS deck_tags (
  deck_tag_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  tag_id      uuid NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_deck_tags UNIQUE (deck_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_tags_deck_id ON deck_tags(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_tags_tag_id ON deck_tags(tag_id);

-- RLS
ALTER TABLE deck_tags ENABLE ROW LEVEL SECURITY;

-- Select: visible if deck is visible/owned
DROP POLICY IF EXISTS deck_tags_select ON deck_tags;
CREATE POLICY deck_tags_select ON deck_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_tags.deck_id
      AND (d.user_id = auth.uid() OR d.visibility = 'PUBLIC')
    )
  );

-- Insert/Delete: only owner of deck
DROP POLICY IF EXISTS deck_tags_insert_own ON deck_tags;
CREATE POLICY deck_tags_insert_own ON deck_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_tags.deck_id
      AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS deck_tags_delete_own ON deck_tags;
CREATE POLICY deck_tags_delete_own ON deck_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_tags.deck_id
      AND d.user_id = auth.uid()
    )
  );
