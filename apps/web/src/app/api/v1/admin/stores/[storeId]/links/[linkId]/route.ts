/**
 * Store printing link detail API — delete a link.
 * DELETE /api/v1/admin/stores/:storeId/links/:linkId
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 *   2026-02-18 — Fix: use admin client + role guard for reliable deletions.
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteStorePrintingLink } from '@/lib/services/stores.service';

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden gestionar tiendas', requestId);
  }

  await deleteStorePrintingLink(adminClient, params.linkId!, { storeId: params.storeId! });
  return createSuccess({ deleted: true });
});
