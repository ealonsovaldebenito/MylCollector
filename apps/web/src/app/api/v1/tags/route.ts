/**
 * POST /api/v1/tags
 * Create a new tag (authenticated users).
 *
 * Note: This creates a global tag in the shared `tags` table.
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const body = await request.json();
  const { name } = body as { name?: unknown };

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'El nombre es requerido');
  }

  const trimmedName = name.trim();
  const slug = trimmedName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data: tag, error } = await supabase
    .from('tags')
    .insert({ name: trimmedName, slug })
    .select('tag_id, name, slug, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('VALIDATION_ERROR', `La etiqueta "${trimmedName}" ya existe`);
    }
    throw new AppError('INTERNAL_ERROR', 'Error al crear etiqueta');
  }

  return createSuccess({ tag }, 201);
});

