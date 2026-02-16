import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { addToCollectionSchema, collectionFiltersSchema } from '@myl/shared';
import { getUserCollection, addToCollection } from '@/lib/services/collection.service';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para ver tu colección');
  }

  const url = new URL(request.url);
  const filters = collectionFiltersSchema.parse({
    q: url.searchParams.get('q') || undefined,
    block_id: url.searchParams.get('block_id') || undefined,
    edition_id: url.searchParams.get('edition_id') || undefined,
    card_type_id: url.searchParams.get('card_type_id') || undefined,
    race_id: url.searchParams.get('race_id') || undefined,
    rarity_tier_id: url.searchParams.get('rarity_tier_id') || undefined,
    condition: url.searchParams.get('condition') || undefined,
    min_qty: url.searchParams.get('min_qty') ? Number(url.searchParams.get('min_qty')) : undefined,
    sort: url.searchParams.get('sort') || 'name_asc',
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 50,
  });

  const items = await getUserCollection(supabase, user.id, filters);

  return createSuccess({ items });
});

export const POST = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para agregar a tu colección');
  }

  const body = await request.json();
  const parsed = addToCollectionSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { errors: parsed.error.errors });
  }

  const item = await addToCollection(supabase, user.id, parsed.data);

  return createSuccess(item);
});
