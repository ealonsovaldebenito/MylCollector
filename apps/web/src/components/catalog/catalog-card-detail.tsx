'use client';

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
import { useUser } from '@/contexts/user-context';

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

  useEffect(() => {
    if (!card || card.printings.length === 0) {
      setSelectedPrintingId(null);
      return;
    }
    setSelectedPrintingId((prev) => prev ?? card.printings[0]!.card_printing_id);
  }, [card]);

  const selectedPrinting = useMemo(
    () => (card && selectedPrintingId ? card.printings.find((p) => p.card_printing_id === selectedPrintingId) : null),
    [card, selectedPrintingId],
  );

  if (isLoading) return <DetailSkeleton />;
  if (!card) return null;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header row */}
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
          {isAdmin && (
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
          )}
        </div>
      </div>

      <CardDetailHero card={card} />

      <Tabs defaultValue="printings" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent border-b border-border rounded-none p-0 pb-px">
          <TabsTrigger
            value="printings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Reimpresiones
          </TabsTrigger>
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

        <TabsContent value="printings" className="mt-6">
          <CardDetailPrintings
            printings={card.printings}
            selectedPrintingId={selectedPrintingId}
            onSelectPrinting={setSelectedPrintingId}
          />
        </TabsContent>

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
    </div>
  );
}
