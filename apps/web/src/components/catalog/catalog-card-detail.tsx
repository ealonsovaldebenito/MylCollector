'use client';

/**
 * File: apps/web/src/components/catalog/catalog-card-detail.tsx
 * Context: Catalog → panel central (grid) cuando existe query `?card=`.
 * Description: Detalle de carta embebido dentro del catálogo (mantiene search/filtros), con sidebar derecho para reimpresiones.
 * Relations:
 * - Similar: `apps/web/src/hooks/use-card-similar.ts` → `GET /api/v1/cards/:cardId/similar`
 * - Printings: `apps/web/src/components/catalog/card-detail-printings.tsx`
 * Changelog:
 * - 2026-02-17: Mueve "Reimpresiones" a sidebar derecho y reintroduce "Cartas similares".
 */

import { useEffect, useMemo, useState } from 'react';
import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CardDetailHero } from '@/components/catalog/card-detail-hero';
import { CardDetailPrintings } from '@/components/catalog/card-detail-printings';
import { CardDetailLegality } from '@/components/catalog/card-detail-legality';
import { CardDetailOracles } from '@/components/catalog/card-detail-oracles';
import { CardDetailPrices } from '@/components/catalog/card-detail-prices';
import { CardDetailStats } from '@/components/catalog/card-detail-stats';
import { CardDetailSimilar } from '@/components/catalog/card-detail-similar';
import { useUser } from '@/contexts/user-context';
import { useCardSimilar } from '@/hooks/use-card-similar';

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-[520px] w-full rounded-xl" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function CatalogCardDetail({
  card,
  isLoading,
  onBack,
}: {
  card: CardDetail | null;
  isLoading: boolean;
  onBack: () => void;
}) {
  const { isAdmin } = useUser();
  const [selectedPrintingId, setSelectedPrintingId] = useState<string | null>(null);
  const { items: similarCards } = useCardSimilar(card?.card_id ?? null);

  useEffect(() => {
    if (!card || card.printings.length === 0) {
      setSelectedPrintingId(null);
      return;
    }
    setSelectedPrintingId((prev) => prev ?? card.printings[0]!.card_printing_id);
  }, [card]);

  const selectedPrinting = useMemo(
    () =>
      card && selectedPrintingId
        ? card.printings.find((p) => p.card_printing_id === selectedPrintingId) ?? null
        : null,
    [card, selectedPrintingId],
  );

  if (isLoading) return <DetailSkeleton />;
  if (!card) return null;

  return (
    <div className="w-full space-y-6 animate-scale-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>

        <div className="flex items-center gap-2">
          {selectedPrinting ? (
            <Badge variant="outline" className="text-xs">
              {editionDisplayName(selectedPrinting.edition.name)}
            </Badge>
          ) : null}
          {isAdmin ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              asChild
              title="Editar en Admin"
            >
              <Link href={`/admin/cards/${card.card_id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <CardDetailHero card={card} printing={selectedPrinting} />

          <Tabs defaultValue="prices" className="w-full">
            <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent border-b border-border rounded-none p-0 pb-px">
              <TabsTrigger
                value="legality"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Legalidad
              </TabsTrigger>
              <TabsTrigger
                value="oracles"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Oráculos
              </TabsTrigger>
              <TabsTrigger
                value="prices"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Precios
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Estadísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="legality" className="mt-6">
              <CardDetailLegality card={card} />
            </TabsContent>

            <TabsContent value="oracles" className="mt-6">
              <CardDetailOracles cardId={card.card_id} />
            </TabsContent>

            <TabsContent value="prices" className="mt-6">
              <CardDetailPrices
                printings={card.printings}
                selectedPrintingId={selectedPrintingId}
                onSelectPrinting={setSelectedPrintingId}
              />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <CardDetailStats card={card} />
            </TabsContent>
          </Tabs>

          {similarCards.length > 0 ? (
            <CardDetailSimilar cards={similarCards} currentCardType={card.card_type.name} />
          ) : null}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 self-start">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Reimpresiones
            </h3>
            <Badge variant="secondary" className="text-xs">
              {card.printings.length}
            </Badge>
          </div>

          <CardDetailPrintings
            printings={card.printings}
            selectedPrintingId={selectedPrintingId}
            onSelectPrinting={setSelectedPrintingId}
            variant="sidebar"
          />
        </aside>
      </div>
    </div>
  );
}
