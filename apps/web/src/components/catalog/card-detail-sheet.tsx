'use client';

import type { CardDetail } from '@myl/shared';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { CardImage } from './card-image';
import { CardDetailSummary } from './card-detail-summary';
import { CardDetailPrintings } from './card-detail-printings';
import { CardDetailPrices } from './card-detail-prices';
import { CardDetailLegality } from './card-detail-legality';

interface CardDetailSheetProps {
  card: CardDetail | null;
  isLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="mx-auto aspect-[5/7] w-40 rounded-lg" />
      <Skeleton className="mx-auto h-6 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function CardDetailSheet({ card, isLoading, open, onOpenChange }: CardDetailSheetProps) {
  // Pick first printing image as hero
  const heroImage = card?.printings[0]?.image_url ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <ScrollArea className="h-full pr-4">
          {isLoading ? (
            <DetailSkeleton />
          ) : card ? (
            <div className="space-y-4 pb-8">
              <SheetHeader className="sr-only">
                <SheetTitle>{card.name}</SheetTitle>
              </SheetHeader>

              {/* Hero image */}
              <CardImage
                src={heroImage}
                alt={card.name}
                className="mx-auto aspect-[5/7] w-48 rounded-lg shadow-lg"
                priority
              />

              {/* Name */}
              <h2 className="text-center font-display text-2xl font-bold">{card.name}</h2>

              {/* Tabs */}
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger value="printings">
                    Versiones
                  </TabsTrigger>
                  <TabsTrigger value="legality">
                    Legalidad
                  </TabsTrigger>
                  <TabsTrigger value="prices">
                    Precios
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4">
                  <CardDetailSummary card={card} />
                </TabsContent>

                <TabsContent value="printings" className="mt-4">
                  <CardDetailPrintings printings={card.printings} />
                </TabsContent>

                <TabsContent value="legality" className="mt-4">
                  <CardDetailLegality card={card} />
                </TabsContent>

                <TabsContent value="prices" className="mt-4">
                  <CardDetailPrices printings={card.printings} />
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
