/**
 * GET  /api/v1/collections — List user collections (folders)
 * POST /api/v1/collections — Create a new collection
 *
 * Changelog:
 * - 2026-02-17: Initial creation
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createCollectionSchema } from '@myl/shared';
import { getUserCollections, createCollection } from '@/lib/services/collections.service';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (_request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para ver tus colecciones');
  }

  const collections = await getUserCollections(supabase, user.id);

  return createSuccess({ items: collections });
});

export const POST = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para crear una colección');
  }

  const body = await request.json();
  const parsed = createCollectionSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { errors: parsed.error.errors });
  }

  const collection = await createCollection(supabase, user.id, parsed.data);

  return createSuccess({ collection }, 201);
});
