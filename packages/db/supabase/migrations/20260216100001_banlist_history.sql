-- Migration: Ban List History & Revisions
-- Description: Adds revision tracking for ban lists, allowing historical
--              snapshots of format_card_limits changes with justification text.
-- Doc reference: 04_DECK_VALIDATION_ENGINE.md
-- Changelog:
--   2026-02-16 — Initial creation
--   2026-02-17 — Make RLS policies idempotent (DROP POLICY IF EXISTS) for reruns.

-- ============================================================================
-- BAN LIST REVISIONS: versioned snapshots of ban list changes per format
-- Each revision represents one official update (e.g., "Ban List Febrero 2026")
-- ============================================================================
CREATE TABLE IF NOT EXISTS ban_list_revisions (
  revision_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id       uuid NOT NULL REFERENCES formats(format_id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  effective_date  date NOT NULL,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ban_list_revisions_format ON ban_list_revisions(format_id);
CREATE INDEX IF NOT EXISTS idx_ban_list_revisions_date ON ban_list_revisions(effective_date DESC);

COMMENT ON TABLE ban_list_revisions IS 'Historical revisions of ban lists per format. Each row is one official update.';

-- ============================================================================
-- BAN LIST ENTRIES: individual card changes within a revision
-- Tracks what changed: BANNED (0 copies), RESTRICTED (1-2), RELEASED (back to default)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ban_list_entries (
  entry_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id   uuid NOT NULL REFERENCES ban_list_revisions(revision_id) ON DELETE CASCADE,
  card_id       uuid NOT NULL REFERENCES cards(card_id),
  max_qty       int NOT NULL CHECK (max_qty >= 0),
  previous_qty  int,
  change_type   text NOT NULL CHECK (change_type IN ('BANNED', 'RESTRICTED', 'RELEASED', 'MODIFIED')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ban_list_entries_revision ON ban_list_entries(revision_id);
CREATE INDEX IF NOT EXISTS idx_ban_list_entries_card ON ban_list_entries(card_id);

COMMENT ON COLUMN ban_list_entries.max_qty IS '0 = banned, 1-2 = restricted, 3+ = released (or format default)';
COMMENT ON COLUMN ban_list_entries.change_type IS 'BANNED: set to 0, RESTRICTED: set to 1-2, RELEASED: back to default, MODIFIED: any other change';

-- ============================================================================
-- FORMAT CARD LIMITS: add revision reference and updated_at
-- ============================================================================
ALTER TABLE format_card_limits
  ADD COLUMN IF NOT EXISTS revision_id uuid REFERENCES ban_list_revisions(revision_id),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================================
-- RLS for ban list tables (read-only for all, write for admin via service_role)
-- ============================================================================
ALTER TABLE ban_list_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ban_list_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ban_list_revisions_select ON ban_list_revisions;
CREATE POLICY ban_list_revisions_select ON ban_list_revisions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS ban_list_entries_select ON ban_list_entries;
CREATE POLICY ban_list_entries_select ON ban_list_entries
  FOR SELECT USING (true);
