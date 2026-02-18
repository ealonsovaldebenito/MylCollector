/**
 * File: apps/web/src/components/community/deck-public-cardsd.tsx
 *
 * DeckPublicCardsD - Panel modular de datos enriquecidos para cards de mazo en comunidad.
 *
 * Contexto:
 * - Se usa en la galería pública para mostrar un resumen más identificativo:
 *   cartas clave, coste promedio, raza, edición y métricas del mazo.
 *
 * Changelog:
 * - 2026-02-18 - Creación inicial del módulo CARDSD.
 *
 * Bugfix notes:
 * - Oculta datos faltantes para evitar ruido visual.
 */
'use client';

import { Coins, KeyRound } from 'lucide-react';
import type { PublicDeckListItem } from '@myl/shared';

import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';

interface DeckPublicCardsDProps {
  deck: PublicDeckListItem;
}

export function DeckPublicCardsD({ deck }: DeckPublicCardsDProps) {
  const summary = deck.cardsd ?? null;
  const keyCards = summary?.key_cards ?? [];
  const totalCopies = summary?.total_copies ?? 0;
  const uniqueCards = summary?.unique_cards ?? 0;
  const keyCount = summary?.key_cards_count ?? 0;
  const hasAnyMeta = true;

  const raceLabel = summary?.race_name ? `Raza: ${summary.race_name}` : 'Raza: -';
  const editionLabel = summary?.edition_name ? `Edicion: ${summary.edition_name}` : 'Edicion: -';
  const avgCostLabel = summary?.avg_cost !== null && summary?.avg_cost !== undefined
    ? `Coste prom: ${summary.avg_cost}`
    : 'Coste prom: -';
  const countsLabel = totalCopies > 0
    ? `C:${totalCopies} U:${uniqueCards || 0} K:${keyCount || 0}`
    : 'C:- U:- K:-';

  return (
    <div className="h-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">CARDSD</p>
        {deck.format_name ? (
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {deck.format_name}
          </Badge>
        ) : null}
      </div>

      {hasAnyMeta ? (
        <div className="grid h-[44px] grid-cols-2 gap-2">
          <Badge variant="secondary" className="h-[20px] truncate text-[10px]">{raceLabel}</Badge>
          <Badge variant="secondary" className="h-[20px] truncate text-[10px]">{editionLabel}</Badge>
          <Badge variant="secondary" className="h-[20px] truncate text-[10px] gap-1">
            <Coins className="h-3 w-3" />
            {avgCostLabel}
          </Badge>
          <Badge variant="secondary" className="h-[20px] truncate text-[10px] gap-1">
            <KeyRound className="h-3 w-3" />
            {countsLabel}
          </Badge>
        </div>
      ) : null}

      <div className="h-[112px] space-y-2">
        <p className="h-[16px] text-[11px] font-medium text-muted-foreground">Cartas clave</p>
        <div className="grid h-[65px] grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => {
            const card = keyCards[index];
            return (
              <div
                key={card?.card_printing_id ?? `placeholder-${index}`}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-2 py-1"
              >
                <div className="h-8 w-6 flex-shrink-0 overflow-hidden rounded border border-border/50 bg-muted/20">
                  {card ? (
                    <CardImage
                      src={card.image_url ?? null}
                      alt={card.name}
                      className="h-full w-full object-cover"
                      fit="cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/30" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium">{card?.name ?? 'Sin carta'}</p>
                  <p className="text-[9px] text-muted-foreground">x{card?.qty ?? 0}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
