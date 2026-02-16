import { z } from 'zod';

// ============================================================================
// Price schemas — consensus, history, community submissions and votes
// Doc reference: 03_DATA_MODEL_SQL.md
// ============================================================================

/**
 * Consensus price for a card printing
 */
export const priceConsensusSchema = z.object({
  consensus_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  consensus_price: z.number(),
  currency_code: z.string(),
  computed_at: z.string(),
});

/**
 * Historical price point
 */
export const cardPriceHistorySchema = z.object({
  price: z.number(),
  captured_at: z.string(),
  source_name: z.string(),
});

/**
 * Community price submission
 */
export const communityPriceSubmissionSchema = z.object({
  submission_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  user_id: z.string().uuid(),
  suggested_price: z.number(),
  currency_id: z.string().uuid(),
  evidence_url: z.string().url().nullable(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  created_at: z.string(),
  upvotes: z.number().optional(),
  downvotes: z.number().optional(),
  user_vote: z.boolean().nullable().optional(), // true = upvote, false = downvote, null = no vote
});

/**
 * Submit a new price
 */
export const submitPriceSchema = z.object({
  card_printing_id: z.string().uuid(),
  suggested_price: z.number().positive(),
  currency_id: z.string().uuid(),
  evidence_url: z.string().url().optional(),
});

/**
 * Vote on a price submission
 */
export const votePriceSchema = z.object({
  submission_id: z.string().uuid(),
  is_upvote: z.boolean(),
});

/**
 * Price statistics for a card
 */
export const priceStatsSchema = z.object({
  card_printing_id: z.string().uuid(),
  consensus_price: z.number().nullable(),
  min_price: z.number().nullable(),
  max_price: z.number().nullable(),
  avg_price: z.number().nullable(),
  last_updated: z.string().nullable(),
  submission_count: z.number(),
  currency_code: z.string(),
});

// Inferred types
export type PriceConsensus = z.infer<typeof priceConsensusSchema>;
export type CardPriceHistory = z.infer<typeof cardPriceHistorySchema>;
export type CommunityPriceSubmission = z.infer<typeof communityPriceSubmissionSchema>;
export type SubmitPrice = z.infer<typeof submitPriceSchema>;
export type VotePrice = z.infer<typeof votePriceSchema>;
export type PriceStats = z.infer<typeof priceStatsSchema>;
