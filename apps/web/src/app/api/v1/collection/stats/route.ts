import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getCollectionStats } from '@/lib/services/collection.service';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para ver estadísticas');
  }

  const stats = await getCollectionStats(supabase, user.id);

  return createSuccess(stats);
});
