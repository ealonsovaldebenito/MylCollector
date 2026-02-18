/**
 * PUT/DELETE /api/v1/cards/[cardId]/printings/[printingId]
 * Update or delete a card printing (admin only).
 *
 * Changelog:
 *   2026-02-18 - Fix: execute mutations with service-role client and card ownership guard.
 */

import { updateCardPrintingSchema } from '@myl/shared';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createError, createSuccess } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { deleteCardPrinting, updateCardPrinting } from '@/lib/services/cards.service';

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden modificar impresiones', requestId);
  }

  const body = await request.json();
  const parsed = updateCardPrintingSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', {
      issues: parsed.error.issues,
    });
  }

  const cardId = params.cardId!;
  const printingId = params.printingId!;
  const printing = await updateCardPrinting(adminClient, printingId, parsed.data, { cardId });
  return createSuccess(printing);
});

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden modificar impresiones', requestId);
  }

  const cardId = params.cardId!;
  const printingId = params.printingId!;
  await deleteCardPrinting(adminClient, printingId, { cardId });
  return createSuccess({ deleted: true });
});
