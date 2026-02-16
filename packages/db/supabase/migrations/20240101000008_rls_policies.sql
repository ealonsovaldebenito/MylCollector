-- Migration: Row Level Security Policies
-- Description: RLS for user_cards, decks, deck_versions, community submissions
-- Doc reference: 03_DATA_MODEL_SQL.md (security notes)

-- ============================================================================
-- Enable RLS on sensitive tables
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_version_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_price_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_price_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS: own profile only
-- ============================================================================
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- USER CARDS: owner only (private collection)
-- ============================================================================
CREATE POLICY user_cards_select_own ON user_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_cards_insert_own ON user_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_cards_update_own ON user_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_cards_delete_own ON user_cards
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- DECKS: owner + visibility rules
-- ============================================================================
CREATE POLICY decks_select ON decks
  FOR SELECT USING (
    auth.uid() = user_id
    OR visibility = 'PUBLIC'
  );

CREATE POLICY decks_insert_own ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY decks_update_own ON decks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY decks_delete_own ON decks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- DECK VERSIONS: accessible if deck is accessible
-- ============================================================================
CREATE POLICY deck_versions_select ON deck_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.deck_id = deck_versions.deck_id
      AND (decks.user_id = auth.uid() OR decks.visibility = 'PUBLIC')
    )
  );

CREATE POLICY deck_versions_insert_own ON deck_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.deck_id = deck_versions.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- ============================================================================
-- DECK VERSION CARDS: accessible if version is accessible
-- ============================================================================
CREATE POLICY deck_version_cards_select ON deck_version_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deck_versions dv
      JOIN decks d ON d.deck_id = dv.deck_id
      WHERE dv.deck_version_id = deck_version_cards.deck_version_id
      AND (d.user_id = auth.uid() OR d.visibility = 'PUBLIC')
    )
  );

CREATE POLICY deck_version_cards_insert_own ON deck_version_cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM deck_versions dv
      JOIN decks d ON d.deck_id = dv.deck_id
      WHERE dv.deck_version_id = deck_version_cards.deck_version_id
      AND d.user_id = auth.uid()
    )
  );

-- ============================================================================
-- DECK SHARES: creator or anyone with share_code (via API, not RLS)
-- ============================================================================
CREATE POLICY deck_shares_select ON deck_shares
  FOR SELECT USING (
    auth.uid() = created_by
    OR visibility IN ('UNLISTED', 'PUBLIC')
  );

CREATE POLICY deck_shares_insert_own ON deck_shares
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY deck_shares_update_own ON deck_shares
  FOR UPDATE USING (auth.uid() = created_by);

-- ============================================================================
-- COMMUNITY PRICE SUBMISSIONS: write authenticated, read public
-- ============================================================================
CREATE POLICY submissions_select_all ON community_price_submissions
  FOR SELECT USING (true);

CREATE POLICY submissions_insert_auth ON community_price_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- COMMUNITY PRICE VOTES: one vote per user per submission
-- ============================================================================
CREATE POLICY votes_select_all ON community_price_votes
  FOR SELECT USING (true);

CREATE POLICY votes_insert_auth ON community_price_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY votes_delete_own ON community_price_votes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT LOG: only service role can write, users see own entries
-- ============================================================================
CREATE POLICY audit_log_select_own ON audit_log
  FOR SELECT USING (auth.uid() = actor_user_id);

-- Note: INSERT is restricted to service_role via Supabase client
-- No INSERT policy for anon/authenticated — only backend writes audit logs
