/**
 * File: apps/web/src/components/builder/builder-deck-card.tsx
 *
 * BuilderDeckCard - Fila compacta para una copia especifica dentro del mazo.
 * Permite cambiar impresion, duplicar/eliminar copia y marcar carta clave.
 *
 * Changelog:
 * - 2026-02-19 - UI: imagen de carta mas grande en fila compacta.
 * - 2026-02-19 - UI: coste se oculta para cartas de tipo Oro.
 * - 2026-02-19 - Compacta layout de fila para mejorar densidad en la columna central.
 * - 2026-02-19 - Builder: se elimina accion de Oro inicial (ahora es implicito).
 * - 2026-02-18 - Agrega acceso rapido al detalle de catalogo por carta.
 * - 2026-02-18 - Respeta limites de copias por formato en boton +.
 * - 2026-02-19 - Fix: dialogo de impresiones estable, tooltip de coste, cache de impresiones.
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { DeckCardSlot } from '@/hooks/use-deck-builder';
import { editionDisplayName } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Layers, Plus, Minus, Coins, Star, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuilderDeckCardProps {
  slot: DeckCardSlot;
  copiesOfCard: number;
  maxCopiesForCard?: number;
  disableAdd?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onToggleKeyCard: () => void;
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

export function BuilderDeckCard({
  slot,
  copiesOfCard,
  maxCopiesForCard,
  disableAdd = false,
  onAdd,
  onRemove,
  onToggleKeyCard,
  onReplacePrinting,
}: BuilderDeckCardProps) {
  const maxQty = Math.max(1, maxCopiesForCard ?? (slot.card.is_unique ? 1 : 3));
  const isFormatBanned = (maxCopiesForCard ?? maxQty) <= 0 || slot.legal_status === 'BANNED';
  const isRestricted = !isFormatBanned && (slot.legal_status === 'RESTRICTED' || maxQty <= 2);

  const [isPrintingDialogOpen, setIsPrintingDialogOpen] = useState(false);
  const [printingOptions, setPrintingOptions] = useState<PrintingOption[]>([]);
  const [isLoadingPrintings, setIsLoadingPrintings] = useState(false);
  const [printingsError, setPrintingsError] = useState<string | null>(null);
  const printingsCacheRef = useRef<Map<string, PrintingOption[]>>(new Map());

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
    if (!slot.card.card_id) {
      setPrintingsError('Carta sin id');
      return;
    }

    const cached = printingsCacheRef.current.get(slot.card.card_id);
    if (cached && cached.length > 0) {
      setPrintingOptions(cached);
      return;
    }

    if (printingOptions.length > 0 || isLoadingPrintings) return;

    let mounted = true;
    setIsLoadingPrintings(true);
    setPrintingsError(null);

    fetch(`/api/v1/cards/${slot.card.card_id}/printings`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => '');
          throw new Error(`HTTP ${r.status}: ${text || r.statusText}`);
        }
        return r.json();
      })
      .then((json) => {
        if (!mounted) return;
        if (!json.ok) {
          setPrintingsError(json.error?.message ?? 'Error al cargar impresiones');
          return;
        }

        const rows = (json.data ?? []) as ApiCardPrintingRow[];
        const mapped = rows.map((p) => ({
          card_printing_id: p.card_printing_id,
          image_url: p.image_url ?? null,
          legal_status: p.legal_status,
          printing_variant: p.printing_variant,
          edition: p.edition,
          rarity_tier: p.rarity_tier ? { name: p.rarity_tier.name, code: p.rarity_tier.code } : null,
        }));

        printingsCacheRef.current.set(slot.card.card_id, mapped);
        setPrintingOptions(mapped);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('printings fetch error', err);
        setPrintingsError(err?.message ?? 'Error de conexion');
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
    <div className="group flex items-center gap-2 rounded-md border border-border/40 bg-card/80 px-2 py-1.5 transition-colors hover:border-border">
      <div className="h-12 w-9 flex-shrink-0 overflow-hidden rounded-sm">
        <CardImage src={slot.image_url} alt={slot.card.name} className="h-full w-full object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium">{slot.card.name}</span>
          {slot.is_key_card ? <Star className="h-3 w-3 flex-shrink-0 fill-yellow-500 text-yellow-500" /> : null}
        </div>

        <div className="flex items-center gap-1">
          <Badge variant="outline" className="h-4 px-1 text-[9px]">
            {editionDisplayName(slot.edition.name)}
          </Badge>
          {isFormatBanned ? (
            <Badge variant="destructive" className="h-4 px-1 text-[9px]">
              Banlist
            </Badge>
          ) : isRestricted ? (
            <Badge variant="outline" className="h-4 px-1 text-[9px]">
              Lim {maxQty}
            </Badge>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
            onClick={() => setIsPrintingDialogOpen(true)}
            title="Cambiar impresion"
          >
            <Layers className="h-3.5 w-3.5" />
          </Button>

          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
          >
            <Link href={`/catalog/${slot.card.card_id}`} title="Ver en catalogo">
              <BookOpen className="h-3.5 w-3.5" />
            </Link>
          </Button>

          {slot.card.card_type.code !== 'ORO' && slot.card.cost !== null ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="h-4 cursor-help gap-1 px-1 text-[9px]">
                    <Coins className="h-2.5 w-2.5 text-amber-500" />
                    {slot.card.cost}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  Coste de Oro
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </div>

      <Button
        type="button"
        variant={slot.is_key_card ? 'default' : 'ghost'}
        size="icon"
        className={cn(
          'h-5 w-5 flex-shrink-0',
          slot.is_key_card
            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
            : 'text-muted-foreground md:opacity-0 md:group-hover:opacity-100',
        )}
        onClick={onToggleKeyCard}
        title="Marcar como carta clave"
      >
        <Star className="h-3 w-3" />
      </Button>

      <div className="flex flex-shrink-0 items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={onRemove}>
          <Minus className="h-2.5 w-2.5" />
        </Button>
        <span className="w-4 text-center font-mono text-[10px] font-bold">1</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={onAdd}
          disabled={disableAdd || copiesOfCard >= maxQty}
          title={
            isFormatBanned
              ? 'Carta bloqueada por banlist/formato'
              : copiesOfCard >= maxQty
                ? `Limite alcanzado (${maxQty})`
                : disableAdd
                  ? 'No puedes agregar mas cartas en el mazo'
                  : 'Agregar copia'
          }
        >
          <Plus className="h-2.5 w-2.5" />
        </Button>
      </div>

      <Dialog open={isPrintingDialogOpen} onOpenChange={setIsPrintingDialogOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-base">Seleccionar impresion</DialogTitle>
            <DialogDescription className="sr-only">
              Elige una impresion alternativa de la misma carta.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-2 p-4">
              {printingsError ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive">{printingsError}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setPrintingOptions([]);
                      setPrintingsError(null);
                      setIsLoadingPrintings(false);
                    }}
                  >
                    Reintentar
                  </Button>
                </div>
              ) : isLoadingPrintings ? (
                <p className="text-sm text-muted-foreground">Cargando impresiones...</p>
              ) : optionsByEdition.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay impresiones disponibles.</p>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Impresiones encontradas: {optionsByEdition.length}</div>
                  {optionsByEdition.map((p) => {
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
                        {active ? <Badge className="h-5 flex-shrink-0 text-[10px]">Actual</Badge> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
