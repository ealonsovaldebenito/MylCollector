/**
 * POST /api/v1/decks/:deckId/like — Toggle like en mazo.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/api/errors';
import { toggleDeckLike } from '@/lib/services/community.service';

export const POST = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const { deckId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');

  const result = await toggleDeckLike(supabase, deckId!, user.id);
  return createSuccess(result);
});
