import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getTags } from '@/lib/services/catalog.service';

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const tags = await getTags(supabase);
  return createSuccess(tags);
});
