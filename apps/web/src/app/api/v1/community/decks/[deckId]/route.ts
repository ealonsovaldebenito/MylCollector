/**
 * GET /api/v1/community/decks/:deckId — Detalle de mazo público.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getPublicDeckDetail, incrementDeckViewCount } from '@/lib/services/community.service';

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const { deckId } = params;

  const { data: { user } } = await supabase.auth.getUser();
  const deck = await getPublicDeckDetail(supabase, deckId!, user?.id);

  // Fire-and-forget view count increment
  void incrementDeckViewCount(supabase, deckId!);

  return createSuccess(deck);
});
