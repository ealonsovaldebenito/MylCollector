'use client';

import type { CardDetail } from '@myl/shared';
import { CardImage } from './card-image';
import Link from 'next/link';

interface CardDetailSimilarProps {
  cards: CardDetail[];
  currentCardType: string;
}

export function CardDetailSimilar({ cards, currentCardType }: CardDetailSimilarProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Cartas similares &middot; {currentCardType}
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {cards.map((card) => {
          const image = card.printings[0]?.image_url ?? null;
          return (
            <Link
              key={card.card_id}
              href={`/catalog/${card.card_id}`}
              className="group flex-shrink-0 w-32 space-y-2"
            >
              <CardImage
                src={image}
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
