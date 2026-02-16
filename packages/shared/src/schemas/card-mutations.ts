import { z } from 'zod';

import { legalStatusSchema } from './card.js';

// ============================================================================
// Card mutation schemas — create/update for cards and printings
// Doc reference: 11_API_CONTRACTS.md
// ============================================================================

export const createCardSchema = z.object({
  name: z.string().min(1).max(200),
  card_type_id: z.string().uuid(),
  race_id: z.string().uuid().optional(),
  ally_strength: z.number().int().positive().optional(),
  cost: z.number().int().min(0).optional(),
  is_unique: z.boolean().default(false),
  has_ability: z.boolean().default(false),
  can_be_starting_gold: z.boolean().default(false),
  text: z.string().max(2000).optional(),
  flavor_text: z.string().max(1000).optional(),
  tag_ids: z.array(z.string().uuid()).default([]),
});

export const updateCardSchema = createCardSchema.partial();

export const createCardPrintingSchema = z.object({
  card_id: z.string().uuid(),
  edition_id: z.string().uuid(),
  rarity_tier_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
  illustrator: z.string().max(200).optional(),
  collector_number: z.string().max(20).optional(),
  legal_status: legalStatusSchema.default('LEGAL'),
  printing_variant: z.string().max(50).default('standard'),
});

export const updateCardPrintingSchema = createCardPrintingSchema.partial().omit({ card_id: true });

export type CreateCard = z.infer<typeof createCardSchema>;
export type UpdateCard = z.infer<typeof updateCardSchema>;
export type CreateCardPrinting = z.infer<typeof createCardPrintingSchema>;
export type UpdateCardPrinting = z.infer<typeof updateCardPrintingSchema>;
