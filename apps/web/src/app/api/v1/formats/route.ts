import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getActiveFormats } from '@/lib/services/formats.service';

export const GET = withApiHandler(async (_request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const formats = await getActiveFormats(supabase);
  return createSuccess({ items: formats });
});
