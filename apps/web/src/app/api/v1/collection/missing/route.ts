import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getMissingCardsForDeck } from '@/lib/services/collection.service';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para ver cartas faltantes');
  }

  const url = new URL(request.url);
  const deckVersionId = url.searchParams.get('deck_version_id');

  if (!deckVersionId) {
    throw new AppError('VALIDATION_ERROR', 'Se requiere deck_version_id');
  }

  const missing = await getMissingCardsForDeck(supabase, user.id, deckVersionId);

  return createSuccess({ items: missing });
});
