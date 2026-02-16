import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { bulkCollectionUpdateSchema } from '@myl/shared';
import { bulkUpdateCollection } from '@/lib/services/collection.service';
import { AppError } from '@/lib/api/errors';

export const POST = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para importar colección');
  }

  const body = await request.json();
  const parsed = bulkCollectionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { errors: parsed.error.errors });
  }

  const result = await bulkUpdateCollection(supabase, user.id, parsed.data);

  return createSuccess(result);
});
