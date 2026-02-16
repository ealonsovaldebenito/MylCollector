import { cardFiltersSchema, createCardSchema } from '@myl/shared';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { searchCards, createCard } from '@/lib/services/cards.service';

export const GET = withApiHandler(async (request) => {
  const supabase = await createClient();
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = cardFiltersSchema.parse(params);
  const result = await searchCards(supabase, filters);
  return createSuccess(result);
});

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const body = await request.json();
  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', {
      issues: parsed.error.issues,
    });
  }

  const card = await createCard(supabase, parsed.data);
  return createSuccess(card, 201);
});
