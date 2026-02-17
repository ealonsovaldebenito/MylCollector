/**
 * Store printing link detail API — delete a link.
 * DELETE /api/v1/admin/stores/:storeId/links/:linkId
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { deleteStorePrintingLink } from '@/lib/services/stores.service';

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  await deleteStorePrintingLink(supabase, params.linkId!);
  return createSuccess({ deleted: true });
});
