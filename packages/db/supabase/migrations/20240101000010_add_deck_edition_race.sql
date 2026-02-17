-- ============================================================================
-- Migration: Add edition_id and race_id to decks table
-- Description: Permite seleccionar edición y raza específica para un mazo
-- Date: 2026-02-15
-- Changelog:
--   2026-02-17 — Make migration idempotent (IF NOT EXISTS) for reruns.
-- ============================================================================

-- Add edition_id column
ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS edition_id uuid REFERENCES editions(edition_id);

-- Add race_id column
ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS race_id uuid REFERENCES races(race_id);

-- Add indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_decks_edition_id ON decks(edition_id);
CREATE INDEX IF NOT EXISTS idx_decks_race_id ON decks(race_id);

-- Add comment explaining the purpose
COMMENT ON COLUMN decks.edition_id IS 'Restricción opcional de edición para el mazo (ej: solo cartas de Gótico)';
COMMENT ON COLUMN decks.race_id IS 'Restricción opcional de raza para el mazo (ej: solo Vampiros)';
