/**
 * CardStoreLinks — Gestión de links de tienda por impresión.
 * Permite asociar URLs de productos de tiendas a cada impresión de una carta,
 * ver precios actuales y gestionar los links existentes.
 *
 * Relaciones:
 *   - store_printing_links → stores (many-to-one)
 *   - store_printing_links → card_printings (many-to-one)
 *
 * API:
 *   - GET /api/v1/admin/stores → tiendas disponibles
 *   - GET /api/v1/admin/printings/:id/store-links → links de una impresión
 *   - POST /api/v1/admin/printings/:id/store-links → crear link
 *   - DELETE /api/v1/admin/stores/:storeId/links/:linkId → eliminar link
 *
 * Changelog:
 *   2026-02-16 — Creación inicial
 *   2026-02-17 — Fix: manejar respuestas no-JSON del API (error 500 plain text)
 *   2026-02-17 — UX: mejorar layout, estados vacíos, feedback visual
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  Store,
  Trash2,
  AlertCircle,
  DollarSign,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CardImage } from '@/components/catalog/card-image';
import { editionDisplayName } from '@myl/shared';

// ============================================================================
// Types
// ============================================================================

type StoreRow = {
  store_id: string;
  name: string;
  url: string | null;
  logo_url: string | null;
  is_active: boolean;
};

type StoreLinkRow = {
  store_printing_link_id: string;
  product_url: string;
  product_name: string | null;
  last_price: number | null;
  last_currency_id: string | null;
  last_scraped_at: string | null;
  is_active: boolean;
  store: StoreRow;
};

type PrintingRow = {
  card_printing_id: string;
  image_url: string | null;
  collector_number: string | null;
  legal_status: 'LEGAL' | 'RESTRICTED' | 'BANNED' | 'DISCONTINUED';
  edition: { name: string; code: string };
  rarity_tier: { name: string; code: string } | null;
  price_consensus?: { consensus_price: number } | null;
};

// ============================================================================
// Helpers
// ============================================================================

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
}

/** Safe JSON fetch — handles non-JSON responses (e.g. 500 plain text). */
async function safeFetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text) as { ok: boolean; data?: unknown; error?: { message?: string } };
  } catch {
    throw new Error(
      res.ok
        ? 'Respuesta inválida del servidor'
        : `Error ${res.status}: ${text.slice(0, 100)}`,
    );
  }
}

// ============================================================================
// Legal status helpers
// ============================================================================

const LEGAL_STATUS_LABELS: Record<string, string> = {
  LEGAL: 'Legal',
  RESTRICTED: 'Restringida',
  BANNED: 'Prohibida',
  DISCONTINUED: 'Discontinuada',
};

const LEGAL_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LEGAL: 'default',
  RESTRICTED: 'secondary',
  BANNED: 'destructive',
  DISCONTINUED: 'destructive',
};

// ============================================================================
// Component
// ============================================================================

