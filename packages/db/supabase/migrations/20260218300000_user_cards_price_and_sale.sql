-- Migration: Add user_price and is_for_sale to user_cards
-- Description: Users can set their own price per card and mark cards for sale.
-- Each user_card row is a unique (user, printing, condition) — user controls qty manually.

-- 1. Add user_price column (nullable, user sets their own price)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cards' AND column_name = 'user_price'
  ) THEN
    ALTER TABLE user_cards ADD COLUMN user_price numeric(12, 2) DEFAULT NULL;
    RAISE NOTICE 'Added user_price column';
  ELSE
    RAISE NOTICE 'user_price column already exists';
  END IF;
END $$;

-- 2. Add is_for_sale column (default false)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_cards' AND column_name = 'is_for_sale'
  ) THEN
    ALTER TABLE user_cards ADD COLUMN is_for_sale boolean NOT NULL DEFAULT false;
    RAISE NOTICE 'Added is_for_sale column';
  ELSE
    RAISE NOTICE 'is_for_sale column already exists';
  END IF;
END $$;

-- 3. Drop old unique constraint that prevents multiple copies with different prices
--    Users can have multiple rows for same (user, printing, condition) with different prices.
ALTER TABLE user_cards DROP CONSTRAINT IF EXISTS uq_user_card_printing_condition;

-- 4. Index for marketplace queries (cards for sale)
CREATE INDEX IF NOT EXISTS idx_user_cards_for_sale
  ON user_cards (is_for_sale, card_printing_id)
  WHERE is_for_sale = true;

-- 4. Check constraint: price must be positive if set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'user_cards' AND constraint_name = 'chk_user_price_positive'
  ) THEN
    ALTER TABLE user_cards ADD CONSTRAINT chk_user_price_positive
      CHECK (user_price IS NULL OR user_price > 0);
    RAISE NOTICE 'Added chk_user_price_positive constraint';
  ELSE
    RAISE NOTICE 'chk_user_price_positive already exists';
  END IF;
END $$;

-- Migration 20260218300000 complete
