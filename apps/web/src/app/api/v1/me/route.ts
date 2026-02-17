import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/lib/api/errors';
import { updateProfileSchema } from '@myl/shared';

/**
 * GET /api/v1/me
 * Returns the current authenticated user's profile
 */
export const GET = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  // Fallback: accept Bearer token when cookies are not available yet.
  if (!user) {
    const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) user = data.user;
    }
  }

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

/**
 * PUT /api/v1/me
 * Updates the current authenticated user's profile in DB (admin bypass for RLS).
 *
 * Note: Auth metadata should be updated on the client via supabase.auth.updateUser.
 */
export const PUT = withApiHandler(async (request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos de perfil inválidos', {
      errors: parsed.error.errors,
    });
  }

  const updates = parsed.data;

  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from('user_profiles')
    .update({
      ...(updates.display_name !== undefined ? { display_name: updates.display_name } : {}),
      ...(updates.avatar_url !== undefined ? { avatar_url: updates.avatar_url } : {}),
      ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al actualizar perfil', { error });
  }

  return createSuccess({ profile });
});