export function CardStoreLinks({
  cardName,
  printings,
}: {
  cardId: string;
  cardName: string;
  printings: PrintingRow[];
}) {
  // ── State ──────────────────────────────────────────────────────────────
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState<string | null>(null);

  const [selectedPrintingId, setSelectedPrintingId] = useState<string | null>(null);
  const selectedPrinting = useMemo(
    () => printings.find((p) => p.card_printing_id === selectedPrintingId) ?? null,
    [printings, selectedPrintingId],
  );

  const [links, setLinks] = useState<StoreLinkRow[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);

  const [newStoreId, setNewStoreId] = useState<string>('');
  const [newProductUrl, setNewProductUrl] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────
  const linksSummary = useMemo(() => {
    const prices = links
      .map((l) => l.last_price)
      .filter((p): p is number => typeof p === 'number' && Number.isFinite(p));
    if (prices.length === 0)
      return { linkCount: links.length, min: null as number | null, max: null as number | null };
    return { linkCount: links.length, min: Math.min(...prices), max: Math.max(...prices) };
  }, [links]);

  const availableStores = useMemo(() => {
    const linkedStoreIds = new Set(links.map((l) => l.store.store_id));
    return stores
      .filter((s) => s.is_active && !linkedStoreIds.has(s.store_id))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [stores, links]);

  // ── Data loading ───────────────────────────────────────────────────────
  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    setStoresError(null);
    try {
      const json = await safeFetchJson('/api/v1/admin/stores');
      if (!json?.ok) throw new Error((json?.error as { message?: string })?.message ?? 'Error al cargar tiendas');
      const items = ((json.data as { items?: StoreRow[] })?.items ?? []) as StoreRow[];
      setStores(items);
    } catch (err) {
      setStoresError(err instanceof Error ? err.message : 'Error al cargar tiendas');
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  const loadLinks = useCallback(async (printingId: string) => {
    setLinksLoading(true);
    setLinksError(null);
    try {
      const json = await safeFetchJson(`/api/v1/admin/printings/${printingId}/store-links`);
      if (!json?.ok) throw new Error((json?.error as { message?: string })?.message ?? 'Error al cargar links');
      const items = ((json.data as { items?: StoreLinkRow[] })?.items ?? []) as StoreLinkRow[];
      setLinks(items);
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error al cargar links');
      setLinks([]);
    } finally {
      setLinksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    if (!selectedPrintingId && printings.length > 0) {
      setSelectedPrintingId(printings[0]!.card_printing_id);
    }
  }, [printings, selectedPrintingId]);

  useEffect(() => {
    if (selectedPrintingId) loadLinks(selectedPrintingId);
  }, [loadLinks, selectedPrintingId]);

  // ── Actions ────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!selectedPrintingId || !newStoreId || !newProductUrl.trim()) return;

    setIsAdding(true);
    setLinksError(null);
    try {
      const json = await safeFetchJson(
        `/api/v1/admin/printings/${selectedPrintingId}/store-links`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_id: newStoreId,
            product_url: newProductUrl.trim(),
            product_name: newProductName.trim() || null,
          }),
        },
      );
      if (!json?.ok) throw new Error((json?.error as { message?: string })?.message ?? 'Error al agregar link');

      setNewStoreId('');
      setNewProductUrl('');
      setNewProductName('');
      await loadLinks(selectedPrintingId);
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error al agregar link');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (row: StoreLinkRow) => {
    if (!confirm(`¿Eliminar el link de ${row.store.name}?`)) return;

    setDeletingId(row.store_printing_link_id);
    try {
      const json = await safeFetchJson(
        `/api/v1/admin/stores/${row.store.store_id}/links/${row.store_printing_link_id}`,
        { method: 'DELETE' },
      );
      if (!json?.ok) throw new Error((json?.error as { message?: string })?.message ?? 'Error al eliminar');
      if (selectedPrintingId) await loadLinks(selectedPrintingId);
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error al eliminar link');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* ── Left: Printing Selector ──────────────────────────────────── */}
      <div className="lg:col-span-4">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span className="text-sm font-medium">Impresiones</span>
            <Badge variant="secondary" className="text-[10px]">
              {printings.length}
            </Badge>
          </div>

          <div className="max-h-[460px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {printings.map((p) => {
              const isActive = p.card_printing_id === selectedPrintingId;
              const consensus = p.price_consensus?.consensus_price ?? null;
              return (
                <button
                  key={p.card_printing_id}
                  type="button"
                  onClick={() => setSelectedPrintingId(p.card_printing_id)}
                  className={[
                    'w-full text-left rounded-lg border p-2.5 transition-all',
                    isActive
                      ? 'border-accent bg-accent/5 shadow-sm'
                      : 'border-transparent hover:border-border hover:bg-muted/30',
                  ].join(' ')}
                >
                  <div className="flex gap-2.5">
                    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded border border-border bg-background">
                      <CardImage
                        src={p.image_url ?? null}
                        alt={cardName}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {editionDisplayName(p.edition.name)}
                        </Badge>
                        {p.collector_number && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            #{p.collector_number}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={LEGAL_STATUS_VARIANT[p.legal_status] ?? 'outline'}
                          className="text-[10px]"
                        >
                          {LEGAL_STATUS_LABELS[p.legal_status] ?? p.legal_status}
                        </Badge>
                        {consensus !== null && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatCLP(consensus)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Links for selected printing ───────────────────────── */}
      <div className="lg:col-span-8 space-y-4">
        {/* Header + summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {selectedPrinting
                ? editionDisplayName(selectedPrinting.edition.name)
                : 'Selecciona una impresión'}
            </span>
          </div>
          {linksSummary.linkCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {linksSummary.linkCount} tienda{linksSummary.linkCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {linksSummary.min !== null && (
            <Badge variant="secondary" className="text-xs font-mono">
              {formatCLP(linksSummary.min)}
              {linksSummary.max !== linksSummary.min && `–${formatCLP(linksSummary.max!)}`}
            </Badge>
          )}
        </div>

        {/* Add new link form */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Agregar link de tienda</span>
          </div>

          {storesError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{storesError}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={loadStores}
              >
                Reintentar
              </Button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-12">
            <div className="space-y-1.5 sm:col-span-4">
              <Label className="text-xs text-muted-foreground">Tienda</Label>
              {storesLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select value={newStoreId} onValueChange={setNewStoreId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStores.length === 0 ? (
                      <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                        {stores.length === 0
                          ? 'No hay tiendas registradas'
                          : 'Todas las tiendas ya vinculadas'}
                      </div>
                    ) : (
                      availableStores.map((s) => (
                        <SelectItem key={s.store_id} value={s.store_id}>
                          {s.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-5">
              <Label className="text-xs text-muted-foreground">URL del producto</Label>
              <Input
                value={newProductUrl}
                onChange={(e) => setNewProductUrl(e.target.value)}
                placeholder="https://tienda.cl/producto..."
                className="h-9"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-3 flex flex-col">
              <Label className="text-xs text-muted-foreground">Nombre (opcional)</Label>
              <Input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Se autocompleta"
                className="h-9"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={
                !selectedPrintingId || !newStoreId || !newProductUrl.trim() || isAdding
              }
              className="gap-2"
            >
              {isAdding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              Vincular tienda
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {linksError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{linksError}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => setLinksError(null)}
            >
              Cerrar
            </Button>
          </div>
        )}

        {/* Links list */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span className="text-sm font-medium">Links vinculados</span>
            {linksLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {linksLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : links.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <Store className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No hay tiendas vinculadas a esta impresión
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Usa el formulario de arriba para vincular una tienda
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {links.map((l) => (
                  <div
                    key={l.store_printing_link_id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/20"
                  >
                    {/* Store info */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted/40">
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{l.store.name}</span>
                        {l.last_price !== null && (
                          <Badge variant="secondary" className="font-mono text-xs">
                            <DollarSign className="mr-0.5 h-3 w-3" />
                            {formatCLP(l.last_price)}
                          </Badge>
                        )}
                        {l.last_scraped_at && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {relativeTime(l.last_scraped_at)}
                          </span>
                        )}
                      </div>
                      <a
                        href={l.product_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        title={l.product_url}
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{l.product_url}</span>
                      </a>
                      {l.product_name && (
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {l.product_name}
                        </p>
                      )}
                    </div>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(l)}
                      disabled={deletingId === l.store_printing_link_id}
                      title="Eliminar link"
                    >
                      {deletingId === l.store_printing_link_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
