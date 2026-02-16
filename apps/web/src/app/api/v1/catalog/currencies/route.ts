import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/api/errors';

/**
 * GET /api/v1/catalog/currencies
 * Get all available currencies
 */
export const GET = withApiHandler(async () => {
  const supabase = await createClient();

  const { data: currencies, error } = await supabase
    .from('currencies')
    .select('currency_id, code, name, symbol')
    .eq('is_active', true)
    .order('code');

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar monedas');

  return createSuccess({ currencies: currencies ?? [] });
});
