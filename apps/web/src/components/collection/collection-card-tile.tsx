/**
 * CollectionCardTile — Tarjeta visual de un item en la colección.
 * Muestra imagen, datos, condición, precio, controles qty y mover.
 *
 * Changelog:
 *   2026-02-17 — Creación inicial
 *   2026-02-18 — Feat: botón mover a carpeta, precio estimado, vendible badge
 *   2026-02-18 — UX: cantidad entre botones +/-, mejor layout
 */

'use client';

import { cn } from '@/lib/utils';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Edit2, FolderInput, DollarSign, ShoppingCart } from 'lucide-react';
import type { UserCardWithRelations } from '@myl/shared';

interface CollectionCardTileProps {
  item: UserCardWithRelations;
  onEdit?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onMove?: () => void;
  size?: 'normal' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

const CONDITION_COLORS: Record<string, string> = {
  PERFECTA: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  'CASI PERFECTA': 'bg-green-500/20 text-green-700 dark:text-green-300',
  EXCELENTE: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  BUENA: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  'POCO USO': 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  JUGADA: 'bg-red-500/20 text-red-700 dark:text-red-300',
  'MALAS CONDICIONES': 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
};

const CONDITION_LABELS: Record<string, string> = {
  PERFECTA: 'Perf',
  'CASI PERFECTA': 'Casi',
  EXCELENTE: 'Exc',
  BUENA: 'Buena',
  'POCO USO': 'Poco',
  JUGADA: 'Jug',
  'MALAS CONDICIONES': 'Pobre',
};

const RARITY_COLORS: Record<string, string> = {
  COMUN: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
  POCO_COMUN: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  RARA: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  ULTRA_RARA: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  SECRETA: 'bg-amber-500/30 text-amber-700 dark:text-amber-300',
};

export function CollectionCardTile({
  item,
  onEdit,
  onIncrement,
  onDecrement,
  onMove,
  size = 'large',
  className,
  style,
}: CollectionCardTileProps) {
  const isLarge = size === 'large';
  const conditionColor = CONDITION_COLORS[item.condition] ?? CONDITION_COLORS.PERFECTA;
  const conditionLabel = CONDITION_LABELS[item.condition] ?? item.condition;
  const rarityColor = RARITY_COLORS[item.card_printing.rarity_tier?.code ?? ''] ?? RARITY_COLORS.COMUN;

  // User-assigned price takes priority; fallback to store min price
  const userPrice = (item as Record<string, unknown>).user_price as number | null | undefined;
  const storePrice = (item as Record<string, unknown>).store_min_price as number | null | undefined;
  const displayPrice = userPrice ?? storePrice;
  const isForSale = ((item as Record<string, unknown>).is_for_sale as boolean) ?? false;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-border',
        'bg-card transition-all duration-200',
        'hover:scale-[1.02] hover:border-accent/30 hover:shadow-xl',
        isForSale && 'ring-1 ring-emerald-500/40',
        'animate-fade-in',
        className,
      )}
      style={style}
    >
      {/* Action buttons — visible on hover */}
      <div className={cn(
        'absolute z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
        isLarge ? 'left-2 top-2' : 'left-1.5 top-1.5',
      )}>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'bg-black/50 backdrop-blur border border-white/20',
            'hover:bg-accent/20 hover:border-accent/40',
            isLarge ? 'h-8 w-8' : 'h-6 w-6',
          )}
          onClick={onEdit}
          title="Editar item"
        >
          <Edit2 className={cn('text-white', isLarge ? 'h-4 w-4' : 'h-3 w-3')} />
        </Button>
        {onMove && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'bg-black/50 backdrop-blur border border-white/20',
              'hover:bg-primary/20 hover:border-primary/40',
              isLarge ? 'h-8 w-8' : 'h-6 w-6',
            )}
            onClick={onMove}
            title="Mover a carpeta"
          >
            <FolderInput className={cn('text-white', isLarge ? 'h-4 w-4' : 'h-3 w-3')} />
          </Button>
        )}
      </div>

      {/* Card image */}
      <CardImage
        src={item.card_printing.image_url}
        alt={item.card_printing.card.name}
        className="aspect-[5/7] w-full"
      />

      {/* Top-right badges: precios + venta */}
      <div className={cn('absolute flex flex-col items-end gap-1', isLarge ? 'right-2 top-2' : 'right-1.5 top-1.5')}>
        {userPrice != null && userPrice > 0 && (
          <Badge className={cn(
            'font-mono shadow-md bg-primary/90 text-white gap-1',
            isLarge ? 'h-6 px-1.5 text-xs' : 'h-4 px-1 text-[10px]',
          )}>
            <DollarSign className={cn(isLarge ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
            {userPrice.toLocaleString('es-CL')}
          </Badge>
        )}
        {storePrice != null && storePrice > 0 && (userPrice == null || storePrice !== userPrice) && (
          <Badge className={cn(
            'font-mono shadow border border-white/20 bg-black/50 backdrop-blur text-white/90 gap-1',
            isLarge ? 'h-5 px-1.5 text-[10px]' : 'h-4 px-1 text-[9px]',
          )}>
            <DollarSign className={cn(isLarge ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
            Cat. {storePrice.toLocaleString('es-CL')}
          </Badge>
        )}
        {displayPrice != null && displayPrice > 0 && userPrice == null && (
          <Badge className={cn(
            'font-mono shadow-md bg-black/60 backdrop-blur text-white/90 gap-1',
            isLarge ? 'h-6 px-1.5 text-xs' : 'h-4 px-1 text-[10px]',
          )}>
            <DollarSign className={cn(isLarge ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
            {displayPrice.toLocaleString('es-CL')}
          </Badge>
        )}
        {isForSale && (
          <Badge className={cn(
            'bg-emerald-500 text-white font-semibold shadow-md gap-1',
            isLarge ? 'h-5 px-1.5 text-[10px]' : 'h-4 px-1 text-[9px]',
          )}>
            <ShoppingCart className={cn(isLarge ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
            En venta
          </Badge>
        )}
      </div>

      {/* Overlay gradient with card info */}
      <div className={cn(
        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent',
        isLarge ? 'p-3 pt-10' : 'p-2 pt-8'
      )}>
        {/* Card name */}
        <h3 className={cn(
          'font-display font-bold leading-tight text-white line-clamp-2',
          isLarge ? 'text-sm' : 'text-xs'
        )}>
          {item.card_printing.card.name}
        </h3>

        {/* Type + cost */}
        <div className={cn('flex items-center gap-1.5', isLarge ? 'mt-1' : 'mt-0.5')}>
          <span className={cn('text-white/70', isLarge ? 'text-xs' : 'text-[10px]')}>
            {item.card_printing.card.card_type.name}
          </span>
          {item.card_printing.card.cost !== null && (
            <Badge
              variant="secondary"
              className={cn('font-mono', isLarge ? 'h-4 px-1 text-[10px]' : 'h-3.5 px-1 text-[9px]')}
            >
              {item.card_printing.card.cost}
            </Badge>
          )}
        </div>

        {/* Edition + rarity + condition */}
        <div className={cn('flex flex-wrap gap-1', isLarge ? 'mt-1.5' : 'mt-1')}>
          <Badge
            variant="outline"
            className={cn(
              'border-white/20 text-white/80',
              isLarge ? 'h-4 px-1 text-[10px]' : 'h-3.5 px-1 text-[9px]'
            )}
          >
            {editionDisplayName(item.card_printing.edition.name)}
          </Badge>
          {item.card_printing.rarity_tier && (
            <Badge className={cn(
              rarityColor,
              isLarge ? 'h-4 px-1 text-[10px]' : 'h-3.5 px-1 text-[9px]'
            )}>
              {item.card_printing.rarity_tier.name}
            </Badge>
          )}
          <Badge className={cn(
            conditionColor,
            isLarge ? 'h-4 px-1 text-[10px]' : 'h-3.5 px-1 text-[9px]'
          )}>
            {conditionLabel}
          </Badge>
        </div>

        {/* Quantity controls — always visible: [ - ] qty [ + ] */}
        {(onIncrement || onDecrement) && (
          <div className={cn(
            'flex items-center gap-0.5',
            isLarge ? 'mt-2' : 'mt-1'
          )}>
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                'p-0 opacity-60 group-hover:opacity-100 transition-opacity',
                isLarge ? 'h-7 w-7' : 'h-6 w-6',
              )}
              onClick={onDecrement}
              disabled={item.qty <= 1}
              title="Reducir cantidad"
            >
              <Minus className={cn(isLarge ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
            </Button>
            <span className={cn(
              'font-mono font-bold text-white min-w-[2rem] text-center select-none',
              isLarge ? 'text-base' : 'text-sm',
            )}>
              {item.qty}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                'p-0 opacity-60 group-hover:opacity-100 transition-opacity',
                isLarge ? 'h-7 w-7' : 'h-6 w-6',
              )}
              onClick={onIncrement}
              title="Aumentar cantidad"
            >
              <Plus className={cn(isLarge ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
