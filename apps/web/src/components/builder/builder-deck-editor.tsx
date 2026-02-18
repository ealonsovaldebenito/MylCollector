/**
 * File: apps/web/src/components/builder/builder-deck-editor.tsx
 *
 * BuilderDeckEditor - Panel central/derecho que lista el mazo agrupado por tipo
 * y permite acciones por copia (duplicar, borrar, cambiar impresion, marcar carta clave).
 *
 * Relaciones:
 * - Consume `useDeckBuilder` (via `BuilderWorkspace`).
 * - Renderiza `BuilderDeckCard` para cada copia (`DeckCardSlot.deck_card_id`).
 *
 * Bugfixes / Notas:
 * - Adaptado al modelo por copia (sin `qty` en el slot). Los totales se calculan por largo de lista.
 * - Oro inicial es implicito en builder: no se muestra ni se edita por carta.
 *
 * Changelog:
 * - 2026-02-19 - Layout: listado por categoria en 2 columnas (responsive).
 * - 2026-02-19 - UX: grupos colapsables/expandibles para reducir ruido visual.
 * - 2026-02-19 - Espaciado optimizado en columna central para mostrar mas cartas.
 * - 2026-02-19 - UI simplificada: un solo contador jugable y sin acciones de Oro inicial.
 * - 2026-02-17 - Refactor: soporte por copia + acciones de key card.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CardPrintingData, DeckCardSlot } from '@/hooks/use-deck-builder';
import { BuilderDeckCard } from './builder-deck-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, ChevronsDown, ChevronsUp } from 'lucide-react';
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
  isValid: boolean | null;
  getCardCopyLimit: (
    cardId: string,
    options: { is_unique: boolean; legal_status: DeckCardSlot['legal_status'] },
  ) => number;
  onAddCard: (deckCardId: string) => void;
  onRemoveCard: (deckCardId: string) => void;
  onReplacePrinting: (deckCardId: string, toPrinting: CardPrintingData) => void;
  onToggleKeyCard: (cardId: string) => void;
}

export function BuilderDeckEditor({
  groupedByType,
  totalCards,
  deckSize,
  isValid,
  getCardCopyLimit,
  onAddCard,
  onRemoveCard,
  onReplacePrinting,
  onToggleKeyCard,
}: BuilderDeckEditorProps) {
  const deckAddBlocked = totalCards >= deckSize;
  const [collapsedTypeCodes, setCollapsedTypeCodes] = useState<Set<string>>(new Set());

  const copiesByCardId = useMemo(() => {
    const map = new Map<string, number>();
    for (const group of groupedByType) {
      for (const c of group.cards) {
        map.set(c.card.card_id, (map.get(c.card.card_id) ?? 0) + 1);
      }
    }
    return map;
  }, [groupedByType]);

  useEffect(() => {
    const validCodes = new Set(groupedByType.map((g) => g.typeCode));
    setCollapsedTypeCodes((prev) => {
      const next = new Set<string>();
      for (const code of prev) {
        if (validCodes.has(code)) next.add(code);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [groupedByType]);

  const toggleTypeCollapse = useCallback((typeCode: string) => {
    setCollapsedTypeCodes((prev) => {
      const next = new Set(prev);
      if (next.has(typeCode)) next.delete(typeCode);
      else next.add(typeCode);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedTypeCodes(new Set(groupedByType.map((g) => g.typeCode)));
  }, [groupedByType]);

  const expandAll = useCallback(() => {
    setCollapsedTypeCodes(new Set());
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Mi Mazo</span>
        </div>
        <div className="flex items-center gap-1.5">
          {groupedByType.length > 1 ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={collapseAll}
                title="Colapsar grupos"
              >
                <ChevronsDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={expandAll}
                title="Expandir grupos"
              >
                <ChevronsUp className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : null}
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

          {isValid !== null &&
            (isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-2.5">
          {groupedByType.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Tu mazo esta vacio</p>
              <p className="text-xs text-muted-foreground/70">Busca cartas a la izquierda y agregalas con +</p>
            </div>
          ) : (
            groupedByType.map((group) => (
              <div key={group.typeCode} className="overflow-hidden rounded-md border border-border/40 bg-card/30">
                <button
                  type="button"
                  onClick={() => toggleTypeCollapse(group.typeCode)}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/30"
                >
                  {collapsedTypeCodes.has(group.typeCode) ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.typeName}
                  </span>
                  <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
                    {group.totalQty}
                  </Badge>
                </button>

                {collapsedTypeCodes.has(group.typeCode) ? null : (
                  <div className="grid grid-cols-1 gap-1.5 border-t border-border/30 p-1.5 md:grid-cols-2">
                    {group.cards.map((slot) => {
                      const maxCopiesForCard = getCardCopyLimit(slot.card.card_id, {
                        is_unique: slot.card.is_unique,
                        legal_status: slot.legal_status,
                      });

                      return (
                        <BuilderDeckCard
                          key={slot.deck_card_id}
                          slot={slot}
                          copiesOfCard={copiesByCardId.get(slot.card.card_id) ?? 1}
                          maxCopiesForCard={maxCopiesForCard}
                          disableAdd={deckAddBlocked}
                          onAdd={() => onAddCard(slot.deck_card_id)}
                          onRemove={() => onRemoveCard(slot.deck_card_id)}
                          onToggleKeyCard={() => onToggleKeyCard(slot.card.card_id)}
                          onReplacePrinting={(toPrinting) => onReplacePrinting(slot.deck_card_id, toPrinting)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
