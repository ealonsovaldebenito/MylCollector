import { z } from 'zod';

import { paginationQuerySchema } from './pagination.js';
import { legalStatusSchema } from './card.js';

// ============================================================================
// Card filter schemas — search + filter query params
// Doc reference: 11_API_CONTRACTS.md, 08_UX_UI_SYSTEM.md
// ============================================================================

export const cardFiltersSchema = paginationQuerySchema.extend({
  q: z.string().optional(),
  block_id: z.string().uuid().optional(),
  edition_id: z.string().uuid().optional(),
  race_id: z.string().uuid().optional(),
  card_type_id: z.string().uuid().optional(),
  rarity_tier_id: z.string().uuid().optional(),
  legal_status: legalStatusSchema.optional(),
  cost_min: z.coerce.number().int().min(0).optional(),
  cost_max: z.coerce.number().int().min(0).optional(),
  tag_slug: z.string().optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  has_price: z.coerce.boolean().optional(),
});

export type CardFilters = z.infer<typeof cardFiltersSchema>;
