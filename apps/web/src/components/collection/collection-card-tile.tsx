'use client';

import { cn } from '@/lib/utils';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Edit2 } from 'lucide-react';
import type { UserCardWithRelations } from '@myl/shared';

interface CollectionCardTileProps {
  item: UserCardWithRelations;
  onEdit?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  size?: 'normal' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

const CONDITION_COLORS: Record<string, string> = {
  MINT: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  NEAR_MINT: 'bg-green-500/20 text-green-700 dark:text-green-300',
  EXCELLENT: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  GOOD: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  LIGHT_PLAYED: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  PLAYED: 'bg-red-500/20 text-red-700 dark:text-red-300',
  POOR: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
};

const CONDITION_LABELS: Record<string, string> = {
  MINT: 'Mint',
  NEAR_MINT: 'NM',
  EXCELLENT: 'EX',
  GOOD: 'GD',
  LIGHT_PLAYED: 'LP',
  PLAYED: 'PL',
  POOR: 'PR',
};

const RARITY_COLORS: Record<string, string> = {
  COMUN: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
  POCO_COMUN: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  RARA: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  ULTRA_RARA: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  SECRETA: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-700 dark:text-amber-300',
};

export function CollectionCardTile({
  item,
  onEdit,
  onIncrement,
  onDecrement,
  size = 'large',
  className,
  style,
}: CollectionCardTileProps) {
  const isLarge = size === 'large';
  const conditionColor = CONDITION_COLORS[item.condition] ?? CONDITION_COLORS.NEAR_MINT;
  const conditionLabel = CONDITION_LABELS[item.condition] ?? item.condition;
  const rarityColor = RARITY_COLORS[item.card_printing.rarity_tier?.code ?? ''] ?? RARITY_COLORS.COMUN;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-border',
        'bg-card transition-all duration-200',
        'hover:scale-[1.02] hover:border-accent/30 hover:shadow-xl',
        'animate-fade-in',
        className,
      )}
      style={style}
    >
      {/* Edit button — visible on hover */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity',
          'bg-black/50 backdrop-blur border border-white/20',
          'hover:bg-accent/20 hover:border-accent/40',
          isLarge ? 'left-2 top-2 h-8 w-8' : 'left-1.5 top-1.5 h-6 w-6',
        )}
        onClick={onEdit}
        title="Editar item"
      >
        <Edit2 className={cn('text-white', isLarge ? 'h-4 w-4' : 'h-3 w-3')} />
      </Button>

      {/* Card image */}
      <CardImage
        src={item.card_printing.image_url}
        alt={item.card_printing.card.name}
        className="aspect-[5/7] w-full"
      />

      {/* Overlay gradient */}
      <div className={cn(
        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent',
        isLarge ? 'p-4 pt-12' : 'p-2 pt-8'
      )}>
        {/* Quantity badge (always visible) */}
        <div className={cn('absolute', isLarge ? 'right-3 top-3' : 'right-2 top-2')}>
          <Badge className={cn('bg-accent font-bold', isLarge ? 'h-7 px-2 text-sm' : 'h-5 px-1.5 text-xs')}>
            x{item.qty}
          </Badge>
        </div>

        {/* Card name */}
        <h3 className={cn(
          'font-display font-bold leading-tight text-white line-clamp-2',
          isLarge ? 'text-base' : 'text-xs'
        )}>
          {item.card_printing.card.name}
        </h3>

        {/* Type + cost */}
        <div className={cn('flex items-center gap-1.5', isLarge ? 'mt-2' : 'mt-1')}>
          <span className={cn('text-white/70', isLarge ? 'text-sm' : 'text-[10px]')}>
            {item.card_printing.card.card_type.name}
          </span>
          {item.card_printing.card.cost !== null && (
            <Badge
              variant="secondary"
              className={cn('font-mono', isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]')}
            >
              {item.card_printing.card.cost}
            </Badge>
          )}
        </div>

        {/* Edition + rarity + condition */}
        <div className={cn('flex flex-wrap gap-1', isLarge ? 'mt-2' : 'mt-1')}>
          <Badge
            variant="outline"
            className={cn(
              'border-white/20 text-white/80',
              isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]'
            )}
          >
            {editionDisplayName(item.card_printing.edition.name)}
          </Badge>
          {item.card_printing.rarity_tier && (
            <Badge className={cn(
              rarityColor,
              isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]'
            )}>
              {item.card_printing.rarity_tier.name}
            </Badge>
          )}
          <Badge className={cn(
            conditionColor,
            isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]'
          )}>
            {conditionLabel}
          </Badge>
        </div>

        {/* Quantity controls — visible on hover */}
        {(onIncrement || onDecrement) && (
          <div className={cn(
            'flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isLarge ? 'mt-2' : 'mt-1'
          )}>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onDecrement}
              disabled={item.qty <= 1}
              title="Reducir cantidad"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onIncrement}
              title="Aumentar cantidad"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
