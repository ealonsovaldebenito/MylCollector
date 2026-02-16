import { z } from 'zod';

import { cardTypeSchema, editionSchema, raceSchema, rarityTierSchema, tagSchema } from './catalog.js';
import { priceConsensusSchema } from './price.js';

// ============================================================================
// Card schemas — base card, printing, relations, detail
// Doc reference: 00_GLOSSARY_AND_IDS.md, 03_DATA_MODEL_SQL.md
// ============================================================================

export const legalStatusSchema = z.enum(['LEGAL', 'RESTRICTED', 'BANNED', 'DISCONTINUED']);

export type LegalStatus = z.infer<typeof legalStatusSchema>;

// Card (conceptual identity)
export const cardBaseSchema = z.object({
  card_id: z.string().uuid(),
  name: z.string(),
  name_normalized: z.string(),
  card_type_id: z.string().uuid(),
  race_id: z.string().uuid().nullable(),
  ally_strength: z.number().int().positive().nullable(),
  cost: z.number().int().nullable(),
  is_unique: z.boolean(),
  has_ability: z.boolean(),
  can_be_starting_gold: z.boolean(),
  text: z.string().nullable(),
  flavor_text: z.string().nullable(),
});

// Card with joined relations
export const cardWithRelationsSchema = cardBaseSchema.extend({
  card_type: cardTypeSchema,
  race: raceSchema.nullable(),
  tags: z.array(tagSchema),
});

// Card printing (edition-specific)
export const cardPrintingSchema = z.object({
  card_printing_id: z.string().uuid(),
  card_id: z.string().uuid(),
  edition_id: z.string().uuid(),
  rarity_tier_id: z.string().uuid().nullable(),
  image_url: z.string().nullable(),
  illustrator: z.string().nullable(),
  collector_number: z.string().nullable(),
  legal_status: legalStatusSchema,
  printing_variant: z.string(),
});

// Card printing with joined relations
export const cardPrintingWithRelationsSchema = cardPrintingSchema.extend({
  edition: editionSchema,
  rarity_tier: rarityTierSchema.nullable(),
  card: cardWithRelationsSchema,
});

// Full card detail (for detail view)
export const cardDetailSchema = cardWithRelationsSchema.extend({
  printings: z.array(
    cardPrintingSchema.extend({
      edition: editionSchema,
      rarity_tier: rarityTierSchema.nullable(),
      price_consensus: priceConsensusSchema.nullable(),
    })
  ),
});

// Inferred types
export type Card = z.infer<typeof cardBaseSchema>;
export type CardWithRelations = z.infer<typeof cardWithRelationsSchema>;
export type CardPrinting = z.infer<typeof cardPrintingSchema>;
export type CardPrintingWithRelations = z.infer<typeof cardPrintingWithRelationsSchema>;
export type CardDetail = z.infer<typeof cardDetailSchema>;
