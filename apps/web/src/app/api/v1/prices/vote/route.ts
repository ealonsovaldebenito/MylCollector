import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { votePriceSchema } from '@myl/shared';
import { voteOnSubmission } from '@/lib/services/prices.service';
import { AppError } from '@/lib/api/errors';

/**
 * POST /api/v1/prices/vote
 * Vote on a community price submission
 */
export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión para votar');
  }

  const body = await request.json();

  // Validate input
  const parsed = votePriceSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos de voto inválidos', {
      errors: parsed.error.errors,
    });
  }

  const result = await voteOnSubmission(supabase, user.id, parsed.data);

  return createSuccess({ result });
});
