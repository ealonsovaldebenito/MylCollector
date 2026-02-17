/**
 * Deck strategy section detail API — update/delete individual sections.
 * PUT    /api/v1/decks/:deckId/strategy/:sectionId — Update section
 * DELETE /api/v1/decks/:deckId/strategy/:sectionId — Delete section
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { updateDeckStrategySection, deleteDeckStrategySection } from '@/lib/services/oracles.service';
import { updateDeckStrategySectionSchema } from '@myl/shared';

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const sectionId = params.sectionId!;

  const body = await request.json();
  const parsed = updateDeckStrategySectionSchema.safeParse(body);
  if (!parsed.success) {
    return createError('VALIDATION_ERROR', 'Datos inválidos', requestId, parsed.error.flatten());
  }

  const updated = await updateDeckStrategySection(supabase, sectionId, parsed.data);
  return createSuccess(updated);
});

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const sectionId = params.sectionId!;

  await deleteDeckStrategySection(supabase, sectionId);
  return createSuccess({ deleted: true });
});
