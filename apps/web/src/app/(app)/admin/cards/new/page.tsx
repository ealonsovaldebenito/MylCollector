'use client';

import { useCatalogData } from '@/hooks/use-catalog-data';
import { CardForm } from '@/components/admin/card-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewCardPage() {
  const { cardTypes, races, tags, blocks, editions, rarities, isLoading } = useCatalogData();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Crear Nueva Carta</h1>
      </div>
      <CardForm
        cardTypes={cardTypes}
        races={races}
        tags={tags}
        blocks={blocks}
        editions={editions}
        rarities={rarities}
        mode="create"
      />
    </div>
  );
}
