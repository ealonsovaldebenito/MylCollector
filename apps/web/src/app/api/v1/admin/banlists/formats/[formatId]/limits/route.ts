/**
 * Ban list format card limits API — manage card limits per format.
 * GET  /api/v1/admin/banlists/formats/:formatId/limits — current limits
 * POST /api/v1/admin/banlists/formats/:formatId/limits — upsert a limit
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getFormatCardLimits, upsertFormatCardLimit, getBanListSummary } from '@/lib/services/banlists.service';
import { upsertFormatCardLimitSchema } from '@myl/shared';

export const GET = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const url = new URL(request.url);
  const grouped = url.searchParams.get('grouped') === 'true';

  if (grouped) {
    const summary = await getBanListSummary(supabase, params.formatId!);
    return createSuccess(summary);
  }

  const limits = await getFormatCardLimits(supabase, params.formatId!);
  return createSuccess({ items: limits });
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const body = await request.json();
  const parsed = upsertFormatCardLimitSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  const limit = await upsertFormatCardLimit(supabase, params.formatId!, parsed.data);
  return createSuccess(limit);
});
