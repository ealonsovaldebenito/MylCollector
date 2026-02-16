import { z } from 'zod';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { setReferencePrice } from '@/lib/services/cards.service';

const setReferencePriceSchema = z.object({
  price: z.number().min(0),
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const printingId = params.printingId!;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const body = await request.json();
  const parsed = setReferencePriceSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Precio invalido', {
      issues: parsed.error.issues,
    });
  }

  await setReferencePrice(supabase, printingId, parsed.data.price);

  return createSuccess({ price: parsed.data.price });
});
