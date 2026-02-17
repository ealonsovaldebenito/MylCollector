-- Migration: user_collections — Multi-folder collection system
-- Allows users to organize their cards into named collections (folders).
-- Cards without a collection_id belong to a virtual "General" collection.

-- 1. Create user_collections table
CREATE TABLE IF NOT EXISTS user_collections (
  collection_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_user_collection_name UNIQUE(user_id, name)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);

-- 2. Add collection_id to user_cards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cards' AND column_name = 'collection_id'
  ) THEN
    ALTER TABLE user_cards ADD COLUMN collection_id UUID REFERENCES user_collections(collection_id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_user_cards_collection_id ON user_cards(collection_id);

-- 3. RLS for user_collections
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON user_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own collections"
  ON user_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON user_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON user_collections FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_collections_updated_at
  BEFORE UPDATE ON user_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_user_collections_updated_at();

-- 5. RPC: get collection value estimate (sum of consensus prices)
CREATE OR REPLACE FUNCTION get_collection_value(
  p_user_id UUID,
  p_collection_id UUID DEFAULT NULL
)
RETURNS TABLE(total_value NUMERIC, card_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(uc.qty * COALESCE(cp.consensus_price, 0)), 0) AS total_value,
    COALESCE(SUM(uc.qty), 0) AS card_count
  FROM user_cards uc
  LEFT JOIN card_printings cpr ON cpr.card_printing_id = uc.card_printing_id
  LEFT JOIN card_prices cp ON cp.card_printing_id = uc.card_printing_id
    AND cp.is_current = true
  WHERE uc.user_id = p_user_id
    AND (p_collection_id IS NULL OR uc.collection_id = p_collection_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
