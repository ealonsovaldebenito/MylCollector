-- ============================================================================
-- Community Social Tables: deck_likes, deck_comments, user_followers
-- Also adds denormalized counters to decks + triggers + RLS + RPC
--
-- Changelog:
--   2026-02-18 — Initial creation
-- ============================================================================

-- 0. Utility: generic updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. deck_likes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deck_likes (
  like_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id    uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_deck_like UNIQUE (deck_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_likes_deck ON deck_likes(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_likes_user ON deck_likes(user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. deck_comments (threaded with soft-delete)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deck_comments (
  comment_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES deck_comments(comment_id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_deleted  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deck_comments_deck   ON deck_comments(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_comments_parent ON deck_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_deck_comments_user   ON deck_comments(user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. user_followers
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_followers (
  follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id != followee_id)
);

CREATE INDEX IF NOT EXISTS idx_user_followers_followee ON user_followers(followee_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Denormalized counters on decks
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE decks ADD COLUMN IF NOT EXISTS like_count    int NOT NULL DEFAULT 0;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS view_count    int NOT NULL DEFAULT 0;
ALTER TABLE decks ADD COLUMN IF NOT EXISTS comment_count int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_decks_public_likes
  ON decks(like_count DESC) WHERE visibility = 'PUBLIC';

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Triggers for counter maintenance
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_deck_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET like_count = like_count + 1 WHERE deck_id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET like_count = GREATEST(like_count - 1, 0) WHERE deck_id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deck_like_count ON deck_likes;
CREATE TRIGGER trg_deck_like_count
  AFTER INSERT OR DELETE ON deck_likes
  FOR EACH ROW EXECUTE FUNCTION update_deck_like_count();

CREATE OR REPLACE FUNCTION update_deck_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_deleted THEN
    UPDATE decks SET comment_count = comment_count + 1 WHERE deck_id = NEW.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deck_comment_count ON deck_comments;
CREATE TRIGGER trg_deck_comment_count
  AFTER INSERT ON deck_comments
  FOR EACH ROW EXECUTE FUNCTION update_deck_comment_count();

-- Apply updated_at trigger to deck_comments
DROP TRIGGER IF EXISTS set_updated_at ON deck_comments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON deck_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 6. RLS policies
-- ────────────────────────────────────────────────────────────────────────────

-- deck_likes
ALTER TABLE deck_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY deck_likes_select_all ON deck_likes
  FOR SELECT USING (true);
CREATE POLICY deck_likes_insert_own ON deck_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY deck_likes_delete_own ON deck_likes
  FOR DELETE USING (auth.uid() = user_id);

-- deck_comments
ALTER TABLE deck_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY deck_comments_select_public ON deck_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM decks d
      WHERE d.deck_id = deck_comments.deck_id
        AND d.visibility = 'PUBLIC'
    )
    OR auth.uid() = user_id
  );
CREATE POLICY deck_comments_insert_auth ON deck_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY deck_comments_update_own ON deck_comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY deck_comments_delete_own ON deck_comments
  FOR DELETE USING (auth.uid() = user_id);

-- user_followers
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_followers_select_all ON user_followers
  FOR SELECT USING (true);
CREATE POLICY user_followers_insert_own ON user_followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY user_followers_delete_own ON user_followers
  FOR DELETE USING (auth.uid() = follower_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. RPC: get_public_decks — optimized gallery query
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_public_decks(
  p_format_id  uuid    DEFAULT NULL,
  p_edition_id uuid    DEFAULT NULL,
  p_race_id    uuid    DEFAULT NULL,
  p_q          text    DEFAULT NULL,
  p_sort       text    DEFAULT 'newest',
  p_limit      int     DEFAULT 20,
  p_offset     int     DEFAULT 0
)
RETURNS TABLE(
  deck_id        uuid,
  name           text,
  description    text,
  user_id        uuid,
  display_name   text,
  avatar_url     text,
  format_id      uuid,
  format_name    text,
  format_code    text,
  edition_id     uuid,
  race_id        uuid,
  like_count     int,
  view_count     int,
  comment_count  int,
  visibility     text,
  created_at     timestamptz,
  updated_at     timestamptz,
  total_count    bigint
) AS $$
DECLARE
  v_total bigint;
BEGIN
  -- Count total matching
  SELECT count(*) INTO v_total
  FROM decks d
  WHERE d.visibility = 'PUBLIC'
    AND (p_format_id  IS NULL OR d.format_id  = p_format_id)
    AND (p_edition_id IS NULL OR d.edition_id = p_edition_id)
    AND (p_race_id    IS NULL OR d.race_id    = p_race_id)
    AND (p_q          IS NULL OR d.name ILIKE '%' || p_q || '%');

  RETURN QUERY
  SELECT
    d.deck_id,
    d.name,
    d.description,
    d.user_id,
    COALESCE(up.display_name, 'Usuario') AS display_name,
    up.avatar_url,
    d.format_id,
    f.name  AS format_name,
    f.code  AS format_code,
    d.edition_id,
    d.race_id,
    d.like_count,
    d.view_count,
    d.comment_count,
    d.visibility::text,
    d.created_at,
    d.updated_at,
    v_total AS total_count
  FROM decks d
  LEFT JOIN user_profiles up ON up.user_id = d.user_id
  LEFT JOIN formats f ON f.format_id = d.format_id
  WHERE d.visibility = 'PUBLIC'
    AND (p_format_id  IS NULL OR d.format_id  = p_format_id)
    AND (p_edition_id IS NULL OR d.edition_id = p_edition_id)
    AND (p_race_id    IS NULL OR d.race_id    = p_race_id)
    AND (p_q          IS NULL OR d.name ILIKE '%' || p_q || '%')
  ORDER BY
    CASE WHEN p_sort = 'most_liked'  THEN d.like_count  END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_viewed' THEN d.view_count  END DESC NULLS LAST,
    d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
