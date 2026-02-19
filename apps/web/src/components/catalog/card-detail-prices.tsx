'use client';

/**
 * File: apps/web/src/components/catalog/card-detail-prices.tsx
 * Context: Catálogo → Detalle de carta → Tab de precios.
 * Description: Precios por impresión + tablero comparativo por carta (entre impresiones).
 * Relations:
 * - Stores: `GET /api/v1/prices/:printingId/stores`
 * - Price section: `apps/web/src/components/prices/price-section.tsx`
 * Changelog:
 * - 2026-02-17: Comparativa usa precios de tiendas (no depende de precios comunitarios aprobados).
 */

import { useEffect, useMemo, useState } from 'react';
import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { PriceSection } from '@/components/prices';
import { DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CardDetailPricesProps {
  printings: CardDetail['printings'];
  selectedPrintingId?: string | null;
  onSelectPrinting?: (printingId: string) => void;
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface PriceHistoryItem {
  price: number;
  captured_at: string;
  source_name: string;
}

interface StoreAgg {
  stores_with_price: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  last_scraped_at: string | null;
}

export function CardDetailPrices({
  printings,
  selectedPrintingId,
  onSelectPrinting,
}: CardDetailPricesProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState<string>(printings[0]?.card_printing_id ?? '');
  const [storeAggByPrintingId, setStoreAggByPrintingId] = useState<Record<string, StoreAgg>>({});
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);

  // Check authentication status and get default currency
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const json = await res.json();
        setIsAuthenticated(json.ok && !!json.data?.user);
      } catch {
        setIsAuthenticated(false);
      }
    }

    async function getCurrency() {
      try {
        const res = await fetch('/api/v1/catalog/currencies');
        const json = await res.json();
        if (json.ok && json.data?.currencies) {
          const usd = json.data.currencies.find((c: { code: string }) => c.code === 'USD');
          setDefaultCurrencyId(usd?.currency_id ?? json.data.currencies[0]?.currency_id ?? null);
        }
      } catch {
        // Fallback to hardcoded UUID for USD if API fails
        setDefaultCurrencyId('00000000-0000-0000-0000-000000000001');
      }
    }

    checkAuth();
    getCurrency();
  }, []);

  // Preload aggregated store stats for comparison board (per printing)
  useEffect(() => {
    let cancelled = false;

    async function loadStoreAgg() {
      if (printings.length === 0) {
        setStoreAggByPrintingId({});
        return;
      }

      setIsComparisonLoading(true);
      try {
        const results = await Promise.allSettled(
          printings.map(async (p) => {
            const res = await fetch(`/api/v1/prices/${p.card_printing_id}/history`);
            const json = await res.json();
            const history = (json?.ok ? (json.data?.history as PriceHistoryItem[]) : []) ?? [];

            // Reduce to latest price per source_name to represent "tiendas" in the comparison board.
            const latestBySource = new Map<string, { price: number; captured_at: string }>();
            for (const h of history) {
              const prev = latestBySource.get(h.source_name);
              if (!prev || new Date(h.captured_at).getTime() > new Date(prev.captured_at).getTime()) {
                latestBySource.set(h.source_name, { price: h.price, captured_at: h.captured_at });
              }
            }

            const priced = Array.from(latestBySource.values())
              .map((it) => it.price)
              .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

            const storesWithPrice = priced.length;
            const min = storesWithPrice > 0 ? Math.min(...priced) : null;
            const max = storesWithPrice > 0 ? Math.max(...priced) : null;
            const avg = storesWithPrice > 0 ? priced.reduce((s, v) => s + v, 0) / storesWithPrice : null;

            const lastScraped =
              Array.from(latestBySource.values())
                .map((it) => it.captured_at)
                .filter((v): v is string => typeof v === 'string' && v.length > 0)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

            return {
              id: p.card_printing_id,
              agg: {
                stores_with_price: storesWithPrice,
                min,
                max,
                avg,
                last_scraped_at: lastScraped,
              } satisfies StoreAgg,
            };
          }),
        );

        if (cancelled) return;

        const next: Record<string, StoreAgg> = {};
        for (const r of results) {
          if (r.status === 'fulfilled') next[r.value.id] = r.value.agg;
        }
        setStoreAggByPrintingId(next);
      } finally {
        if (!cancelled) setIsComparisonLoading(false);
      }
    }

    loadStoreAgg();
    return () => {
      cancelled = true;
    };
  }, [printings]);

  const effectiveSelectedId = selectedPrintingId ?? localSelectedId;

  const selected = useMemo(
    () => printings.find((p) => p.card_printing_id === effectiveSelectedId) ?? printings[0] ?? null,
    [printings, effectiveSelectedId],
  );

  if (printings.length === 0) {
    return (
      <div className="py-8 text-center">
        <DollarSign className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No hay reimpresiones disponibles para esta carta.
        </p>
      </div>
    );
  }

  if (!defaultCurrencyId) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Cargando precios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison board */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold">Comparativa por impresión</h3>
            <p className="text-xs text-muted-foreground">
              Compara rápidamente los precios entre reimpresiones. Haz click para seleccionar.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {isComparisonLoading ? 'Cargando…' : `${printings.length} impresiones`}
          </Badge>
        </div>

        <div className="grid gap-1.5">
          {printings.map((p) => {
            const active = p.card_printing_id === effectiveSelectedId;
            const agg = storeAggByPrintingId[p.card_printing_id] ?? null;
            const main = agg?.avg ?? agg?.min ?? null;
            const variantLabel = p.printing_variant?.trim() || 'standard';

            return (
              <button
                key={p.card_printing_id}
                type="button"
                onClick={() => {
                  if (onSelectPrinting) onSelectPrinting(p.card_printing_id);
                  else setLocalSelectedId(p.card_printing_id);
                }}
                className={[
                  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border px-3 py-1.5 text-left transition-colors',
                  active ? 'border-accent/40 bg-accent/5' : 'border-border hover:bg-muted/30',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {editionDisplayName(p.edition.name)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {variantLabel}
                    </Badge>
                    {p.collector_number ? (
                      <span className="text-xs text-muted-foreground font-mono">#{p.collector_number}</span>
                    ) : null}
                    {p.rarity_tier ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {p.rarity_tier.name}
                      </Badge>
                    ) : null}
                  </div>
                  {agg ? (
                    <div className="text-[11px] text-muted-foreground">
                      Tiendas con precio: {agg.stores_with_price}
                      {agg.last_scraped_at ? (
                        <span>
                          {' '}
                          · {new Date(agg.last_scraped_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">
                      {isComparisonLoading ? 'Cargando…' : 'Sin datos históricos'}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {main !== null ? formatCLP(main) : '—'}
                  </div>
                  {agg && agg.min !== null && agg.max !== null ? (
                    <div className="text-[11px] text-muted-foreground">
                      {formatCLP(agg.min)} → {formatCLP(agg.max)}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">{' '}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector */}

      {selected ? (
        <>
          {/* Printing header */}
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold">
              {editionDisplayName(selected.edition.name)}
            </h4>
            {selected.rarity_tier && (
              <Badge variant="secondary" className="text-xs">
                {selected.rarity_tier.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {selected.printing_variant?.trim() || 'standard'}
            </Badge>
          </div>

          {/* Price section (stores + community) */}
          <PriceSection
            cardPrintingId={selected.card_printing_id}
            isAuthenticated={isAuthenticated}
            defaultCurrencyId={defaultCurrencyId}
          />
        </>
      ) : null}
    </div>
  );
}
