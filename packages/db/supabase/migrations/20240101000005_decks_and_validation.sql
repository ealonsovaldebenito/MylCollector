-- Migration: Decks, Versions, and Validation
-- Description: Deck lifecycle with immutable snapshots, validation runs, stats
-- Doc reference: 03_DATA_MODEL_SQL.md, 04_DECK_VALIDATION_ENGINE.md, 00_GLOSSARY_AND_IDS.md

-- ============================================================================
-- DECKS (mutable container)
-- ============================================================================
CREATE TABLE decks (
  deck_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  format_id    uuid NOT NULL REFERENCES formats(format_id),
  name         text NOT NULL,
  description  text,
  visibility   visibility_level NOT NULL DEFAULT 'PRIVATE',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_decks_user_id ON decks(user_id);

-- ============================================================================
-- DECK VERSIONS (immutable snapshots)
-- Doc 00: immutable — no UPDATE on cards, only create new version
-- ============================================================================
CREATE TABLE deck_versions (
  deck_version_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id          uuid NOT NULL REFERENCES decks(deck_id) ON DELETE CASCADE,
  version_number   int NOT NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_deck_version_number UNIQUE (deck_id, version_number)
);

CREATE INDEX idx_deck_versions_deck_id ON deck_versions(deck_id);

-- ============================================================================
-- DECK VERSION CARDS
-- Doc 00: unique by (deck_version_id, card_printing_id)
-- ============================================================================
CREATE TABLE deck_version_cards (
  deck_version_card_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id       uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  card_printing_id      uuid NOT NULL REFERENCES card_printings(card_printing_id),
  qty                   int NOT NULL CHECK (qty > 0),
  is_starting_gold      boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_deck_version_card UNIQUE (deck_version_id, card_printing_id)
);

-- Doc 03: recommended index
CREATE INDEX idx_deck_version_cards_version ON deck_version_cards(deck_version_id);

-- ============================================================================
-- DECK VALIDATION RUNS
-- Doc 04: auditable execution of the validation engine
-- ============================================================================
CREATE TABLE deck_validation_runs (
  validation_run_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id    uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  format_id          uuid NOT NULL REFERENCES formats(format_id),
  is_valid           boolean NOT NULL,
  duration_ms        int,
  computed_stats     jsonb,
  request_id         text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_runs_version ON deck_validation_runs(deck_version_id);

-- ============================================================================
-- DECK VALIDATION MESSAGES
-- Doc 04: rule_id stable, deterministic ordering
-- ============================================================================
CREATE TABLE deck_validation_messages (
  validation_message_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_run_id      uuid NOT NULL REFERENCES deck_validation_runs(validation_run_id) ON DELETE CASCADE,
  rule_id                text NOT NULL,
  rule_version           int NOT NULL DEFAULT 1,
  severity               validation_severity NOT NULL,
  message                text NOT NULL,
  hint                   text,
  entity_ref             jsonb,
  context_json           jsonb,
  sort_order             int NOT NULL DEFAULT 0
);

-- Doc 03: recommended indexes
CREATE INDEX idx_validation_messages_run ON deck_validation_messages(validation_run_id);
CREATE INDEX idx_validation_messages_rule ON deck_validation_messages(rule_id);

-- ============================================================================
-- DECK STATS SNAPSHOTS
-- ============================================================================
CREATE TABLE deck_stats_snapshots (
  snapshot_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_version_id  uuid NOT NULL REFERENCES deck_versions(deck_version_id) ON DELETE CASCADE,
  stats_json       jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);
