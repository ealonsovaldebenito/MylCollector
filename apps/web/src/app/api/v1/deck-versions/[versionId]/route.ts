import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getDeckVersion } from '@/lib/services/decks.service';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);

  const version = await getDeckVersion(supabase, params.versionId!);
  return createSuccess(version);
});
