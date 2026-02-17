/**
 * File: apps/web/src/app/api/v1/decks/[deckId]/key-cards/route.ts
 * Context: Builder → persistencia de "cartas clave" (estrella) por mazo.
 * Description:
 * - GET: retorna `{ card_ids: uuid[] }`
 * - PUT: reemplaza set completo `{ card_ids: uuid[] }` (delete + insert)
 * Relations:
 * - DB: `deck_key_cards(deck_id, card_id)` (migration `20260217000002_deck_key_cards_table.sql`)
 * - Hook: `apps/web/src/hooks/use-deck-builder.ts`
 * Changelog:
 * - 2026-02-17: Nuevo endpoint para persistir key cards sin crear versiones.
 */

import { z } from 'zod';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/api/errors';

const setDeckKeyCardsSchema = z.object({
  card_ids: z.array(z.string().uuid()).max(200),
});

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const deckId = params.deckId!;

  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('deck_id, user_id, visibility')
    .eq('deck_id', deckId)
    .single();

  if (deckError || !deck) throw new AppError('NOT_FOUND', 'Mazo no encontrado');
  if (deck.user_id !== user.id) return createError('FORBIDDEN', 'No tienes acceso a este mazo', requestId);

  const { data, error } = await supabase
    .from('deck_key_cards')
    .select('card_id')
    .eq('deck_id', deckId);

  if (error) throw error;

  return createSuccess({ card_ids: (data ?? []).map((r) => r.card_id as string) });
});

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const deckId = params.deckId!;

  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('deck_id, user_id')
    .eq('deck_id', deckId)
    .single();

  if (deckError || !deck) throw new AppError('NOT_FOUND', 'Mazo no encontrado');
  if (deck.user_id !== user.id) return createError('FORBIDDEN', 'No tienes acceso a este mazo', requestId);

  const body = await request.json();
  const parsed = setDeckKeyCardsSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', { issues: parsed.error.issues });
  }

  const cardIds = parsed.data.card_ids;

  const { error: delErr } = await supabase.from('deck_key_cards').delete().eq('deck_id', deckId);
  if (delErr) throw delErr;

  if (cardIds.length > 0) {
    const rows = cardIds.map((card_id) => ({ deck_id: deckId, card_id }));
    const { error: insErr } = await supabase.from('deck_key_cards').insert(rows as never);
    if (insErr) throw insErr;
  }

  return createSuccess({ deck_id: deckId, card_ids: cardIds });
});

