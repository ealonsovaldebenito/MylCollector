import { z } from 'zod';

import { visibilitySchema } from './common.js';

// ============================================================================
// Deck mutation schemas — create/update decks and versions
// Doc reference: 11_API_CONTRACTS.md
// ============================================================================

export const createDeckSchema = z.object({
  name: z.string().min(1).max(200),
  format_id: z.string().uuid(),
  edition_id: z.string().uuid().nullable().optional(),
  race_id: z.string().uuid().nullable().optional(),
  description: z.string().max(1000).optional(),
  visibility: visibilitySchema.default('PRIVATE'),
});

export const updateDeckSchema = createDeckSchema.partial();

export const deckVersionCardInputSchema = z.object({
  card_printing_id: z.string().uuid(),
  qty: z.number().int().positive(),
  is_starting_gold: z.boolean().default(false),
});

export const createDeckVersionSchema = z.object({
  cards: z.array(deckVersionCardInputSchema).min(1),
  notes: z.string().max(500).optional(),
});

export const liveValidateSchema = z.object({
  format_id: z.string().uuid(),
  cards: z.array(deckVersionCardInputSchema),
});

// Inferred types
export type CreateDeck = z.infer<typeof createDeckSchema>;
export type UpdateDeck = z.infer<typeof updateDeckSchema>;
export type DeckVersionCardInput = z.infer<typeof deckVersionCardInputSchema>;
export type CreateDeckVersion = z.infer<typeof createDeckVersionSchema>;
export type LiveValidateInput = z.infer<typeof liveValidateSchema>;
