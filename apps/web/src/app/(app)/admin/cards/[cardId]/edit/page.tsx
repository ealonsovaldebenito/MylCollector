'use client';

import { use } from 'react';
import type { CardPrintingWithRelations } from '@myl/shared';
import { useCatalogData } from '@/hooks/use-catalog-data';
import { useCardDetail } from '@/hooks/use-card-detail';
import { CardForm } from '@/components/admin/card-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback';

export default function EditCardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const { cardTypes, races, tags, blocks, editions, rarities, isLoading: catalogLoading } = useCatalogData();
  const { card, isLoading: cardLoading, error } = useCardDetail(cardId);

  if (catalogLoading || cardLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !card) {
    return <ErrorState message={error ?? 'Carta no encontrada'} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Editar: {card.name}</h1>
      </div>
      <CardForm
        cardTypes={cardTypes}
        races={races}
        tags={tags}
        blocks={blocks}
        editions={editions}
        rarities={rarities}
        mode="edit"
        printings={card.printings as unknown as CardPrintingWithRelations[]}
        initialData={{
          card_id: card.card_id,
          name: card.name,
          name_normalized: card.name_normalized,
          card_type_id: card.card_type_id,
          race_id: card.race_id ?? undefined,
          ally_strength: card.ally_strength ?? undefined,
          cost: card.cost ?? undefined,
          is_unique: card.is_unique,
          has_ability: card.has_ability,
          can_be_starting_gold: card.can_be_starting_gold,
          text: card.text ?? undefined,
          flavor_text: card.flavor_text ?? undefined,
          tag_ids: card.tags.map((t) => t.tag_id),
        }}
      />
    </div>
  );
}
