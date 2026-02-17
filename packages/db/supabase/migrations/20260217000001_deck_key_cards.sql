-- Migration: Deck key cards (star) persistence
-- Context: Builder necesita persistir "cartas clave" (estrella) en DB (no localStorage).
-- Description:
--   - Agrega `is_key_card` a `deck_version_cards` (y `public_deck_cards` para futuras vistas/datasets).
-- Relations:
--   - `deck_version_cards.card_printing_id` -> `card_printings.card_printing_id` -> `cards.card_id`
-- Changelog:
--   - 2026-02-17: Add `is_key_card` boolean to deck card tables.

ALTER TABLE deck_version_cards
  ADD COLUMN IF NOT EXISTS is_key_card boolean NOT NULL DEFAULT false;

ALTER TABLE public_deck_cards
  ADD COLUMN IF NOT EXISTS is_key_card boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_deck_version_cards_key
  ON deck_version_cards(deck_version_id, is_key_card);

