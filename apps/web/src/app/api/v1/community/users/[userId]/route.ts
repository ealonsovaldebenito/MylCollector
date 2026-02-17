/**
 * GET /api/v1/community/users/:userId — Perfil público de usuario.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getUserPublicProfile } from '@/lib/services/community.service';

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const { userId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getUserPublicProfile(supabase, userId!, user?.id);

  return createSuccess(profile);
});
