/**
 * Community schemas — likes, comments, follows, public deck gallery.
 * Doc reference: 20260218000000_community_social.sql
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import { z } from 'zod';
import { uuidSchema, visibilitySchema } from './common.js';

// ============================================================================
// Comment mutations
// ============================================================================

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parent_id: uuidSchema.optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ============================================================================
// Public deck filters (gallery)
// ============================================================================

export const publicDeckSortSchema = z.enum(['newest', 'most_liked', 'most_viewed']);

export const publicDeckFiltersSchema = z.object({
  format_id: uuidSchema.optional(),
  edition_id: uuidSchema.optional(),
  race_id: uuidSchema.optional(),
  q: z.string().max(100).optional(),
  sort: publicDeckSortSchema.default('newest'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// Public deck list item (returned by gallery RPC)
// ============================================================================

export const publicDeckListItemSchema = z.object({
  deck_id: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  user_id: uuidSchema,
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  format_id: uuidSchema,
  format_name: z.string(),
  format_code: z.string(),
  edition_id: uuidSchema.nullable(),
  race_id: uuidSchema.nullable(),
  like_count: z.number().int(),
  view_count: z.number().int(),
  comment_count: z.number().int(),
  visibility: visibilitySchema,
  created_at: z.string(),
  updated_at: z.string(),
  total_count: z.number().int(),
  viewer_has_liked: z.boolean().optional(),
  cardsd: z.object({
    cover_image_url: z.string().nullable(),
    avg_cost: z.number().nullable(),
    total_copies: z.number().int(),
    unique_cards: z.number().int(),
    key_cards_count: z.number().int(),
    race_name: z.string().nullable(),
    edition_name: z.string().nullable(),
    key_cards: z.array(z.object({
      card_printing_id: uuidSchema,
      name: z.string(),
      image_url: z.string().nullable(),
      qty: z.number().int(),
    })),
  }).nullable().optional(),
});

// ============================================================================
// Deck comment (with author info, for display)
// ============================================================================

const baseDeckCommentSchema = z.object({
  comment_id: uuidSchema,
  deck_id: uuidSchema,
  user_id: uuidSchema,
  parent_id: uuidSchema.nullable(),
  content: z.string(),
  is_deleted: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

export const deckCommentSchema = baseDeckCommentSchema.extend({
  replies: z.array(baseDeckCommentSchema).optional(),
});

// ============================================================================
// User public profile
// ============================================================================

export const userPublicProfileSchema = z.object({
  user_id: uuidSchema,
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  bio: z.string().nullable(),
  created_at: z.string(),
  deck_count: z.number().int(),
  total_likes: z.number().int(),
  follower_count: z.number().int(),
  following_count: z.number().int(),
  viewer_is_following: z.boolean().optional(),
});

// ============================================================================
// Trending response
// ============================================================================

export const trendingDecksResponseSchema = z.object({
  trending: z.array(publicDeckListItemSchema),
  top_builders: z.array(z.object({
    user_id: uuidSchema,
    display_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    deck_count: z.number().int(),
    total_likes: z.number().int(),
  })),
});

// ============================================================================
// Inferred types
// ============================================================================

export type CreateComment = z.infer<typeof createCommentSchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;
export type PublicDeckSort = z.infer<typeof publicDeckSortSchema>;
export type PublicDeckFilters = z.infer<typeof publicDeckFiltersSchema>;
export type PublicDeckListItem = z.infer<typeof publicDeckListItemSchema>;
export type DeckComment = z.infer<typeof deckCommentSchema>;
export type UserPublicProfile = z.infer<typeof userPublicProfileSchema>;
export type TrendingDecksResponse = z.infer<typeof trendingDecksResponseSchema>;
export type TopBuilder = TrendingDecksResponse['top_builders'][number];
