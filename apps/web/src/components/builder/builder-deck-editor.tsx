'use client';

import type { CardPrintingData, DeckCardSlot } from '@/hooks/use-deck-builder';
import { BuilderDeckCard } from './builder-deck-card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardGrouping {
  typeName: string;
  typeCode: string;
  sortOrder: number;
  cards: DeckCardSlot[];
  totalQty: number;
}

interface BuilderDeckEditorProps {
  groupedByType: CardGrouping[];
  totalCards: number;
  deckSize: number;
  hasStartingGold: boolean;
  isValid: boolean | null;
  onAddCard: (printingId: string) => void;
  onRemoveCard: (printingId: string) => void;
  onSetStartingGold: (printingId: string) => void;
  onReplacePrinting: (fromPrintingId: string, toPrinting: CardPrintingData) => void;
}

export function BuilderDeckEditor({
  groupedByType,
  totalCards,
  deckSize,
  hasStartingGold,
  isValid,
  onAddCard,
  onRemoveCard,
  onSetStartingGold,
  onReplacePrinting,
}: BuilderDeckEditorProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Mi Mazo</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Card count */}
          <Badge
            variant="outline"
            className={cn(
              'font-mono text-xs',
              totalCards === deckSize && 'border-green-500 text-green-600',
              totalCards > deckSize && 'border-destructive text-destructive',
            )}
          >
            {totalCards}/{deckSize}
          </Badge>

          {/* Starting gold indicator */}
          <div
            className={cn(
              'flex items-center gap-1 text-xs',
              hasStartingGold ? 'text-amber-500' : 'text-muted-foreground',
            )}
            title={hasStartingGold ? 'Oro inicial seleccionado' : 'Falta oro inicial'}
          >
            <Star className={cn('h-3.5 w-3.5', hasStartingGold && 'fill-amber-500')} />
          </div>

          {/* Validation status */}
          {isValid !== null && (
            isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )
          )}
        </div>
      </div>

      {/* Card list */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {groupedByType.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Tu mazo esta vacio
              </p>
              <p className="text-xs text-muted-foreground/70">
                Busca cartas a la izquierda y agregalas con +
              </p>
            </div>
          ) : (
            groupedByType.map((group) => (
              <div key={group.typeCode}>
                {/* Group header */}
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.typeName}
                  </span>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {group.totalQty}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="space-y-1">
                  {group.cards.map((slot) => (
                    <BuilderDeckCard
                      key={slot.card_printing_id}
                      slot={slot}
                      onAdd={() => onAddCard(slot.card_printing_id)}
                      onRemove={() => onRemoveCard(slot.card_printing_id)}
                      onSetStartingGold={() => onSetStartingGold(slot.card_printing_id)}
                      onReplacePrinting={(toPrinting) => onReplacePrinting(slot.card_printing_id, toPrinting)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
