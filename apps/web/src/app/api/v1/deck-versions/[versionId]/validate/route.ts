import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getDeck } from '@/lib/services/decks.service';
import { getDeckVersion } from '@/lib/services/decks.service';
import { validateDeckVersion } from '@/lib/services/validation.service';

export const POST = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const version = await getDeckVersion(supabase, params.versionId!);
  const deck = await getDeck(supabase, version.deck_id);

  const result = await validateDeckVersion(supabase, params.versionId!, deck.format_id, requestId);
  return createSuccess(result);
});
