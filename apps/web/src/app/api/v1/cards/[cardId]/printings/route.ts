import { createCardPrintingSchema } from '@myl/shared';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getCardPrintings, createCardPrinting } from '@/lib/services/cards.service';

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const cardId = params.cardId!;
  const printings = await getCardPrintings(supabase, cardId);
  return createSuccess(printings);
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const cardId = params.cardId!;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const body = await request.json();
  const parsed = createCardPrintingSchema.safeParse({ ...body, card_id: cardId });
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', {
      issues: parsed.error.issues,
    });
  }

  const printing = await createCardPrinting(supabase, parsed.data);
  return createSuccess(printing, 201);
});
