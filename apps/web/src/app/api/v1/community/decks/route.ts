/**
 * GET /api/v1/community/decks — Galería de mazos (públicos para users, todos para admin).
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 *   2026-02-18 — Admin ve todos los mazos (públicos y privados)
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { publicDeckFiltersSchema } from '@myl/shared';
import { getPublicDecks } from '@/lib/services/community.service';

export const GET = withApiHandler(async (request) => {
  const supabase = await createClient();
  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);

  const filters = publicDeckFiltersSchema.parse(raw);

  // Get viewer id + check if admin
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  const result = await getPublicDecks(supabase, filters, user?.id, isAdmin);
  return createSuccess(result);
});
