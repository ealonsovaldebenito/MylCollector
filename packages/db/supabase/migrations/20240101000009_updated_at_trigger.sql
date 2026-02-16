-- Migration: Auto-update updated_at trigger
-- Description: Reusable trigger function for updated_at columns

-- ============================================================================
-- FUNCTION: set updated_at to now() on UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Apply trigger to all tables with updated_at
-- ============================================================================
CREATE TRIGGER trg_updated_at_blocks BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_editions BEFORE UPDATE ON editions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_stores BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_cards BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_card_printings BEFORE UPDATE ON card_printings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_users BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_user_cards BEFORE UPDATE ON user_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_formats BEFORE UPDATE ON formats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_decks BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_updated_at_public_decks BEFORE UPDATE ON public_decks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
