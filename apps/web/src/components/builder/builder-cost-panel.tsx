/**
 * File: apps/web/src/components/builder/builder-cost-panel.tsx
 *
 * BuilderCostPanel — Calcula el costeo del mazo usando precios por impresión.
 *
 * Relaciones:
 * - Consume `DeckCardSlot[]` desde `useDeckBuilder` vía `BuilderWorkspace`.
 * - Precio principal: POST `/api/v1/prices/consensus` (bulk por `card_printing_id`).
 *
 * Bugfixes / Notas:
 * - Adaptado al modelo “por copia”: agrega cantidades por `card_printing_id` para tablas y totales.
 *
 * Changelog:
 * - 2026-02-17 — Fix: costeo por copia + agregación por impresión.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DeckCardSlot } from '@/hooks/use-deck-builder';
import { DollarSign, Loader2 } from 'lucide-react';

type PriceRow = {
  card_printing_id: string;
  consensus_price: number;
  currency_code: string;
  currency_symbol: string;
  computed_at: string;
};

interface BuilderCostPanelProps {
  cards: DeckCardSlot[];
}

function formatMoney(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: currencyCode }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}

export function BuilderCostPanel({ cards }: BuilderCostPanelProps) {
  const [prices, setPrices] = useState<Map<string, PriceRow>>(new Map());
  const [storeAvg, setStoreAvg] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const printingIds = useMemo(
    () => Array.from(new Set(cards.map((c) => c.card_printing_id))).filter(Boolean),
    [cards],
  );

  useEffect(() => {
    if (printingIds.length === 0) {
      setPrices(new Map());
      setStoreAvg(new Map());
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/v1/prices/consensus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printing_ids: printingIds }),
          signal: ctrl.signal,
        });
        const json = await res.json();
        if (!json.ok) {
          setPrices(new Map());
          setStoreAvg(new Map());
          return;
        }

        const next = new Map<string, PriceRow>();
        for (const row of (json.data.items ?? []) as PriceRow[]) {
          next.set(row.card_printing_id, row);
        }
        setPrices(next);

        // Fallback: promedio de tiendas para impresiones sin consenso
        const consensusIds = new Set<string>(Array.from(next.keys()));
        const missing = printingIds.filter((id) => !consensusIds.has(id));
        if (missing.length === 0) {
          setStoreAvg(new Map());
          return;
        }

        type StoreLinkRow = { last_price: number | null };
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const sRes = await fetch(`/api/v1/prices/${id}/stores`, { signal: ctrl.signal });
              const sJson = await sRes.json();
              if (!sJson.ok) return { id, avg: null as number | null };
              const items = (sJson.data.items ?? []) as StoreLinkRow[];
              const prices = items
                .map((x) => x.last_price)
                .filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
              if (prices.length === 0) return { id, avg: null as number | null };
              const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
              return { id, avg };
            } catch {
              return { id, avg: null as number | null };
            }
          }),
        );

        const nextStore = new Map<string, number>();
        for (const r of results) {
          if (r.avg != null) nextStore.set(r.id, r.avg);
        }
        setStoreAvg(nextStore);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [printingIds]);

  const computed = useMemo(() => {
    const qtyByPrinting = new Map<string, { sample: DeckCardSlot; qty: number }>();
    for (const slot of cards) {
      const existing = qtyByPrinting.get(slot.card_printing_id);
      if (existing) existing.qty += 1;
      else qtyByPrinting.set(slot.card_printing_id, { sample: slot, qty: 1 });
    }

    const lines = Array.from(qtyByPrinting.values()).map(({ sample, qty }) => {
      const price = prices.get(sample.card_printing_id) ?? null;
      const fallback = storeAvg.get(sample.card_printing_id) ?? null;
      const unit = price?.consensus_price ?? fallback ?? null;
      const currencyCode = price?.currency_code ?? (fallback != null ? 'CLP' : null);
      const total = unit == null ? null : unit * qty;
      return {
        card_printing_id: sample.card_printing_id,
        name: sample.card.name,
        typeCode: sample.card.card_type.code,
        typeName: sample.card.card_type.name,
        qty,
        unit,
        total,
        currencyCode,
        source: price?.consensus_price != null ? 'CONSENSUS' : fallback != null ? 'STORE_AVG' : null,
      };
    });

    const totalsByCurrency = new Map<string, number>();
    const qtyByCurrency = new Map<string, number>();
    const missing = { count: 0 };

    const byType = new Map<string, Map<string, { typeName: string; qty: number; total: number }>>();

    for (const line of lines) {
      if (line.unit == null || line.total == null || !line.currencyCode) {
        missing.count += 1;
        continue;
      }

      totalsByCurrency.set(
        line.currencyCode,
        (totalsByCurrency.get(line.currencyCode) ?? 0) + line.total,
      );
      qtyByCurrency.set(line.currencyCode, (qtyByCurrency.get(line.currencyCode) ?? 0) + line.qty);

      const currencyTypeMap = byType.get(line.currencyCode) ?? new Map();
      const typeAgg = currencyTypeMap.get(line.typeCode) ?? {
        typeName: line.typeName,
        qty: 0,
        total: 0,
      };
      typeAgg.qty += line.qty;
      typeAgg.total += line.total;
      currencyTypeMap.set(line.typeCode, typeAgg);
      byType.set(line.currencyCode, currencyTypeMap);
    }

    const avgByCurrency = new Map<string, number>();
    for (const [code, total] of totalsByCurrency.entries()) {
      const qty = qtyByCurrency.get(code) ?? 0;
      avgByCurrency.set(code, qty > 0 ? total / qty : 0);
    }

    return {
      lines,
      missingCount: missing.count,
      totalsByCurrency,
      avgByCurrency,
      byType,
    };
  }, [cards, prices, storeAvg]);

  if (cards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/10 py-10 text-center">
        <DollarSign className="mb-2 h-6 w-6 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Agrega cartas para ver el costeo.</p>
      </div>
    );
  }

  const currencies = Array.from(computed.totalsByCurrency.keys()).sort();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-background">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" />
                Total
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando…
                </div>
              ) : currencies.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin precios</div>
              ) : (
                <div className="space-y-1">
                  {currencies.map((code) => (
                    <div key={code} className="text-lg font-semibold">
                      {formatMoney(computed.totalsByCurrency.get(code) ?? 0, code)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{code}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-1 text-[11px] text-muted-foreground">Prioridad: Consenso comunidad → Promedio tiendas</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-muted/20 to-background">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                Promedio por carta
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {currencies.length === 0 ? (
                <div className="text-sm text-muted-foreground">—</div>
              ) : (
                <div className="space-y-1">
                  {currencies.map((code) => (
                    <div key={code} className="text-lg font-semibold">
                      {formatMoney(computed.avgByCurrency.get(code) ?? 0, code)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{code}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-1 text-[11px] text-muted-foreground">Incluye cantidades</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-background">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                Cobertura
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-semibold">
                {Math.max(cards.length - computed.missingCount, 0)}/{cards.length}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Impresiones con precio disponible
              </div>
            </CardContent>
          </Card>
        </div>

        {currencies.map((code) => {
          const currencyTypeMap = computed.byType.get(code) ?? new Map();
          const typeRows = Array.from(currencyTypeMap.entries())
            .map(([typeCode, agg]) => ({ typeCode, ...agg }))
            .sort((a, b) => b.total - a.total);

          return (
            <Card key={code}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Costeo por tipo</span>
                  <span className="text-[11px] text-muted-foreground">{code}</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {typeRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay datos de precios.</p>
                ) : (
                  <div className="space-y-2">
                    {typeRows.map((row) => {
                      const total = computed.totalsByCurrency.get(code) ?? 1;
                      const pct = total > 0 ? (row.total / total) * 100 : 0;
                      return (
                        <div key={row.typeCode} className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-medium">{row.typeName}</span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {formatMoney(row.total, code)} · {row.qty}x
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-emerald-500/60" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Detalle</span>
              {isLoading ? <span className="text-[11px] text-muted-foreground">Actualizando…</span> : null}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="overflow-hidden rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carta</TableHead>
                    <TableHead className="w-[64px] text-right">Qty</TableHead>
                    <TableHead className="w-[120px] text-right">Unit</TableHead>
                    <TableHead className="w-[140px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.lines
                    .slice()
                    .sort((a, b) => (b.total ?? -1) - (a.total ?? -1))
                    .slice(0, 60)
                    .map((line) => (
                      <TableRow key={line.card_printing_id}>
                        <TableCell className="min-w-0">
                          <div className="truncate text-xs font-medium">{line.name}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{line.typeName}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{line.qty}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {line.unit == null || !line.currencyCode ? (
                            '—'
                          ) : (
                            <div className="flex flex-col items-end leading-tight">
                              <span>{formatMoney(line.unit, line.currencyCode)}</span>
                              <span className="text-[10px] font-normal text-muted-foreground">
                                {line.source === 'CONSENSUS' ? 'consenso' : line.source === 'STORE_AVG' ? 'tiendas' : ''}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {line.total == null || !line.currencyCode
                            ? '—'
                            : formatMoney(line.total, line.currencyCode)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Se muestran hasta 60 filas. Las cartas sin precio aparecen como "—".</p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
