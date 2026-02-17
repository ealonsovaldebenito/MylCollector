/**
 * PUT    /api/v1/collections/:collectionId — Update a collection
 * DELETE /api/v1/collections/:collectionId — Delete a collection
 *
 * Changelog:
 * - 2026-02-17: Initial creation
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { updateCollectionSchema } from '@myl/shared';
import { updateCollection, deleteCollection } from '@/lib/services/collections.service';
import { AppError } from '@/lib/api/errors';

export const PUT = withApiHandler(async (request, { params, requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para actualizar una colección');
  }

  const { collectionId } = params;
  if (!collectionId) {
    throw new AppError('VALIDATION_ERROR', 'ID de colección requerido');
  }

  const body = await request.json();
  const parsed = updateCollectionSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { errors: parsed.error.errors });
  }

  const collection = await updateCollection(supabase, user.id, collectionId, parsed.data);

  return createSuccess({ collection });
});

export const DELETE = withApiHandler(async (_request, { params, requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para eliminar una colección');
  }

  const { collectionId } = params;
  if (!collectionId) {
    throw new AppError('VALIDATION_ERROR', 'ID de colección requerido');
  }

  await deleteCollection(supabase, user.id, collectionId);

  return createSuccess({ deleted: true });
});
