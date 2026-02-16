import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getEditions } from '@/lib/services/catalog.service';

export const GET = withApiHandler(async (request) => {
  const supabase = await createClient();
  const blockId = request.nextUrl.searchParams.get('block_id') ?? undefined;
  const editions = await getEditions(supabase, blockId);
  return createSuccess(editions);
});
