import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getDeck, updateDeck, deleteDeck } from '@/lib/services/decks.service';
import { updateDeckSchema } from '@myl/shared';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const deck = await getDeck(supabase, params.deckId!);
  if (deck.user_id !== user.id) {
    return createError('FORBIDDEN', 'No tienes acceso a este mazo', requestId);
  }

  return createSuccess(deck);
});

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const existing = await getDeck(supabase, params.deckId!);
  if (existing.user_id !== user.id) {
    return createError('FORBIDDEN', 'No tienes acceso a este mazo', requestId);
  }

  const body = await request.json();
  const parsed = updateDeckSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', { issues: parsed.error.issues });
  }

  const deck = await updateDeck(supabase, params.deckId!, parsed.data);
  return createSuccess(deck);
});

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const existing = await getDeck(supabase, params.deckId!);
  if (existing.user_id !== user.id) {
    return createError('FORBIDDEN', 'No tienes acceso a este mazo', requestId);
  }

  await deleteDeck(supabase, params.deckId!);
  return createSuccess({ deleted: true });
});
