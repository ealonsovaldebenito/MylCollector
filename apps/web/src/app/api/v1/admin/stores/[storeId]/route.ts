/**
 * Admin store detail API — get, update, delete a store.
 * GET    /api/v1/admin/stores/:storeId
 * PUT    /api/v1/admin/stores/:storeId
 * DELETE /api/v1/admin/stores/:storeId
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getStore, updateStore, deactivateStore } from '@/lib/services/stores.service';
import { updateStoreSchema } from '@myl/shared';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const store = await getStore(supabase, params.storeId!);
  return createSuccess(store);
});

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const body = await request.json();
  const parsed = updateStoreSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  const store = await updateStore(supabase, params.storeId!, parsed.data);
  return createSuccess(store);
});

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  await deactivateStore(supabase, params.storeId!);
  return createSuccess({ deactivated: true });
});
