import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return createSuccess({ user });
});
