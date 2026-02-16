import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (_request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');
  }

  // Use admin client to bypass RLS for role check
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Solo administradores pueden acceder a esta función');
  }

  // Get all user profiles (admin client to see all users)
  const { data: users, error } = await adminClient
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar usuarios', { error });
  }

  return createSuccess({ users });
});
