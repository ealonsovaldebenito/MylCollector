/**
 * /admin/cards/:cardId/edit — Página de edición de carta.
 * Carga datos del catálogo y detalle de carta, luego renderiza CardForm en modo edit.
 *
 * Changelog:
 *   2026-02-16 — Creación inicial
 *   2026-02-17 — Mejorar skeleton de carga con layout realista
 */

'use client';

import { use } from 'react';
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
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-9">
            <Skeleton className="h-10 w-72" />
            <div className="rounded-lg border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-11 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
            <div className="rounded-lg border border-border p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-lg border border-border p-4 space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-[140px] w-full rounded-md" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
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
        printings={card.printings}
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
          // Note: these fields are returned by backend even if not in shared CardDetail schema.
          created_at: (card as unknown as { created_at?: string }).created_at,
          updated_at: (card as unknown as { updated_at?: string }).updated_at,
        }}
      />
    </div>
  );
}
