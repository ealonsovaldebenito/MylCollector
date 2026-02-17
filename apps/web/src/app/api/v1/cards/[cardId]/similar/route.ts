/**
 * File: apps/web/src/app/api/v1/cards/[cardId]/similar/route.ts
 * Context: Catalog → detalle de carta (embebido con `?card=`).
 * Description: Lista liviana de “cartas similares” (mismo tipo + coste cercano + opcional raza).
 * Relations:
 * - Service: `searchCards` (`apps/web/src/lib/services/cards.service.ts`)
 * - UI: `apps/web/src/components/catalog/card-detail-similar.tsx`
 * Changelog:
 * - 2026-02-17: Nuevo endpoint para similares.
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { searchCards } from '@/lib/services/cards.service';

type SimilarCard = {
  card_id: string;
  name: string;
  image_url: string | null;
};

export const GET = withApiHandler(async (_request, { params }) => {
  const supabase = await createClient();
  const cardId = params.cardId!;

  const { data: current, error: currentError } = await supabase
    .from('cards')
    .select('card_id, card_type_id, race_id, cost')
    .eq('card_id', cardId)
    .single();

  if (currentError) throw currentError;

  const costMin =
    current.cost !== null ? Math.max(0, (current.cost as number) - 1) : undefined;
  const costMax = current.cost !== null ? (current.cost as number) + 1 : undefined;

  const result = await searchCards(supabase, {
    limit: 80,
    cursor: undefined,
    q: undefined,
    block_id: undefined,
    edition_id: undefined,
    race_id: (current.race_id as string | null) ?? undefined,
    card_type_id: current.card_type_id as string,
    rarity_tier_id: undefined,
    legal_status: undefined,
    cost_min: costMin,
    cost_max: costMax,
    tag_slug: undefined,
    price_min: undefined,
    price_max: undefined,
    has_price: undefined,
  });

  const unique = new Map<string, SimilarCard>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of result.items as any[]) {
    const candidateCardId = item.card?.card_id as string | undefined;
    if (!candidateCardId) continue;
    if (candidateCardId === cardId) continue;
    if (unique.has(candidateCardId)) continue;

    unique.set(candidateCardId, {
      card_id: candidateCardId,
      name: item.card.name as string,
      image_url: (item.image_url as string | null) ?? null,
    });

    if (unique.size >= 12) break;
  }

  return createSuccess({ items: [...unique.values()] });
});

