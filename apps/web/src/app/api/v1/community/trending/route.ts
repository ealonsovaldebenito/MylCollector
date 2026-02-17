/**
 * GET /api/v1/community/trending — Mazos trending + top builders.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getTrendingDecks, getTopBuilders } from '@/lib/services/community.service';

export const GET = withApiHandler(async () => {
  const supabase = await createClient();

  const [trending, topBuilders] = await Promise.all([
    getTrendingDecks(supabase),
    getTopBuilders(supabase),
  ]);

  return createSuccess({ trending, top_builders: topBuilders });
});
