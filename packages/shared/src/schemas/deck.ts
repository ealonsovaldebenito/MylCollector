import { z } from 'zod';

import { visibilitySchema } from './common.js';

// ============================================================================
// Deck schemas — decks, versions, version cards
// Doc reference: 03_DATA_MODEL_SQL.md, 00_GLOSSARY_AND_IDS.md
// ============================================================================

export const deckSchema = z.object({
  deck_id: z.string().uuid(),
  user_id: z.string().uuid(),
  format_id: z.string().uuid(),
  edition_id: z.string().uuid().nullable(),
  race_id: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  strategy: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  visibility: visibilitySchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const deckVersionSchema = z.object({
  deck_version_id: z.string().uuid(),
  deck_id: z.string().uuid(),
  version_number: z.number().int().positive(),
  notes: z.string().nullable(),
  created_at: z.string(),
});

export const deckVersionCardSchema = z.object({
  deck_version_card_id: z.string().uuid(),
  deck_version_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  qty: z.number().int().positive(),
  is_starting_gold: z.boolean(),
  is_key_card: z.boolean(),
});

// Inferred types
export type Deck = z.infer<typeof deckSchema>;
export type DeckVersion = z.infer<typeof deckVersionSchema>;
export type DeckVersionCard = z.infer<typeof deckVersionCardSchema>;
