import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/lib/api/errors';

/**
 * GET /api/v1/me
 * Returns the current authenticated user's profile
 */
export const GET = withApiHandler(async (_request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');
  }

  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar perfil', { error });
  }

  return createSuccess({ profile });
});
