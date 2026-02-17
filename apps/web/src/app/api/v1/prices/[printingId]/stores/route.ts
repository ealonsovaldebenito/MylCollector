/**
 * Public API — get stores selling a specific printing with prices.
 * GET /api/v1/prices/:printingId/stores
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getStoresForPrinting } from '@/lib/services/stores.service';

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const stores = await getStoresForPrinting(supabase, params.printingId!);
  return createSuccess({ items: stores });
});
