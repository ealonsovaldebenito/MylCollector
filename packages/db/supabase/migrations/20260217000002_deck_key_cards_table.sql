-- Migration: Deck key cards table
-- Context: Persistir "cartas clave" (estrella) por mazo sin requerir crear una nueva versión.
-- Description: Tabla `deck_key_cards` (deck_id + card_id) con RLS alineada a `decks`.
-- Relations:
--   - deck_key_cards.deck_id -> decks.deck_id
--   - deck_key_cards.card_id -> cards.card_id
-- Changelog:
--   2026-02-17 — Initial creation
--   2026-02-17 — Make RLS policies idempotent (DROP POLICY IF EXISTS) for reruns.

CREATE TABLE IF NOT EXISTS deck_key_cards (
  deck_key_card_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id          uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  card_id          uuid NOT NULL REFERENCES cards(card_id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_deck_key_cards UNIQUE (deck_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_key_cards_deck ON deck_key_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_key_cards_card ON deck_key_cards(card_id);

-- RLS
ALTER TABLE deck_key_cards ENABLE ROW LEVEL SECURITY;

-- Select: visible if deck is visible/owned
DROP POLICY IF EXISTS deck_key_cards_select ON deck_key_cards;
CREATE POLICY deck_key_cards_select ON deck_key_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_key_cards.deck_id
      AND (d.user_id = auth.uid() OR d.visibility = 'PUBLIC')
    )
  );

-- Insert/Delete: only owner of deck
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
