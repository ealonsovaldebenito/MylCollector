/**
 * File: apps/web/src/components/admin/stores/store-link-dialog.tsx
 *
 * StoreLinkDialog - Dialog modular para vincular un producto scrapeado a una impresion.
 * Centraliza busqueda de carta/impresion, contexto de scrape rapido y feedback visual.
 *
 * Contexto:
 * - Usado por Admin Stores para evitar duplicacion de UI inline y mejorar mantenibilidad.
 *
 * Changelog:
 * - 2026-02-19 - Extraccion modular del flujo "Vincular Producto".
 * - 2026-02-19 - Upgrade visual: contexto de scrape, preview de impresion y estados de progreso/error.
 */
'use client';

import type { ReactNode } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Package,
  Search,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CardSearchResult {
  card_printing_id: string;
  image_url: string | null;
  card: { card_id: string; name: string };
  edition: { name: string; code: string };
  rarity_tier: { name: string } | null;
  printing_variant: string | null;
}

interface PrintingOption {
  card_printing_id: string;
  collector_number: string | null;
  legal_status: string;
  printing_variant: string | null;
  image_url: string | null;
  edition: { edition_id: string; name: string; code: string };
  rarity_tier?: { name: string; code: string } | null;
}

interface QuickContext {
  name: string | null;
  price: number | null;
  currency: string;
  available: boolean;
  image_url: string | null;
  stock: number | null;
  original_price: number | null;
  platform?: string;
  source_url?: string;
}

