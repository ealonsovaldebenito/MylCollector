-- Migration: Recommender and Moderation
-- Description: Co-occurrence stats, recommendations, reports, moderation
-- Doc reference: 03_DATA_MODEL_SQL.md

-- ============================================================================
-- CARD PAIR STATS (co-occurrence for recommendations)
-- ============================================================================
CREATE TABLE card_pair_stats (
  card_a_id            uuid NOT NULL REFERENCES cards(card_id),
  card_b_id            uuid NOT NULL REFERENCES cards(card_id),
  co_occurrence_count  int NOT NULL DEFAULT 0,
  format_id            uuid REFERENCES formats(format_id),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- Ensure card_a_id < card_b_id to avoid duplicates
  PRIMARY KEY (card_a_id, card_b_id),
  CONSTRAINT chk_pair_order CHECK (card_a_id < card_b_id)
);

-- ============================================================================
-- RECOMMENDATION SERVES
-- ============================================================================
CREATE TABLE recommendation_serves (
  serve_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES users(user_id),
  deck_version_id   uuid REFERENCES deck_versions(deck_version_id),
  card_id           uuid NOT NULL REFERENCES cards(card_id),
  recommended_cards jsonb NOT NULL DEFAULT '[]',
  served_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- RECOMMENDATION FEEDBACK
-- ============================================================================
CREATE TABLE recommendation_feedback (
  feedback_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serve_id     uuid NOT NULL REFERENCES recommendation_serves(serve_id) ON DELETE CASCADE,
  card_id      uuid NOT NULL REFERENCES cards(card_id),
  action       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- LINK SUGGESTIONS (user-submitted card links/sources)
-- ============================================================================
CREATE TABLE link_suggestions (
  suggestion_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(user_id),
  card_printing_id  uuid NOT NULL REFERENCES card_printings(card_printing_id),
  url               text NOT NULL,
  status            submission_status NOT NULL DEFAULT 'PENDING',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- REPORTS
-- ============================================================================
CREATE TABLE reports (
  report_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id  uuid NOT NULL REFERENCES users(user_id),
  entity_type       text NOT NULL,
  entity_id         uuid NOT NULL,
  reason            text NOT NULL,
  details           text,
  status            text NOT NULL DEFAULT 'OPEN',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status);

-- ============================================================================
-- MODERATION ACTIONS
-- ============================================================================
CREATE TABLE moderation_actions (
  moderation_action_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id             uuid REFERENCES reports(report_id),
  moderator_user_id     uuid NOT NULL REFERENCES users(user_id),
  target_user_id        uuid REFERENCES users(user_id),
  action                moderation_action_type NOT NULL,
  reason                text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
