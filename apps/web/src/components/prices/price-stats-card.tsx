'use client';

/**
 * File: apps/web/src/components/prices/price-stats-card.tsx
 * Context: Precios → tab "Histórico" (por impresión).
 * Description: Gráfico histórico multi-serie por tienda/fuente con leyenda + toggles.
 * Relations:
 * - History API: `GET /api/v1/prices/:printingId/history`
 * - Hook: `apps/web/src/hooks/use-prices.ts` → `usePriceHistory`
 * Changelog:
 * - 2026-02-17: Gráfico por tienda (toggle show/hide) y funciona aunque no existan precios comunitarios aprobados.
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CardPriceHistory, PriceStats } from '@myl/shared';
import { Activity, BarChart3, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { usePriceHistory } from '@/hooks/use-prices';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPrice(value: number, currencyCode: string): string {
  if (currencyCode === 'CLP') return formatCLP(value);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}

interface PriceStatsCardProps {
  cardPrintingId: string;
  stats: PriceStats | null;
  isLoading: boolean;
}

type HistoryPoint = { t: number; price: number; captured_at: string };

const SERIES_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#14b8a6',
  '#f97316',
  '#22c55e',
  '#06b6d4',
  '#e11d48',
];

export function PriceStatsCard({ cardPrintingId, stats, isLoading }: PriceStatsCardProps) {
  const { history, isLoading: isHistoryLoading } = usePriceHistory(cardPrintingId);
  const [hiddenSources, setHiddenSources] = useState<Record<string, boolean>>({});

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const h of history ?? []) set.add(h.source_name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [history]);

  const sourceColors = useMemo(() => {
    const map: Record<string, string> = {};
    sources.forEach((s, idx) => {
      map[s] = SERIES_COLORS[idx % SERIES_COLORS.length]!;
    });
    return map;
  }, [sources]);

  useEffect(() => {
    setHiddenSources((prev) => {
      const next = { ...prev };
      for (const s of sources) {
        if (next[s] === undefined) next[s] = false;
      }
      return next;
    });
  }, [sources]);

  const chart = useMemo(() => {
    if (!history || history.length < 2) return null;

    const bySource = new Map<string, CardPriceHistory[]>();
    for (const h of history) {
      const arr = bySource.get(h.source_name) ?? [];
      arr.push(h);
      bySource.set(h.source_name, arr);
    }

    const visible = sources.filter((s) => !hiddenSources[s]);
    if (visible.length === 0) return null;

    const series = visible.map((sourceName) => {
      const ordered = [...(bySource.get(sourceName) ?? [])].sort(
        (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
      );
      const points: HistoryPoint[] = ordered.map((p) => ({
        t: new Date(p.captured_at).getTime(),
        price: p.price,
        captured_at: p.captured_at,
      }));
      return { sourceName, points };
    });

    const all = series.flatMap((s) => s.points);
    const tMin = Math.min(...all.map((p) => p.t));
    const tMax = Math.max(...all.map((p) => p.t));
    const timeRange = tMax - tMin || 1;

    const priceMin = Math.min(...all.map((p) => p.price));
    const priceMax = Math.max(...all.map((p) => p.price));
    const priceRange = priceMax - priceMin || 1;

    const width = 560;
    const height = 160;
    const padding = 12;

    const withPolylines = series.map((s) => {
      const color = sourceColors[s.sourceName] ?? '#94a3b8';
      const polyPoints = s.points
        .map((p) => {
          const x = padding + ((p.t - tMin) / timeRange) * (width - padding * 2);
          const y = height - padding - ((p.price - priceMin) / priceRange) * (height - padding * 2);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

      const prices = s.points.map((p) => p.price);
      const sMin = Math.min(...prices);
      const sMax = Math.max(...prices);
      const last = s.points[s.points.length - 1] ?? null;

      return {
        sourceName: s.sourceName,
        color,
        polyPoints,
        count: s.points.length,
        min: sMin,
        max: sMax,
        lastPrice: last?.price ?? null,
      };
    });

    return {
      width,
      height,
      tMin,
      tMax,
      priceMin,
      priceMax,
      series: withPolylines,
    };
  }, [history, hiddenSources, sourceColors, sources]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de precios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de precios</CardTitle>
        <CardDescription>
          Precios de tiendas por fuente (puedes ocultar/mostrar tiendas en la leyenda).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Histórico (tiendas)</p>
                <p className="text-sm font-semibold text-foreground">
                  {chart ? formatCLP(chart.priceMax) : isHistoryLoading ? 'Cargando…' : 'Sin datos'}
                </p>
              </div>
            </div>

            {chart ? (
              <div className="text-xs text-muted-foreground">
                {formatCLP(chart.priceMin)} → {formatCLP(chart.priceMax)}
              </div>
            ) : null}
          </div>

          {sources.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((s) => {
                const hidden = !!hiddenSources[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHiddenSources((prev) => ({ ...prev, [s]: !prev[s] }))}
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors',
                      hidden ? 'border-border text-muted-foreground bg-muted/20' : 'border-border hover:bg-muted/30',
                    ].join(' ')}
                    title={hidden ? 'Mostrar tienda' : 'Ocultar tienda'}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: hidden ? '#94a3b8' : (sourceColors[s] ?? '#94a3b8') }}
                    />
                    <span className="max-w-[220px] truncate">{s}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {chart ? (
            <div className="mt-3">
              <svg
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                className="h-40 w-full"
                role="img"
                aria-label="Histórico de precios por tienda"
              >
                {chart.series.map((s) => (
                  <polyline
                    key={s.sourceName}
                    points={s.polyPoints}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={hiddenSources[s.sourceName] ? 0.15 : 1}
                  />
                ))}
              </svg>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(chart.tMin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
                <span>
                  {new Date(chart.tMax).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ) : isHistoryLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Cargando histórico…</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Sin datos históricos de tiendas.</p>
          )}
        </div>

        {!stats || stats.avg_price === null ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Sin precios comunitarios aprobados aún (el histórico de tiendas igual se muestra arriba).
          </div>
        ) : null}

        {stats && stats.consensus_price !== null ? (
          <div className="flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Precio consenso</p>
                <p className="text-2xl font-bold">{formatPrice(stats.consensus_price, stats.currency_code)}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{stats.currency_code}</span>
          </div>
        ) : null}

        {stats && stats.avg_price !== null ? (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Precio promedio (comunidad)</p>
                <p className="text-xl font-bold">{formatPrice(stats.avg_price, stats.currency_code)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {stats && stats.min_price !== null && stats.max_price !== null ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-full bg-green-100 p-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mínimo (comunidad)</p>
                <p className="text-lg font-bold">{formatPrice(stats.min_price, stats.currency_code)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-full bg-red-100 p-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Máximo (comunidad)</p>
                <p className="text-lg font-bold">{formatPrice(stats.max_price, stats.currency_code)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {stats?.last_updated ? (
          <p className="text-center text-xs text-muted-foreground">
            Última actualización (comunidad):{' '}
            {new Date(stats.last_updated).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
