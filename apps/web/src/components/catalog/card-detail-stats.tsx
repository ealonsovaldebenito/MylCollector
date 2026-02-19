'use client';

/**
 * File: apps/web/src/components/catalog/card-detail-stats.tsx
 * Context: Catalog → detalle de carta → tab "Estadísticas".
 * Description: Resumen de propiedades + breakdown de impresiones + estadísticas de uso en mazos públicos (co-ocurrencias).
 * Relations:
 * - API: `GET /api/v1/cards/:cardId/deck-stats`
 * - Hook: `apps/web/src/hooks/use-card-deck-stats.ts`
 * Changelog:
 * - 2026-02-17: Agrega “cantidad de mazos” + Top 10 cartas que más van con ella.
 */

import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { BarChart3, Layers, DollarSign, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { CardImage } from '@/components/catalog/card-image';
import { useCardDeckStats } from '@/hooks/use-card-deck-stats';

interface CardDetailStatsProps {
  card: CardDetail;
}

export function CardDetailStats({ card }: CardDetailStatsProps) {
  const searchParams = useSearchParams();
  const { data: deckStats } = useCardDeckStats(card.card_id);
  const totalPrintings = card.printings.length;
  const editions = [...new Set(card.printings.map((p) => p.edition.name))];
  const rarities = card.printings
    .map((p) => p.rarity_tier?.name)
    .filter((r): r is string => !!r);
  const uniqueRarities = [...new Set(rarities)];
  const hasPrice = card.printings.some((p) => p.price_consensus);
  const deckCount = deckStats?.deck_count ?? 0;

  return (
    <div className="space-y-6">
      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Layers className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{totalPrintings}</p>
          <p className="text-xs text-muted-foreground">
            {totalPrintings === 1 ? 'Impresion' : 'Impresiones'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Calendar className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{editions.length}</p>
          <p className="text-xs text-muted-foreground">
            {editions.length === 1 ? 'Edicion' : 'Ediciones'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <BarChart3 className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{uniqueRarities.length}</p>
          <p className="text-xs text-muted-foreground">
            {uniqueRarities.length === 1 ? 'Rareza' : 'Rarezas'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <DollarSign className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{hasPrice ? 'Si' : 'No'}</p>
          <p className="text-xs text-muted-foreground">Precio disponible</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Users className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{deckCount}</p>
          <p className="text-xs text-muted-foreground">Mazos públicos</p>
        </div>
      </div>

      {/* Deck co-occurrence */}
      {deckStats && deckStats.top_companions.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Top 10 cartas que más van con ella
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {deckStats.top_companions.map((row) => {
              const params = new URLSearchParams(searchParams?.toString() ?? '');
              params.set('card', row.card_id);
              const href = `/catalog?${params.toString()}`;

              return (
                <Link
                  key={row.card_id}
                  href={href}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CardImage
                      src={row.image_url}
                      alt={row.name}
                      className="h-10 w-8 rounded border border-border"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        En {row.decks_with} mazos · {row.total_qty} copias
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{row.decks_with}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

     
          </div>
  );
}
