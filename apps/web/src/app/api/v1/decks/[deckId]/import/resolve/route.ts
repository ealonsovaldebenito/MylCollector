import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { importResolutionSchema } from '@myl/shared';
import { createDeckVersion } from '@/lib/services/decks.service';
import { auditImport } from '@/lib/services/export-import.service';
import { AppError } from '@/lib/api/errors';

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para importar mazos');
  }

  const { deckId } = await params;
  if (!deckId) throw new AppError('VALIDATION_ERROR', 'Deck ID is required');

  const body = await request.json();

  // Validate request
  const parsed = importResolutionSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos de resolución inválidos', {
      errors: parsed.error.errors,
    });
  }

  const { resolved_cards, selections } = parsed.data;

  // Verify user owns this deck
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('deck_id, user_id')
    .eq('deck_id', deckId)
    .single();

  if (deckError || !deck) {
    throw new AppError('NOT_FOUND', 'Mazo no encontrado');
  }

  if (deck.user_id !== user.id) {
    throw new AppError('FORBIDDEN', 'No tienes permiso para importar a este mazo');
  }

  // Combine resolved cards with selections
  const allCards = [...resolved_cards];

  for (const selection of selections) {
    allCards.push({
      card_printing_id: selection.card_printing_id,
      qty: 1, // This should come from the original ambiguous line
      is_starting_gold: false,
      line_number: selection.line_number,
    });
  }

  // Create deck version
  const cards = allCards.map((c) => ({
    card_printing_id: c.card_printing_id,
    qty: c.qty,
    is_starting_gold: c.is_starting_gold,
  }));

  const version = await createDeckVersion(
    supabase,
    deckId,
    cards,
    'Importado con resolución manual',
  );

  await auditImport(supabase, user.id, deckId, version.deck_version_id, 'txt', allCards.length, requestId);

  return createSuccess({
    deck_version_id: version.deck_version_id,
    imported_count: allCards.length,
  });
});
