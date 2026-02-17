import { z } from 'zod';

// ============================================================================
// Catalog schemas — blocks, editions, card_types, races, rarities, tags
// Doc reference: 00_GLOSSARY_AND_IDS.md, 03_DATA_MODEL_SQL.md
// ============================================================================

export const blockSchema = z.object({
  block_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  sort_order: z.number().int(),
});

export const editionSchema = z.object({
  edition_id: z.string().uuid(),
  block_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  release_date: z.string().nullable(),
  sort_order: z.number().int(),
});

export const editionWithBlockSchema = editionSchema.extend({
  block: blockSchema,
});

export const cardTypeSchema = z.object({
  card_type_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  sort_order: z.number().int(),
});

export const raceSchema = z.object({
  race_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  sort_order: z.number().int(),
});

export const rarityTierSchema = z.object({
  rarity_tier_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  sort_order: z.number().int(),
});

export const tagSchema = z.object({
  tag_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

export const cardConditionRefSchema = z.object({
  condition_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  sort_order: z.number().int(),
});

// Inferred types
export type Block = z.infer<typeof blockSchema>;
export type Edition = z.infer<typeof editionSchema>;
export type EditionWithBlock = z.infer<typeof editionWithBlockSchema>;
export type CardType = z.infer<typeof cardTypeSchema>;
export type Race = z.infer<typeof raceSchema>;
export type RarityTier = z.infer<typeof rarityTierSchema>;
export type Tag = z.infer<typeof tagSchema>;
export type CardConditionRef = z.infer<typeof cardConditionRefSchema>;
