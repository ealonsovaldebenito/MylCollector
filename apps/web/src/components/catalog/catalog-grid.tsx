'use client';

import { CardTile } from './card-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CardItem {
  card_printing_id: string;
  image_url: string | null;
  legal_status: string;
  edition: { name: string };
  rarity_tier: { name: string; code: string } | null;
  card: {
    card_id: string;
    name: string;
    cost: number | null;
    ally_strength: number | null;
    card_type: { name: string; code: string };
    tags?: { tag_id: string; name: string; slug: string }[];
  };
  store_min_price?: number | null;
}

interface CatalogGridProps {
  cards: CardItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onCardClick: (cardId: string) => void;
  gridSize?: 'normal' | 'large';
  className?: string;
}

export function CatalogGrid({
  cards,
  isLoading,
  hasMore,
  onLoadMore,
  onCardClick,
  gridSize = 'large',
  className,
}: CatalogGridProps) {
  // Configuración de grid según tamaño
  const gridClasses = gridSize === 'large'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
    : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';

  // Loading
  if (isLoading && cards.length === 0) {
    return (
      <div className={cn('grid gap-4', gridClasses)}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[5/7] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && cards.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Sin resultados"
        description="No se encontraron cartas con los filtros actuales. Intenta cambiar o limpiar los filtros."
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Grid */}
      <div className={cn('grid gap-4', gridClasses)}>
        {cards.map((item, index) => (
          <CardTile
            key={item.card_printing_id}
            name={item.card.name}
            imageUrl={item.image_url}
            typeName={item.card.card_type.name}
            typeCode={item.card.card_type.code}
            editionName={item.edition.name}
            rarityName={item.rarity_tier?.name ?? null}
            rarityCode={item.rarity_tier?.code ?? null}
            legalStatus={item.legal_status}
            cost={item.card.cost}
            allyStrength={item.card.ally_strength}
            storeMinPrice={item.store_min_price ?? null}
            tags={item.card.tags}
            onClick={() => onCardClick(item.card.card_id)}
            size={gridSize}
            style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" size="lg" onClick={onLoadMore} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cargar más cartas
          </Button>
        </div>
      )}
    </div>
  );
}
