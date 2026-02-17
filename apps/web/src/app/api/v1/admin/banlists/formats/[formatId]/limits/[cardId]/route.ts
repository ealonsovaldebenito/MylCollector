/**
 * Ban list card limit detail API — delete a specific card limit.
 * DELETE /api/v1/admin/banlists/formats/:formatId/limits/:cardId
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { deleteFormatCardLimit } from '@/lib/services/banlists.service';

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  await deleteFormatCardLimit(supabase, params.formatId!, params.cardId!);
  return createSuccess({ deleted: true });
});