interface StoreLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  trigger: ReactNode;
  linkSearch: string;
  onChangeLinkSearch: (value: string) => void;
  linkSearching: boolean;
  linkSearchResults: CardSearchResult[];
  selectedCard: CardSearchResult | null;
  onSelectCard: (item: CardSearchResult) => void;
  onClearSelectedCard: () => void;
  cardPrintings: PrintingOption[];
  cardPrintingsLoading: boolean;
  selectedPrintingId: string | null;
  onSelectPrinting: (printingId: string) => void;
  linkProductUrl: string;
  onChangeLinkProductUrl: (value: string) => void;
  linkProductName: string;
  onChangeLinkProductName: (value: string) => void;
  createReprint: boolean;
  onChangeCreateReprint: (value: boolean) => void;
  addLinkProgress: string | null;
  addLinkError: string | null;
  onClearAddLinkError: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  quickContext: QuickContext | null;
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function StoreLinkDialog({
  open,
  onOpenChange,
  storeName,
  trigger,
  linkSearch,
  onChangeLinkSearch,
  linkSearching,
  linkSearchResults,
  selectedCard,
  onSelectCard,
  onClearSelectedCard,
  cardPrintings,
  cardPrintingsLoading,
  selectedPrintingId,
  onSelectPrinting,
  linkProductUrl,
  onChangeLinkProductUrl,
  linkProductName,
  onChangeLinkProductName,
  createReprint,
  onChangeCreateReprint,
  addLinkProgress,
  addLinkError,
  onClearAddLinkError,
  onSubmit,
  isSubmitting,
  canSubmit,
  quickContext,
}: StoreLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Vincular Producto</DialogTitle>
          <DialogDescription>
            Busca una carta e impresion, valida la data scrapeada y vincula el link a {storeName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="space-y-2 rounded-md border border-border/60 bg-muted/10 p-3">
              <Label>Buscar carta / impresion</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={linkSearch}
                  onChange={(e) => onChangeLinkSearch(e.target.value)}
                  placeholder="Nombre de la carta..."
                  className="pl-9"
                />
              </div>
              {linkSearching ? <p className="text-xs text-muted-foreground">Buscando...</p> : null}

              {!selectedCard && linkSearch.length > 0 && linkSearchResults.length === 0 && !linkSearching ? (
                <p className="text-xs text-muted-foreground">Sin resultados para ese filtro.</p>
              ) : null}

              {linkSearchResults.length > 0 && !selectedCard ? (
                <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border/60 bg-background p-1">
                  {linkSearchResults.map((item) => (
                    <button
                      key={item.card_printing_id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/10"
                      onClick={() => onSelectCard(item)}
                    >
                      <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded border border-border bg-muted/20">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.card.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.edition.name}
                          {item.rarity_tier ? ` - ${item.rarity_tier.name}` : ''}
                          {item.printing_variant ? ` - ${item.printing_variant}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {selectedCard ? (
              <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-start gap-2">
                  <Package className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{selectedCard.card.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedCard.edition.name}
                      {selectedCard.rarity_tier ? ` - ${selectedCard.rarity_tier.name}` : ''}
                      {selectedCard.printing_variant ? ` - ${selectedCard.printing_variant}` : ''}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onClearSelectedCard}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Seleccionar impresion</Label>
                  {cardPrintingsLoading ? (
                    <p className="text-xs text-muted-foreground">Cargando impresiones...</p>
                  ) : cardPrintings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No hay impresiones disponibles.</p>
                  ) : (
                    <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border border-border/60 bg-background p-2">
                      {cardPrintings.map((printing) => {
                        const isSelected = selectedPrintingId === printing.card_printing_id;
                        return (
                          <label
                            key={printing.card_printing_id}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-md border px-2 py-2 text-sm transition-colors',
                              isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border',
                            )}
                          >
                            <input
                              type="radio"
                              name="selected-printing"
                              checked={isSelected}
                              onChange={() => onSelectPrinting(printing.card_printing_id)}
                            />
                            <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded border border-border bg-muted/20">
                              {printing.image_url ? (
                                <img src={printing.image_url} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{printing.edition?.name ?? 'Edicion'}</p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {printing.collector_number ? `#${printing.collector_number}` : ''}
                                {printing.collector_number && printing.printing_variant ? ' - ' : ''}
                                {printing.printing_variant ?? ''}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {printing.legal_status}
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4 lg:col-span-5">
            {quickContext ? (
              <div className="rounded-md border border-border/60 bg-card/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos scrapeados</p>
                  {quickContext.platform ? <Badge variant="secondary">{quickContext.platform}</Badge> : null}
                </div>
                <div className="flex gap-3">
                  <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded border border-border bg-background">
                    {quickContext.image_url ? (
                      <img src={quickContext.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{quickContext.name ?? 'Sin titulo'}</p>
                    <p className="text-xs text-muted-foreground">
                      {quickContext.price !== null ? formatCLP(quickContext.price) : 'Precio no detectado'}
                      {' � '}
                      {quickContext.currency}
                      {' � '}
                      {quickContext.available ? 'Disponible' : 'Sin stock'}
                    </p>
                    {quickContext.stock !== null ? (
                      <p className="text-xs text-muted-foreground">Stock: {quickContext.stock}</p>
                    ) : null}
                    {quickContext.original_price !== null ? (
                      <p className="text-xs text-muted-foreground">Precio lista: {formatCLP(quickContext.original_price)}</p>
                    ) : null}
                    {quickContext.source_url ? (
                      <a
                        href={quickContext.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver URL scrapeada
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="store-link-url">URL del producto *</Label>
                <Input
                  id="store-link-url"
                  value={linkProductUrl}
                  onChange={(e) => onChangeLinkProductUrl(e.target.value)}
                  placeholder="https://tienda.cl/producto/carta-xyz"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="store-link-name">Nombre del producto (opcional)</Label>
                <Input
                  id="store-link-name"
                  value={linkProductName}
                  onChange={(e) => onChangeLinkProductName(e.target.value)}
                  placeholder="Se autocompleta desde el scrape"
                />
              </div>

              <label className="flex items-start gap-2 rounded-md border border-border/50 bg-background/70 px-2 py-2">
                <input
                  id="create-reprint"
                  type="checkbox"
                  checked={createReprint}
                  onChange={(e) => onChangeCreateReprint(e.target.checked)}
                  disabled={!selectedPrintingId}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  Crear reimpresion cuando el nombre del producto difiere de la carta seleccionada.
                </span>
              </label>
            </div>

            {addLinkProgress ? (
              <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{addLinkProgress}</span>
              </div>
            ) : null}

            {addLinkError ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="flex-1">{addLinkError}</span>
                <button
                  type="button"
                  className="text-[11px] underline-offset-2 hover:underline"
                  onClick={onClearAddLinkError}
                >
                  Cerrar
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? 'Agregando...' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
