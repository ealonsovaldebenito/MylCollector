/**
 * POST /api/v1/prices/consensus
 * Bulk latest consensus prices for many card_printing_id.
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getConsensusPricesForPrintings } from '@/lib/services/prices.service';

export const POST = withApiHandler(async (request) => {
  const body = (await request.json()) as { printing_ids?: unknown };
  if (!Array.isArray(body.printing_ids)) {
    throw new AppError('VALIDATION_ERROR', 'printing_ids es requerido');
  }

  const printingIds = Array.from(
    new Set(body.printing_ids.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)),
  ).slice(0, 250);

  const supabase = await createClient();
  const items = await getConsensusPricesForPrintings(supabase, printingIds);

  return createSuccess({ items });
});

