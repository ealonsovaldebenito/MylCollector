import { z } from 'zod';
import { paginationQuerySchema } from './pagination.js';

/**
 * Card condition enum
 */
export const cardConditionSchema = z.enum([
  'MINT',
  'NEAR_MINT',
  'EXCELLENT',
  'GOOD',
  'LIGHT_PLAYED',
  'PLAYED',
  'POOR',
]);
export type CardCondition = z.infer<typeof cardConditionSchema>;

/**
 * User card in collection
 */
export const userCardSchema = z.object({
  user_card_id: z.string().uuid(),
  user_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  qty: z.number().int().positive(),
  condition: cardConditionSchema.default('NEAR_MINT'),
  notes: z.string().nullable().optional(),
  acquired_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserCard = z.infer<typeof userCardSchema>;

/**
 * User card with expanded relations (for display)
 */
export const userCardWithRelationsSchema = userCardSchema.extend({
  card_printing: z.object({
    card_printing_id: z.string().uuid(),
    image_url: z.string().nullable(),
    legal_status: z.enum(['STANDARD', 'DISCONTINUED']),
    card: z.object({
      card_id: z.string().uuid(),
      name: z.string(),
      card_type: z.object({
        name: z.string(),
        code: z.string(),
      }),
      race: z
        .object({
          name: z.string(),
          code: z.string(),
        })
        .nullable(),
      cost: z.number().nullable(),
    }),
    edition: z.object({
      edition_id: z.string().uuid(),
      block_id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
    }),
    rarity_tier: z
      .object({
        name: z.string(),
        code: z.string(),
      })
      .nullable(),
  }),
});
export type UserCardWithRelations = z.infer<typeof userCardWithRelationsSchema>;

/**
 * Collection stats
 */
export const collectionStatsSchema = z.object({
  total_cards: z.number().int().nonnegative(),
  total_printings: z.number().int().nonnegative(),
  total_unique_cards: z.number().int().nonnegative(),
  by_block: z.record(
    z.string(),
    z.object({
      block_name: z.string(),
      count: z.number().int().nonnegative(),
      unique_cards: z.number().int().nonnegative(),
    }),
  ),
  by_rarity: z.record(
    z.string(),
    z.object({
      rarity_name: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  by_condition: z.record(
    cardConditionSchema,
    z.number().int().nonnegative(),
  ),
});
export type CollectionStats = z.infer<typeof collectionStatsSchema>;

/**
 * Missing cards for a deck
 */
export const missingCardSchema = z.object({
  card_printing_id: z.string().uuid(),
  card_name: z.string(),
  edition_name: z.string(),
  image_url: z.string().nullable(),
  qty_needed: z.number().int().positive(),
  qty_owned: z.number().int().nonnegative(),
  qty_missing: z.number().int().positive(),
  price_estimate: z.number().nullable(),
  rarity_tier_name: z.string().nullable(),
});
export type MissingCard = z.infer<typeof missingCardSchema>;

/**
 * Block completion stats
 */
export const blockCompletionSchema = z.object({
  block_id: z.string().uuid(),
  block_name: z.string(),
  total_unique_cards: z.number().int().positive(),
  owned_unique_cards: z.number().int().nonnegative(),
  completion_percentage: z.number().min(0).max(100),
});
export type BlockCompletion = z.infer<typeof blockCompletionSchema>;

/**
 * Edition completion stats
 */
export const editionCompletionSchema = z.object({
  edition_id: z.string().uuid(),
  edition_name: z.string(),
  block_id: z.string().uuid(),
  block_name: z.string(),
  total_printings: z.number().int().positive(),
  owned_printings: z.number().int().nonnegative(),
  completion_percentage: z.number().min(0).max(100),
});
export type EditionCompletion = z.infer<typeof editionCompletionSchema>;

/**
 * Add card to collection
 */
export const addToCollectionSchema = z.object({
  card_printing_id: z.string().uuid(),
  qty: z.number().int().positive().default(1),
  condition: cardConditionSchema.default('NEAR_MINT'),
  notes: z.string().max(500).optional(),
  acquired_at: z.string().datetime().optional(),
});
export type AddToCollection = z.infer<typeof addToCollectionSchema>;

/**
 * Update collection item
 */
export const updateCollectionItemSchema = z.object({
  qty: z.number().int().positive().optional(),
  condition: cardConditionSchema.optional(),
  notes: z.string().max(500).nullable().optional(),
  acquired_at: z.string().datetime().nullable().optional(),
});
export type UpdateCollectionItem = z.infer<typeof updateCollectionItemSchema>;

/**
 * Bulk update collection (for CSV import)
 */
export const bulkCollectionUpdateSchema = z.object({
  updates: z.array(
    z.object({
      card_printing_id: z.string().uuid(),
      qty: z.number().int().positive(),
      condition: cardConditionSchema.default('NEAR_MINT'),
      notes: z.string().max(500).optional(),
    }),
  ),
  mode: z.enum(['REPLACE', 'MERGE']).default('MERGE'),
});
export type BulkCollectionUpdate = z.infer<typeof bulkCollectionUpdateSchema>;

/**
 * Collection filters
 */
export const collectionFiltersSchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  block_id: z.string().uuid().optional(),
  edition_id: z.string().uuid().optional(),
  card_type_id: z.string().uuid().optional(),
  race_id: z.string().uuid().optional(),
  rarity_tier_id: z.string().uuid().optional(),
  condition: cardConditionSchema.optional(),
  min_qty: z.number().int().positive().optional(),
  sort: z
    .enum([
      'name_asc',
      'name_desc',
      'qty_asc',
      'qty_desc',
      'acquired_asc',
      'acquired_desc',
      'cost_asc',
      'cost_desc',
    ])
    .default('name_asc')
    .optional(),
});
export type CollectionFilters = z.infer<typeof collectionFiltersSchema>;

/**
 * CSV import line for collection
 */
export const collectionCsvLineSchema = z.object({
  card_name: z.string(),
  edition_hint: z.string().optional(),
  qty: z.number().int().positive(),
  condition: cardConditionSchema.default('NEAR_MINT'),
  notes: z.string().optional(),
});
export type CollectionCsvLine = z.infer<typeof collectionCsvLineSchema>;

/**
 * Collection CSV import result
 */
export const collectionImportResultSchema = z.object({
  success: z.boolean(),
  imported_count: z.number().int().nonnegative(),
  skipped_count: z.number().int().nonnegative(),
  errors: z.array(
    z.object({
      line_number: z.number().int().positive(),
      error: z.string(),
    }),
  ),
});
export type CollectionImportResult = z.infer<typeof collectionImportResultSchema>;
