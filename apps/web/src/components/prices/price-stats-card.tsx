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
 * - 2026-02-18: Histórico con ejes X/Y claros, rango semana/mes/año y ticks Y referenciales (redondeados).
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
type SeriesPoint = { t: number; price: number };

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function niceStep(range: number): number {
  if (!Number.isFinite(range) || range <= 0) return 1;
  const rough = range / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const base = rough / pow;
  const stepBase = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return stepBase * pow;
}

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
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month');

  const rangeStart = useMemo(() => {
    const floor = new Date(2026, 0, 1);
    const now = new Date();
    const days = range === 'week' ? 7 : range === 'year' ? 365 : 30;
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    return start < floor ? floor : start;
  }, [range]);

  const boundedHistory = useMemo(() => {
    const floorTs = new Date(2026, 0, 1).getTime();
    return (history ?? []).filter((h) => new Date(h.captured_at).getTime() >= floorTs);
  }, [history]);

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const h of boundedHistory) set.add(h.source_name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [boundedHistory]);

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
    if (!boundedHistory || boundedHistory.length === 0) return null;

    const bySource = new Map<string, CardPriceHistory[]>();
    for (const h of boundedHistory) {
      const arr = bySource.get(h.source_name) ?? [];
      arr.push(h);
      bySource.set(h.source_name, arr);
    }

    const visible = sources.filter((s) => !hiddenSources[s]);
    if (visible.length === 0) return null;

    const minDate = startOfDay(rangeStart);
    const maxDate = startOfDay(new Date());
    const dayCount = Math.max(1, Math.floor((maxDate.getTime() - minDate.getTime()) / 86400000) + 1);
    const days: number[] = Array.from({ length: dayCount }, (_, i) => addDays(minDate, i).getTime());

    const series = visible.map((sourceName) => {
      const ordered = [...(bySource.get(sourceName) ?? [])].sort(
        (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
      );
      if (ordered.length === 0) return null;

      const daily = new Map<string, CardPriceHistory>();
      for (const row of ordered) {
        const dayKey = toDayKey(new Date(row.captured_at));
        const prev = daily.get(dayKey);
        if (!prev || new Date(row.captured_at).getTime() > new Date(prev.captured_at).getTime()) {
          daily.set(dayKey, row);
        }
      }

      const startTs = minDate.getTime();
      const seed = [...ordered].reverse().find((row) => new Date(row.captured_at).getTime() <= startTs) ?? ordered[0];
      let lastKnown: number | null = seed?.price ?? null;

      const points: SeriesPoint[] = days.map((dayTs) => {
        const dayKey = toDayKey(new Date(dayTs));
        const hit = daily.get(dayKey);
        if (hit) lastKnown = hit.price;
        return {
          t: dayTs,
          price: lastKnown ?? 0,
        };
      });

      return { sourceName, points };
    }).filter((s): s is { sourceName: string; points: SeriesPoint[] } => s !== null);

    if (series.length === 0) return null;

    const all = series.flatMap((s) => s.points);
    const tMin = Math.min(...all.map((p) => p.t));
    const tMax = Math.max(...all.map((p) => p.t));
    const timeRange = tMax - tMin || 1;

    const priceMin = Math.min(...all.map((p) => p.price));
    const priceMax = Math.max(...all.map((p) => p.price));
    const priceRange = priceMax - priceMin || 1;
    const step = niceStep(priceRange);
    const yMin = Math.floor(priceMin / step) * step;
    const yMax = Math.ceil(priceMax / step) * step;
    const yRange = yMax - yMin || 1;

    const width = 700;
    const height = 208;
    const padding = { left: 8, right: 8, top: 12, bottom: 24 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const withPolylines = series.map((s) => {
      const color = sourceColors[s.sourceName] ?? '#94a3b8';
      const polyPoints = s.points
        .map((p) => {
          const x = padding.left + ((p.t - tMin) / timeRange) * plotW;
          const y = height - padding.bottom - ((p.price - yMin) / yRange) * plotH;
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

    const yValues = [];
    for (let v = yMin; v <= yMax + step * 0.5; v += step) {
      yValues.push(v);
    }
    const xTickCount = Math.min(7, Math.max(4, Math.round(dayCount / 7) + 1));
    const xTickIndices = Array.from({ length: xTickCount }, (_, i) => {
      if (xTickCount === 1) return 0;
      return Math.round((i / (xTickCount - 1)) * (dayCount - 1));
    });

    return {
      width,
      height,
      tMin,
      tMax,
      priceMin,
      priceMax,
      yMin,
      yMax,
      padding,
      plotW,
      plotH,
      dayCount,
      days,
      yValues,
      xTickIndices,
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
          <div className="rounded-lg border p-3">
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

              <div className="flex flex-wrap items-center gap-1.5">
                {(['week', 'month', 'year'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRange(opt)}
                    className={[
                      'rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors',
                      range === opt ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/30',
                    ].join(' ')}
                  >
                    {opt === 'week' ? 'Semana' : opt === 'month' ? 'Mes' : 'Año'}
                  </button>
                ))}
                <span className="text-[10px] text-muted-foreground">Desde 01/01/2026</span>
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
            <div className="mt-3 grid grid-cols-[72px_minmax(0,1fr)] gap-2">
              <div className="relative h-52">
                {chart.yValues.map((value) => {
                  const y = chart.height - chart.padding.bottom - ((value - chart.yMin) / (chart.yMax - chart.yMin || 1)) * chart.plotH;
                  return (
                    <span
                      key={`y-${value}`}
                      className="absolute right-0 -translate-y-1/2 text-[11px] text-muted-foreground"
                      style={{ top: `${y}px` }}
                    >
                      {formatCLP(Math.round(value))}
                    </span>
                  );
                })}
              </div>
              <div className="relative h-52">
                <svg
                  viewBox={`0 0 ${chart.width} ${chart.height}`}
                  className="h-52 w-full"
                  role="img"
                  aria-label="Histórico de precios por tienda"
                >
                  {chart.yValues.map((value, idx) => {
                    const y = chart.height - chart.padding.bottom - ((value - chart.yMin) / (chart.yMax - chart.yMin || 1)) * chart.plotH;
                    return (
                      <g key={`y-${idx}`}>
                        <line
                          x1={chart.padding.left}
                          y1={y}
                          x2={chart.width - chart.padding.right}
                          y2={y}
                          stroke="currentColor"
                          opacity="0.1"
                        />
                      </g>
                    );
                  })}

                  {chart.xTickIndices.map((idx) => {
                    const t = chart.days[idx] ?? chart.tMin;
                    const x = chart.padding.left + ((t - chart.tMin) / (chart.tMax - chart.tMin || 1)) * chart.plotW;
                    return (
                      <g key={`x-${idx}`}>
                        <line
                          x1={x}
                          y1={chart.padding.top}
                          x2={x}
                          y2={chart.height - chart.padding.bottom}
                          stroke="currentColor"
                          opacity="0.06"
                        />
                        <text
                          x={x}
                          y={chart.height - 6}
                          textAnchor="middle"
                          fontSize="11"
                          fill="currentColor"
                          opacity="0.6"
                        >
                          {formatDayLabel(t)}
                        </text>
                      </g>
                    );
                  })}

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
