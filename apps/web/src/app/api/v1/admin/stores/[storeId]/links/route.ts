/**
 * Store printing links API — manage which printings are linked to a store.
 * GET  /api/v1/admin/stores/:storeId/links
 * POST /api/v1/admin/stores/:storeId/links
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getStorePrintingLinks, createStorePrintingLink } from '@/lib/services/stores.service';
import { createStorePrintingLinkSchema } from '@myl/shared';

export const GET = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const result = await getStorePrintingLinks(supabase, params.storeId!, { limit, offset });
  return createSuccess(result);
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const body = await request.json();
  const parsed = createStorePrintingLinkSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  const link = await createStorePrintingLink(supabase, params.storeId!, parsed.data);
  return createSuccess(link);
});
