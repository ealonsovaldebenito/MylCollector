/**
 * Deck strategy sections API — CRUD for deck strategy content.
 * GET  /api/v1/decks/:deckId/strategy — List strategy sections for a deck
 * POST /api/v1/decks/:deckId/strategy — Create a strategy section
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getDeckStrategySections, createDeckStrategySection } from '@/lib/services/oracles.service';
import { createDeckStrategySectionSchema } from '@myl/shared';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const deckId = params.deckId;

  if (!deckId) return createError('VALIDATION_ERROR', 'deckId requerido', requestId);

  const sections = await getDeckStrategySections(supabase, deckId);
  return createSuccess({ items: sections });
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const deckId = params.deckId;

  const body = await request.json();
  const parsed = createDeckStrategySectionSchema.safeParse(body);
  if (!parsed.success) {
    return createError('VALIDATION_ERROR', 'Datos inválidos', requestId, parsed.error.flatten());
  }

  const section = await createDeckStrategySection(supabase, deckId!, user.id, parsed.data);
  return createSuccess(section, 201);
});
