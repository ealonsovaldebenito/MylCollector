'use client';

import { CollectionCardTile } from './collection-card-tile';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionEmptyState } from './collection-empty-state';
import { cn } from '@/lib/utils';
import type { UserCardWithRelations } from '@myl/shared';

interface CollectionGridProps {
  items: UserCardWithRelations[];
  isLoading: boolean;
  onEdit?: (item: UserCardWithRelations) => void;
  onIncrement?: (item: UserCardWithRelations) => void;
  onDecrement?: (item: UserCardWithRelations) => void;
  onMove?: (item: UserCardWithRelations) => void;
  gridSize?: 'normal' | 'large';
  className?: string;
}

export function CollectionGrid({
  items,
  isLoading,
  onEdit,
  onIncrement,
  onDecrement,
  onMove,
  gridSize = 'large',
  className,
}: CollectionGridProps) {
  const gridClasses = gridSize === 'large'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
    : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';

  if (isLoading && items.length === 0) {
    return (
      <div className={cn('grid gap-4', gridClasses)}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[5/7] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return <CollectionEmptyState />;
  }

  return (
    <div className={cn('grid gap-4', gridClasses, className)}>
      {items.map((item, index) => (
        <CollectionCardTile
          key={item.user_card_id}
          item={item}
          onEdit={onEdit ? () => onEdit(item) : undefined}
          onIncrement={onIncrement ? () => onIncrement(item) : undefined}
          onDecrement={onDecrement ? () => onDecrement(item) : undefined}
          onMove={onMove ? () => onMove(item) : undefined}
          size={gridSize}
          style={{ animationDelay: `${Math.min(index * 0.02, 0.3)}s` }}
        />
      ))}
    </div>
  );
}
