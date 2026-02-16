import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/lib/api/errors';
import { z } from 'zod';

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  is_active: z.boolean().optional(),
});

export const PATCH = withApiHandler(async (request, { params, requestId: _requestId }) => {
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
    throw new AppError('FORBIDDEN', 'Solo administradores pueden cambiar roles');
  }

  const { userId } = await params;

  if (!userId) {
    throw new AppError('VALIDATION_ERROR', 'ID de usuario requerido');
  }

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { errors: parsed.error.errors });
  }

  // Update user profile (use admin client to bypass RLS)
  const { data: updatedUser, error } = await adminClient
    .from('user_profiles')
    .update(parsed.data)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al actualizar usuario', { error });
  }

  return createSuccess({ user: updatedUser });
});
