/**
 * GET /api/v1/community/decks — Galería pública de mazos con filtros.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
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

  // Optional: get viewer id for like status
  const { data: { user } } = await supabase.auth.getUser();

  const result = await getPublicDecks(supabase, filters, user?.id);
  return createSuccess(result);
});
