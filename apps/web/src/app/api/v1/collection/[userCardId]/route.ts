import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { updateCollectionItemSchema } from '@myl/shared';
import { updateCollectionItem, removeFromCollection } from '@/lib/services/collection.service';
import { AppError } from '@/lib/api/errors';

export const PUT = withApiHandler(async (request, { params, requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para actualizar tu colección');
  }

  const { userCardId } = params;

  if (!userCardId) {
    throw new AppError('VALIDATION_ERROR', 'ID de item requerido');
  }

  const body = await request.json();
  const parsed = updateCollectionItemSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { errors: parsed.error.errors });
  }

  const item = await updateCollectionItem(supabase, user.id, userCardId, parsed.data);

  return createSuccess(item);
});

export const DELETE = withApiHandler(async (request, { params, requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para eliminar de tu colección');
  }

  const { userCardId } = params;

  if (!userCardId) {
    throw new AppError('VALIDATION_ERROR', 'ID de item requerido');
  }

  await removeFromCollection(supabase, user.id, userCardId);

  return createSuccess({ deleted: true });
});
