/**
 * GET/POST /api/v1/admin/tags
 * List all tags or create a new tag (admin only)
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

export const GET = withApiHandler(async () => {
  const supabase = await createClient();

  const { data: tags, error } = await supabase
    .from('tags')
    .select('tag_id, name, slug, created_at')
    .order('name');

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar etiquetas');

  // Get usage count for each tag
  const { data: tagCounts } = await supabase
    .from('card_tags')
    .select('tag_id');

  const countMap = new Map<string, number>();
  if (tagCounts) {
    for (const tc of tagCounts) {
      countMap.set(tc.tag_id, (countMap.get(tc.tag_id) ?? 0) + 1);
    }
  }

  const tagsWithCount = (tags ?? []).map((t) => ({
    ...t,
    card_count: countMap.get(t.tag_id) ?? 0,
  }));

  return createSuccess({ tags: tagsWithCount });
});

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

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
    .insert({ name: trimmedName, slug })
    .select('tag_id, name, slug, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('VALIDATION_ERROR', `La etiqueta "${trimmedName}" ya existe`);
    }
    throw new AppError('INTERNAL_ERROR', 'Error al crear etiqueta');
  }

  return createSuccess({ tag });
});
