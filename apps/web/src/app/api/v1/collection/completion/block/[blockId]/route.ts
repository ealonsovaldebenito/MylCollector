import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getCompletionByBlock } from '@/lib/services/collection.service';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (request, { params, requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para ver estadísticas de bloque');
  }

  const { blockId } = params;

  if (!blockId) {
    throw new AppError('VALIDATION_ERROR', 'ID de bloque requerido');
  }

  const completion = await getCompletionByBlock(supabase, user.id, blockId);

  return createSuccess(completion);
});
