/**
 * GET/POST /api/v1/decks/:deckId/comments — Comentarios de un mazo.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/api/errors';
import { createCommentSchema } from '@myl/shared';
import { getDeckComments, createDeckComment } from '@/lib/services/community.service';

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const { deckId } = params;

  const comments = await getDeckComments(supabase, deckId!);
  return createSuccess({ items: comments });
});

export const POST = withApiHandler(async (request, { params }) => {
  const supabase = await createClient();
  const { deckId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');

  const body = await request.json();
  const data = createCommentSchema.parse(body);

  const comment = await createDeckComment(supabase, deckId!, user.id, data);
  return createSuccess(comment);
});
