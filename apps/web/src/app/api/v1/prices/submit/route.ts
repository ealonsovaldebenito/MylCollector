import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { submitPriceSchema } from '@myl/shared';
import { submitCommunityPrice } from '@/lib/services/prices.service';
import { AppError } from '@/lib/api/errors';

/**
 * POST /api/v1/prices/submit
 * Submit a new community price for a card printing
 */
export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para enviar precios');
  }

  const body = await request.json();

  // Validate input
  const parsed = submitPriceSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos de precio inválidos', {
      errors: parsed.error.errors,
    });
  }

  const submission = await submitCommunityPrice(supabase, user.id, parsed.data);

  return createSuccess({ submission });
});
