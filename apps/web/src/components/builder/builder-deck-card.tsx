'use client';

import type { DeckCardSlot } from '@/hooks/use-deck-builder';
import { editionDisplayName } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { Plus, Minus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuilderDeckCardProps {
  slot: DeckCardSlot;
  onAdd: () => void;
  onRemove: () => void;
  onSetStartingGold: () => void;
}

export function BuilderDeckCard({ slot, onAdd, onRemove, onSetStartingGold }: BuilderDeckCardProps) {
  const canBeGold = slot.card.card_type.code === 'ORO' && !slot.card.has_ability && slot.card.can_be_starting_gold;
  const maxQty = slot.card.is_unique ? 1 : 3;

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md border border-border/50 bg-card px-2 py-1.5 transition-colors hover:border-border',
        slot.is_starting_gold && 'border-amber-500/50 bg-amber-500/5',
      )}
    >
      {/* Mini image */}
      <div className="h-10 w-7 flex-shrink-0 overflow-hidden rounded-sm">
        <CardImage
          src={slot.image_url}
          alt={slot.card.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-xs font-medium">{slot.card.name}</span>
          {slot.is_starting_gold && (
            <Star className="h-3 w-3 flex-shrink-0 fill-amber-500 text-amber-500" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {editionDisplayName(slot.edition.name)}
          </Badge>
          {slot.card.cost !== null && (
            <span className="text-[10px] text-muted-foreground">C:{slot.card.cost}</span>
          )}
        </div>
      </div>

      {/* Gold button (only for eligible cards) */}
      {canBeGold && (
        <Button
          type="button"
          variant={slot.is_starting_gold ? 'default' : 'ghost'}
          size="icon"
          className={cn(
            'h-6 w-6 flex-shrink-0',
            slot.is_starting_gold
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'text-muted-foreground opacity-0 group-hover:opacity-100',
          )}
          onClick={onSetStartingGold}
          title="Marcar como oro inicial"
        >
          <Star className="h-3 w-3" />
        </Button>
      )}

      {/* Qty controls */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-5 text-center text-xs font-mono font-bold">{slot.qty}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onAdd}
          disabled={slot.qty >= maxQty}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
