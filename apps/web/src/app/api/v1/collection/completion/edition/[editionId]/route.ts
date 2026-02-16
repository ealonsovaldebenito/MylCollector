import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getCompletionByEdition } from '@/lib/services/collection.service';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (request, { params, requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError(
      'NOT_AUTHENTICATED',
      'Debes iniciar sesión para ver estadísticas de edición',
    );
  }

  const { editionId } = params;

  if (!editionId) {
    throw new AppError('VALIDATION_ERROR', 'ID de edición requerido');
  }

  const completion = await getCompletionByEdition(supabase, user.id, editionId);

  return createSuccess(completion);
});
