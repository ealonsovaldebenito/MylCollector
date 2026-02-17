'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriceStats } from '@myl/shared';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';
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
  stats: PriceStats | null;
  isLoading: boolean;
}

export function PriceStatsCard({ stats, isLoading }: PriceStatsCardProps) {
  const cardPrintingId = stats?.card_printing_id ?? null;
  const { history, isLoading: isHistoryLoading } = usePriceHistory(cardPrintingId);

  const historyChart = useMemo(() => {
    if (!history || history.length < 2) return null;

    const ordered = [...history].sort(
      (a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
    );

    const prices = ordered.map((h) => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const width = 220;
    const height = 44;
    const padding = 4;

    const points = ordered
      .map((h, idx) => {
        const x = padding + (idx / (ordered.length - 1)) * (width - padding * 2);
        const t = (h.price - min) / range;
        const y = height - padding - t * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return {
      points,
      min,
      max,
      first: prices[0]!,
      last: prices[prices.length - 1]!,
      startAt: ordered[0]!.captured_at,
      endAt: ordered[ordered.length - 1]!.captured_at,
      width,
      height,
    };
  }, [history]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de precio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.avg_price === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de precio</CardTitle>
          <CardDescription>
            No hay precios aprobados aún. Envía un precio o vota en los existentes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas de precio</CardTitle>
        <CardDescription>
          Basado en {stats.submission_count} {stats.submission_count === 1 ? 'envío' : 'envíos'} de la comunidad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price history */}
        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Histórico (tiendas)</p>
                <p className="text-sm font-semibold text-foreground">
                  {historyChart
                    ? formatPrice(historyChart.last, stats.currency_code)
                    : isHistoryLoading
                      ? 'Cargando…'
                      : 'Sin datos'}
                </p>
              </div>
            </div>

            {historyChart ? (
              <div className="text-xs text-muted-foreground">
                {formatPrice(historyChart.min, stats.currency_code)} → {formatPrice(historyChart.max, stats.currency_code)}
              </div>
            ) : null}
          </div>

          {historyChart ? (
            <div className="mt-3">
              <svg
                viewBox={`0 0 ${historyChart.width} ${historyChart.height}`}
                className="h-12 w-full"
                role="img"
                aria-label="Histórico de precios"
              >
                <polyline
                  points={historyChart.points}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(historyChart.startAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                <span>{new Date(historyChart.endAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Consensus price */}
        {stats.consensus_price !== null && (
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
        )}

        {/* Average price */}
        {stats.avg_price !== null && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Precio promedio</p>
                <p className="text-xl font-bold">{formatPrice(stats.avg_price, stats.currency_code)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Min/Max prices */}
        {stats.min_price !== null && stats.max_price !== null && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-full bg-green-100 p-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mínimo</p>
                <p className="text-lg font-bold">{formatPrice(stats.min_price, stats.currency_code)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-full bg-red-100 p-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Máximo</p>
                <p className="text-lg font-bold">{formatPrice(stats.max_price, stats.currency_code)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Last updated */}
        {stats.last_updated && (
          <p className="text-center text-xs text-muted-foreground">
            Última actualización: {new Date(stats.last_updated).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
