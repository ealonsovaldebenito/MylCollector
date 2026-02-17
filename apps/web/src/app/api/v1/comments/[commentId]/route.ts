/**
 * PUT/DELETE /api/v1/comments/:commentId — Editar/eliminar comentario propio.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/api/errors';
import { updateCommentSchema } from '@myl/shared';
import { updateDeckComment, deleteDeckComment } from '@/lib/services/community.service';

export const PUT = withApiHandler(async (request, { params }) => {
  const supabase = await createClient();
  const { commentId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');

  const body = await request.json();
  const data = updateCommentSchema.parse(body);

  const comment = await updateDeckComment(supabase, commentId!, user.id, data);
  return createSuccess(comment);
});

export const DELETE = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const { commentId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');

  await deleteDeckComment(supabase, commentId!, user.id);
  return createSuccess({ deleted: true });
});
