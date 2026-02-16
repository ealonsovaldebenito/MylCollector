'use client';

import { use } from 'react';
import { useCatalogData } from '@/hooks/use-catalog-data';
import { CardPrintingForm } from '@/components/admin/card-printing-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback';
import { useEffect, useState } from 'react';
import type { CardPrintingWithRelations } from '@myl/shared';

export default function EditPrintingPage({
  params,
}: {
  params: Promise<{ cardId: string; printingId: string }>;
}) {
  const { cardId, printingId } = use(params);
  const { editions, blocks, rarities, isLoading: catalogLoading } = useCatalogData();
  const [printing, setPrinting] = useState<CardPrintingWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrinting() {
      try {
        const res = await fetch(`/api/v1/cards/${cardId}`);
        const json = await res.json();
        if (!json.ok) {
          setError(json.error?.message ?? 'Error al cargar carta');
          return;
        }
        const p = json.data.printings.find(
          (pr: CardPrintingWithRelations) => pr.card_printing_id === printingId,
        );
        if (!p) {
          setError('Printing no encontrado');
          return;
        }
        setPrinting(p);
      } catch {
        setError('Error de conexion');
      } finally {
        setIsLoading(false);
      }
    }
    if (!catalogLoading) {
      loadPrinting();
    }
  }, [cardId, printingId, catalogLoading]);

  if (catalogLoading || isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !printing) {
    return <ErrorState message={error ?? 'Printing no encontrado'} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">
        Editar Printing: {printing.edition.name}
      </h1>
      <CardPrintingForm
        cardId={cardId}
        printingId={printingId}
        editions={editions}
        blocks={blocks}
        rarities={rarities}
        mode="edit"
        initialData={{
          card_printing_id: printing.card_printing_id,
          edition_id: printing.edition_id,
          rarity_tier_id: printing.rarity_tier_id ?? undefined,
          illustrator: printing.illustrator ?? '',
          collector_number: printing.collector_number ?? '',
          legal_status: printing.legal_status,
          printing_variant: printing.printing_variant ?? 'standard',
          image_url: printing.image_url ?? undefined,
        }}
      />
    </div>
  );
}
