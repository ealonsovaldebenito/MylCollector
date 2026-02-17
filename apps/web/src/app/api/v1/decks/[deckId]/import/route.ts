/**
 * File: apps/web/src/app/api/v1/decks/[deckId]/import/route.ts
 * Context: Importador de mazos (TXT/CSV) → crea una nueva versión del mazo.
 * Description: Importa payload, resuelve cartas y persiste como `deck_version_cards`.
 * Relations:
 * - Service: `importDeck` (`apps/web/src/lib/services/export-import.service.ts`)
 * - Versionado: `createDeckVersion` (`apps/web/src/lib/services/decks.service.ts`)
 * Changelog:
 * - 2026-02-17: Incluye `is_key_card` en payload (default false) para compatibilidad con persistencia en DB.
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { importRequestSchema } from '@myl/shared';
import { importDeck, auditImport } from '@/lib/services/export-import.service';
import { createDeckVersion } from '@/lib/services/decks.service';
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
  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos de importación inválidos', {
      errors: parsed.error.errors,
    });
  }

  const { format, payload } = parsed.data;

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

  // Import the deck
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await importDeck(supabase, payload, format);

  if (result.status === 'AMBIGUOUS') {
    // Return ambiguous result for user resolution
    await auditImport(supabase, user.id, deckId, null, format, 0, requestId);
    return createSuccess(result);
  }

  // RESOLVED - create deck version
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards = result.resolved_cards.map((c: any) => ({
    card_printing_id: c.card_printing_id,
    qty: c.qty,
    is_starting_gold: c.is_starting_gold,
    is_key_card: false,
  }));

  const version = await createDeckVersion(
    supabase,
    deckId,
    cards,
    `Importado desde ${format.toUpperCase()}`,
  );

  await auditImport(supabase, user.id, deckId, version.deck_version_id, format, result.imported_count, requestId);

  return createSuccess({
    status: 'RESOLVED',
    deck_version_id: version.deck_version_id,
    imported_count: result.imported_count,
  });
});
