'use client';

import { use } from 'react';
import { useCatalogData } from '@/hooks/use-catalog-data';
import { CardPrintingForm } from '@/components/admin/card-printing-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewPrintingPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const { editions, blocks, rarities, isLoading } = useCatalogData();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Nuevo Printing</h1>
      <CardPrintingForm
        cardId={cardId}
        editions={editions}
        blocks={blocks}
        rarities={rarities}
        mode="create"
      />
    </div>
  );
}
