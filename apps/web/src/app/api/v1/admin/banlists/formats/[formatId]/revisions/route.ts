/**
 * Ban list revisions API — view and create ban list revisions.
 * GET  /api/v1/admin/banlists/formats/:formatId/revisions — revision history
 * POST /api/v1/admin/banlists/formats/:formatId/revisions — create new revision
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { getBanListRevisions, createBanListRevision } from '@/lib/services/banlists.service';
import { createBanListRevisionSchema } from '@myl/shared';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const revisions = await getBanListRevisions(supabase, params.formatId!);
  return createSuccess({ items: revisions });
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const body = await request.json();
  // Merge format_id from URL params
  const parsed = createBanListRevisionSchema.safeParse({
    ...body,
    format_id: params.formatId,
  });
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  const revision = await createBanListRevision(supabase, user.id, parsed.data);
  return createSuccess(revision);
});
