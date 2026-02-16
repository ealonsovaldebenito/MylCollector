import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getPriceHistory } from '@/lib/services/prices.service';
import { AppError } from '@/lib/api/errors';

/**
 * GET /api/v1/prices/[printingId]/history
 * Get price history for a card printing
 */
export const GET = withApiHandler(async (_request, { params }) => {
  const { printingId } = await params;
  if (!printingId) throw new AppError('VALIDATION_ERROR', 'Printing ID es requerido');

  const supabase = await createClient();
  const history = await getPriceHistory(supabase, printingId);

  return createSuccess({ history });
});
