/**
 * PUT/DELETE /api/v1/admin/tags/[tagId]
 * Update or delete a tag (admin only)
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const tagId = params.tagId!;
  const body = await request.json();
  const { name } = body;

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
    .update({ name: trimmedName, slug })
    .eq('tag_id', tagId)
    .select('tag_id, name, slug, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('VALIDATION_ERROR', `La etiqueta "${trimmedName}" ya existe`);
    }
    throw new AppError('INTERNAL_ERROR', 'Error al actualizar etiqueta');
  }

  if (!tag) throw new AppError('NOT_FOUND', 'Etiqueta no encontrada');
  return createSuccess({ tag });
});

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const tagId = params.tagId!;

  // card_tags should cascade delete
  const { error } = await supabase.from('tags').delete().eq('tag_id', tagId);
  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar etiqueta');

  return createSuccess({ deleted: true });
});
