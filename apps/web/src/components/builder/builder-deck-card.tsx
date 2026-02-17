'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DeckCardSlot } from '@/hooks/use-deck-builder';
import { editionDisplayName } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Plus, Minus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuilderDeckCardProps {
  slot: DeckCardSlot;
  onAdd: () => void;
  onRemove: () => void;
  onSetStartingGold: () => void;
  onReplacePrinting: (toPrinting: {
    card_printing_id: string;
    image_url: string | null;
    legal_status: DeckCardSlot['legal_status'];
    edition: DeckCardSlot['edition'];
    rarity_tier: DeckCardSlot['rarity_tier'];
    card: DeckCardSlot['card'];
  }) => void;
}

interface PrintingOption {
  card_printing_id: string;
  image_url: string | null;
  legal_status: DeckCardSlot['legal_status'];
  printing_variant: string;
  edition: DeckCardSlot['edition'];
  rarity_tier: DeckCardSlot['rarity_tier'];
}

interface ApiCardPrintingRow {
  card_printing_id: string;
  image_url: string | null;
  legal_status: DeckCardSlot['legal_status'];
  printing_variant: string;
  edition: DeckCardSlot['edition'];
  rarity_tier: { name: string; code: string } | null;
}

export function BuilderDeckCard({ slot, onAdd, onRemove, onSetStartingGold, onReplacePrinting }: BuilderDeckCardProps) {
  const canBeGold = slot.card.card_type.code === 'ORO' && !slot.card.has_ability && slot.card.can_be_starting_gold;
  const maxQty = slot.card.is_unique ? 1 : 3;

  const [isPrintingDialogOpen, setIsPrintingDialogOpen] = useState(false);
  const [printingOptions, setPrintingOptions] = useState<PrintingOption[]>([]);
  const [isLoadingPrintings, setIsLoadingPrintings] = useState(false);
  const [printingsError, setPrintingsError] = useState<string | null>(null);

  const currentPrintingId = slot.card_printing_id;

  const optionsByEdition = useMemo(() => {
    const opts = printingOptions.slice();
    opts.sort((a, b) => {
      const ea = editionDisplayName(a.edition.name);
      const eb = editionDisplayName(b.edition.name);
      const cmp = ea.localeCompare(eb, 'es');
      if (cmp !== 0) return cmp;
      return a.printing_variant.localeCompare(b.printing_variant, 'es');
    });
    return opts;
  }, [printingOptions]);

  useEffect(() => {
    if (!isPrintingDialogOpen) return;
    if (printingOptions.length > 0 || isLoadingPrintings) return;

    let mounted = true;
    setIsLoadingPrintings(true);
    setPrintingsError(null);
    fetch(`/api/v1/cards/${slot.card.card_id}/printings`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (!json.ok) {
          setPrintingsError(json.error?.message ?? 'Error al cargar impresiones');
          return;
        }
        const rows = (json.data ?? []) as ApiCardPrintingRow[];
        setPrintingOptions(
          rows.map((p) => ({
            card_printing_id: p.card_printing_id,
            image_url: p.image_url ?? null,
            legal_status: p.legal_status,
            printing_variant: p.printing_variant,
            edition: p.edition,
            rarity_tier: p.rarity_tier ? { name: p.rarity_tier.name, code: p.rarity_tier.code } : null,
          })),
        );
      })
      .catch(() => {
        if (!mounted) return;
        setPrintingsError('Error de conexión');
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoadingPrintings(false);
      });

    return () => {
      mounted = false;
    };
  }, [isPrintingDialogOpen, isLoadingPrintings, printingOptions.length, slot.card.card_id]);

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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setIsPrintingDialogOpen(true)}
            title="Cambiar impresión"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>
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

      <Dialog open={isPrintingDialogOpen} onOpenChange={setIsPrintingDialogOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-base">Seleccionar impresión</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-2 p-4">
              {printingsError ? (
                <p className="text-sm text-destructive">{printingsError}</p>
              ) : isLoadingPrintings ? (
                <p className="text-sm text-muted-foreground">Cargando impresiones…</p>
              ) : optionsByEdition.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay impresiones disponibles.</p>
              ) : (
                optionsByEdition.map((p) => {
                  const active = p.card_printing_id === currentPrintingId;
                  return (
                    <button
                      key={p.card_printing_id}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md border border-border/60 bg-background px-3 py-2 text-left transition-colors hover:bg-muted/40',
                        active && 'border-primary bg-primary/5',
                      )}
                      onClick={() => {
                        onReplacePrinting({
                          card_printing_id: p.card_printing_id,
                          image_url: p.image_url ?? null,
                          legal_status: p.legal_status,
                          edition: p.edition,
                          rarity_tier: p.rarity_tier,
                          card: slot.card,
                        });
                        setIsPrintingDialogOpen(false);
                      }}
                    >
                      <div className="h-14 w-10 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-muted/20">
                        <CardImage src={p.image_url} alt={slot.card.name} className="h-full w-full" fit="contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={active ? 'default' : 'secondary'} className="h-5 text-[10px]">
                            {editionDisplayName(p.edition.name)}
                          </Badge>
                          {p.rarity_tier ? (
                            <Badge variant="outline" className="h-5 text-[10px]">
                              {p.rarity_tier.name}
                            </Badge>
                          ) : null}
                          <Badge variant="outline" className="h-5 text-[10px]">
                            {p.legal_status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Variante: <span className="font-mono">{p.printing_variant}</span>
                        </div>
                      </div>
                      {active ? (
                        <Badge className="h-5 flex-shrink-0 text-[10px]">Actual</Badge>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
