/**
 * Card oracles API — public endpoint to get oracles for a card.
 * GET /api/v1/cards/:cardId/oracles — List oracles for a card
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getCardOracles } from '@/lib/services/oracles.service';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const cardId = params.cardId;

  if (!cardId) return createError('VALIDATION_ERROR', 'cardId requerido', requestId);

  const oracles = await getCardOracles(supabase, cardId);
  return createSuccess({ items: oracles });
});
