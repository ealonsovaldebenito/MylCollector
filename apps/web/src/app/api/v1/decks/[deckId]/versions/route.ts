import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getDeck, getDeckVersions, createDeckVersion } from '@/lib/services/decks.service';
import { createDeckVersionSchema } from '@myl/shared';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const deck = await getDeck(supabase, params.deckId!);
  if (deck.user_id !== user.id) {
    return createError('FORBIDDEN', 'No tienes acceso a este mazo', requestId);
  }

  const versions = await getDeckVersions(supabase, params.deckId!);
  return createSuccess({ items: versions });
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const deck = await getDeck(supabase, params.deckId!);
  if (deck.user_id !== user.id) {
    return createError('FORBIDDEN', 'No tienes acceso a este mazo', requestId);
  }

  const body = await request.json();
  const parsed = createDeckVersionSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', { issues: parsed.error.issues });
  }

  const version = await createDeckVersion(supabase, params.deckId!, parsed.data.cards, parsed.data.notes);
  return createSuccess(version);
});
