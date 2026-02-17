'use client';

import { CardImage } from './card-image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/**
 * File: apps/web/src/components/catalog/card-detail-similar.tsx
 * Context: Catalog → detalle de carta (embebido o página) → sección “Cartas similares”.
 * Description: Carrusel horizontal de cartas recomendadas (summary liviano + deep-link al Catalog con `?card=`).
 * Relations:
 * - API/Hook: `apps/web/src/hooks/use-card-similar.ts` → `GET /api/v1/cards/:cardId/similar`
 * - Used by: `apps/web/src/components/catalog/catalog-card-detail.tsx`, `apps/web/src/components/catalog/card-detail-page.tsx`
 * Changelog:
 * - 2026-02-17: Cambia link a `/catalog?card=` y soporta items livianos (card_id/name/image_url).
 * Bugfixes:
 * - Evita links a ruta legacy `/catalog/[id]` que no mantiene filtros del catálogo.
 */

interface CardDetailSimilarProps {
  cards: Array<{ card_id: string; name: string; image_url: string | null }>;
  currentCardType: string;
}

export function CardDetailSimilar({ cards, currentCardType }: CardDetailSimilarProps) {
  const searchParams = useSearchParams();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Cartas similares &middot; {currentCardType}
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {cards.map((card) => {
          const params = new URLSearchParams(searchParams?.toString() ?? '');
          params.set('card', card.card_id);
          const href = `/catalog?${params.toString()}`;

          return (
            <Link
              key={card.card_id}
              href={href}
              className="group flex-shrink-0 w-32 space-y-2"
            >
              <CardImage
                src={card.image_url ?? null}
                alt={card.name}
                className="aspect-[5/7] w-full rounded-lg border border-border transition-all group-hover:border-accent/50 group-hover:shadow-lg group-hover:scale-105"
              />
              <p className="text-xs font-medium text-center truncate group-hover:text-accent transition-colors">
                {card.name}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
