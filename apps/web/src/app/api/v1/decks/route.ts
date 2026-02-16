import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getUserDecks, createDeck } from '@/lib/services/decks.service';
import { createDeckSchema } from '@myl/shared';

export const GET = withApiHandler(async (_request, { requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const decks = await getUserDecks(supabase, user.id);
  return createSuccess({ items: decks });
});

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const body = await request.json();
  const parsed = createDeckSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', { issues: parsed.error.issues });
  }

  const deck = await createDeck(supabase, user.id, parsed.data);
  return createSuccess(deck);
});
