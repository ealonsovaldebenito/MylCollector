-- Migration: Sharing and Prices
-- Description: Deck sharing, public decks, price sources, community pricing
-- Doc reference: 03_DATA_MODEL_SQL.md, 00_GLOSSARY_AND_IDS.md

-- ============================================================================
-- DECK SHARES (URL + visibility)
-- Doc 03: share_code unique, resolves to deck_version_id
-- ============================================================================
CREATE TABLE deck_shares (
  share_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_code        text NOT NULL UNIQUE,
  deck_version_id   uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  visibility        visibility_level NOT NULL DEFAULT 'UNLISTED',
  created_by        uuid NOT NULL REFERENCES users(user_id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz
);

-- Doc 03: recommended indexes
CREATE INDEX idx_deck_shares_share_code ON deck_shares(share_code);
CREATE INDEX idx_deck_shares_version ON deck_shares(deck_version_id);

-- ============================================================================
-- PUBLIC DECKS (published for dataset/discovery)
-- ============================================================================
CREATE TABLE public_decks (
  public_deck_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id  uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  tags             text[] DEFAULT '{}',
  published_by     uuid NOT NULL REFERENCES users(user_id),
  published_at     timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- PUBLIC DECK CARDS (denormalized for public access)
-- ============================================================================
CREATE TABLE public_deck_cards (
  public_deck_card_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_deck_id       uuid NOT NULL REFERENCES public_decks(public_deck_id) ON DELETE CASCADE,
  card_printing_id     uuid NOT NULL REFERENCES card_printings(card_printing_id),
  qty                  int NOT NULL CHECK (qty > 0),
  is_starting_gold     boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_public_deck_cards_deck ON public_deck_cards(public_deck_id);

-- ============================================================================
-- PRICE SOURCES
-- ============================================================================
CREATE TABLE price_sources (
  price_source_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         uuid REFERENCES stores(store_id),
  name             text NOT NULL,
  url              text,
  source_type      text NOT NULL DEFAULT 'scrape',
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SCRAPE JOBS
-- ============================================================================
CREATE TABLE scrape_jobs (
  scrape_job_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_source_id  uuid NOT NULL REFERENCES price_sources(price_source_id),
  status           text NOT NULL DEFAULT 'pending',
  started_at       timestamptz,
  completed_at     timestamptz,
  items_count      int DEFAULT 0,
  error_message    text
);

-- ============================================================================
-- SCRAPE JOB ITEMS
-- ============================================================================
CREATE TABLE scrape_job_items (
  scrape_job_item_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scrape_job_id       uuid NOT NULL REFERENCES scrape_jobs(scrape_job_id) ON DELETE CASCADE,
  card_printing_id    uuid NOT NULL REFERENCES card_printings(card_printing_id),
  raw_price           numeric(12, 2) NOT NULL,
  currency_id         uuid NOT NULL REFERENCES currencies(currency_id),
  raw_data            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- CARD PRICES (historical)
-- ============================================================================
CREATE TABLE card_prices (
  card_price_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  price_source_id   uuid NOT NULL REFERENCES price_sources(price_source_id),
  price             numeric(12, 2) NOT NULL,
  currency_id       uuid NOT NULL REFERENCES currencies(currency_id),
  captured_at       timestamptz NOT NULL DEFAULT now()
);

-- Doc 03: recommended index
CREATE INDEX idx_card_prices_printing_time ON card_prices(card_printing_id, captured_at DESC);

-- ============================================================================
-- COMMUNITY PRICE SUBMISSIONS
-- ============================================================================
CREATE TABLE community_price_submissions (
  submission_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  user_id           uuid NOT NULL REFERENCES users(user_id),
  suggested_price   numeric(12, 2) NOT NULL,
  currency_id       uuid NOT NULL REFERENCES currencies(currency_id),
  evidence_url      text,
  status            submission_status NOT NULL DEFAULT 'PENDING',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- COMMUNITY PRICE VOTES
-- ============================================================================
CREATE TABLE community_price_votes (
  vote_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  uuid NOT NULL REFERENCES community_price_submissions(submission_id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(user_id),
  is_upvote      boolean NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_vote_per_user UNIQUE (submission_id, user_id)
);

-- ============================================================================
-- CARD PRICE CONSENSUS
-- ============================================================================
CREATE TABLE card_price_consensus (
  consensus_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  consensus_price   numeric(12, 2) NOT NULL,
  currency_id       uuid NOT NULL REFERENCES currencies(currency_id),
  source_breakdown  jsonb NOT NULL DEFAULT '{}',
  computed_at       timestamptz NOT NULL DEFAULT now(),
  valid_until       timestamptz
);
