/**
 * File: apps/web/src/app/api/v1/cards/[cardId]/deck-stats/route.ts
 * Context: Catalog → detalle de carta (embebido con `?card=`).
 * Description: Stats agregadas de mazos públicos para una carta (deck_count + top_companions).
 * Relations:
 * - DB RPC: `card_deck_stats(target_card_id, top_n)` (migration `20260217000000_card_deck_stats_rpc.sql`)
 * - UI: `apps/web/src/components/catalog/card-detail-stats.tsx`
 * Changelog:
 * - 2026-02-17: Nuevo endpoint para estadisticas de mazos por carta.
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const cardId = params.cardId!;

  const { data, error } = await supabase.rpc('card_deck_stats', {
    target_card_id: cardId,
    top_n: 10,
  });

  if (error) throw error;

  return createSuccess(
    data ?? {
      deck_count: 0,
      top_companions: [],
    },
  );
});

