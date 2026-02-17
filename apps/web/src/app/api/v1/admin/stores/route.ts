/**
 * Admin stores API — list and create stores.
 * GET  /api/v1/admin/stores — List all stores
 * POST /api/v1/admin/stores — Create a new store
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getStores, createStore } from '@/lib/services/stores.service';
import { createStoreSchema } from '@myl/shared';

export const GET = withApiHandler(async (_request, { requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const stores = await getStores(supabase);
  return createSuccess({ items: stores });
});

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const body = await request.json();
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  const store = await createStore(supabase, parsed.data);
  return createSuccess(store);
});
