import { updateCardSchema } from '@myl/shared';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getCardById, updateCard, deleteCard } from '@/lib/services/cards.service';

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const cardId = params.cardId!;
  const card = await getCardById(supabase, cardId);
  return createSuccess(card);
});

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const cardId = params.cardId!;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const body = await request.json();
  const parsed = updateCardSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', {
      issues: parsed.error.issues,
    });
  }

  const card = await updateCard(supabase, cardId, parsed.data);
  return createSuccess(card);
});

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const cardId = params.cardId!;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  await deleteCard(supabase, cardId);
  return createSuccess({ deleted: true });
});
