import { z } from 'zod';
import { paginationQuerySchema } from './pagination.js';

/**
 * Card condition enum (alineado con card_conditions de BD)
 * Valores:
 *  - PERFECTA (9-10)
 *  - CASI PERFECTA (8)
 *  - EXCELENTE (7)
 *  - BUENA (6)
 *  - POCO USO (5)
 *  - JUGADA (4)
 *  - MALAS CONDICIONES (1-3)
 */
export const cardConditionSchema = z.enum([
  'PERFECTA',
  'CASI PERFECTA',
  'EXCELENTE',
  'BUENA',
  'POCO USO',
  'JUGADA',
  'MALAS CONDICIONES',
]);
export type CardCondition = z.infer<typeof cardConditionSchema>;

/**
 * User card in collection
 */
export const userCardSchema = z.object({
  user_card_id: z.string().uuid(),
  user_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  collection_id: z.string().uuid().nullable().optional(),
  qty: z.number().int().positive(),
  condition: cardConditionSchema.default('PERFECTA'),
  notes: z.string().nullable().optional(),
  user_price: z.number().positive().nullable().optional(),
  is_for_sale: z.boolean().default(false),
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
  total_user_value: z.number().nonnegative().default(0),
  total_store_value: z.number().nonnegative().default(0),
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
  condition: cardConditionSchema.default('PERFECTA'),
  notes: z.string().max(500).optional(),
  user_price: z.number().positive().nullable().optional(),
  is_for_sale: z.boolean().optional(),
  collection_id: z.string().uuid().nullable().optional(),
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
  user_price: z.number().positive().nullable().optional(),
  is_for_sale: z.boolean().optional(),
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
      condition: cardConditionSchema.default('PERFECTA'),
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
      'price_asc',
      'price_desc',
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
  condition: cardConditionSchema.default('PERFECTA'),
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

/**
 * User collection (folder)
 */
export const userCollectionSchema = z.object({
  collection_id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  color: z.string().max(20).default('#6366f1'),
  sort_order: z.number().int().default(0),
  card_count: z.number().int().nonnegative().default(0),
  total_value: z.number().nonnegative().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserCollection = z.infer<typeof userCollectionSchema>;

/**
 * Create collection
 */
export const createCollectionSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});
export type CreateCollection = z.infer<typeof createCollectionSchema>;

/**
 * Update collection
 */
export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().max(20).optional(),
  sort_order: z.number().int().optional(),
});
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;

/**
 * Move cards between collections
 */
export const moveCardsSchema = z.object({
  user_card_ids: z.array(z.string().uuid()).min(1),
  target_collection_id: z.string().uuid().nullable(),
});
export type MoveCards = z.infer<typeof moveCardsSchema>;
