'use client';

import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CardDetailHero } from './card-detail-hero';
import { CardDetailPrintings } from './card-detail-printings';
import { CardDetailLegality } from './card-detail-legality';
import { CardDetailOracles } from './card-detail-oracles';
import { CardDetailPrices } from './card-detail-prices';
import { CardDetailStats } from './card-detail-stats';
import { CardDetailSimilar } from './card-detail-similar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Layers, Shield, BookOpenCheck, DollarSign, BarChart3, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CardDetailPageProps {
  card: CardDetail;
  similarCards: CardDetail[];
}

export function CardDetailPage({ card, similarCards }: CardDetailPageProps) {
  const firstPrinting = card.printings[0];

  const breadcrumbItems = [
    { label: 'Catalogo', href: '/catalog' },
    ...(firstPrinting
      ? [{ label: editionDisplayName(firstPrinting.edition.name), href: `/catalog?edition_id=${firstPrinting.edition.edition_id}` }]
      : []),
    { label: card.card_type.name, href: `/catalog?card_type_id=${card.card_type.card_type_id}` },
    { label: card.name },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb items={breadcrumbItems} />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/catalog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al catalogo
          </Link>
        </Button>
      </div>

      {/* Hero section */}
      <CardDetailHero card={card} />

      {/* Tabs */}
      <Tabs defaultValue="printings" className="w-full">
        <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent border-b border-border rounded-none p-0 pb-px">
          <TabsTrigger
            value="printings"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
          >
            <Layers className="h-4 w-4" />
            Reimpresiones
          </TabsTrigger>
          <TabsTrigger
            value="legality"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
          >
            <Shield className="h-4 w-4" />
            Legalidad
          </TabsTrigger>
          <TabsTrigger
            value="oracles"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
          >
            <BookOpenCheck className="h-4 w-4" />
            Oráculos
          </TabsTrigger>
          <TabsTrigger
            value="prices"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Precios
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Estadisticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="printings" className="mt-6">
          <CardDetailPrintings printings={card.printings} />
        </TabsContent>

        <TabsContent value="legality" className="mt-6">
          <CardDetailLegality card={card} />
        </TabsContent>

        <TabsContent value="oracles" className="mt-6">
          <CardDetailOracles cardId={card.card_id} />
        </TabsContent>

        <TabsContent value="prices" className="mt-6">
          <CardDetailPrices printings={card.printings} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <CardDetailStats card={card} />
        </TabsContent>
      </Tabs>

      {/* Similar cards */}
      {similarCards.length > 0 && (
        <CardDetailSimilar cards={similarCards} currentCardType={card.card_type.name} />
      )}
    </div>
  );
}
