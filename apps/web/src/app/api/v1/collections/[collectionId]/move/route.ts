/**
 * POST /api/v1/collections/:collectionId/move — Move cards to this collection
 *
 * If collectionId is "general", cards are moved to collection_id = NULL (uncategorized).
 *
 * Changelog:
 * - 2026-02-17: Initial creation
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { moveCardsSchema } from '@myl/shared';
import { moveCardsToCollection } from '@/lib/services/collections.service';
import { AppError } from '@/lib/api/errors';

export const POST = withApiHandler(async (request, { params, requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para mover cartas');
  }

  const { collectionId } = params;
  if (!collectionId) {
    throw new AppError('VALIDATION_ERROR', 'ID de colección requerido');
  }

  const body = await request.json();
  const parsed = moveCardsSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { errors: parsed.error.errors });
  }

  const targetId = collectionId === 'general' ? null : collectionId;
  await moveCardsToCollection(supabase, user.id, parsed.data.user_card_ids, targetId);

  return createSuccess({ moved: true });
});
