'use client';

import type { DeckComputedStats } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Coins, PieChart, Sigma } from 'lucide-react';

interface BuilderStatsPanelProps {
  stats: DeckComputedStats | null;
}

function sortedNumericHistogramEntries(hist: Record<string, number>): Array<[string, number]> {
  return Object.entries(hist).sort(([a], [b]) => {
    if (a === 'N/A') return 1;
    if (b === 'N/A') return -1;
    return Number(a) - Number(b);
  });
}

export function BuilderStatsPanel({ stats }: BuilderStatsPanelProps) {
  const hasStats = !!stats && stats.total_cards > 0;

  const costEntries = hasStats ? sortedNumericHistogramEntries(stats.cost_histogram ?? {}) : [];
  const goldEntries = hasStats && stats.gold_histogram ? sortedNumericHistogramEntries(stats.gold_histogram) : [];

  const maxCostQty = hasStats ? Math.max(...Object.values(stats.cost_histogram ?? {}), 1) : 1;
  const maxGoldQty = hasStats && stats.gold_histogram ? Math.max(...Object.values(stats.gold_histogram), 1) : 1;

  const typeEntries = hasStats
    ? Object.entries(stats.type_distribution ?? {}).sort(([, a], [, b]) => b - a)
    : [];
  const raceEntries = hasStats
    ? Object.entries(stats.race_distribution ?? {}).sort(([, a], [, b]) => b - a)
    : [];
  const rarityEntries = hasStats
    ? Object.entries(stats.rarity_distribution ?? {}).sort(([, a], [, b]) => b - a)
    : [];

  const avgCostByTypeEntries = hasStats && stats.avg_cost_by_type
    ? Object.entries(stats.avg_cost_by_type).sort(([, a], [, b]) => b.qty - a.qty)
    : [];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        {!hasStats ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/10 py-8 text-center">
            <BarChart3 className="mb-2 h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Sin estadísticas aún</p>
          </div>
        ) : null}

        {hasStats ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="bg-gradient-to-br from-muted/20 to-background">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Sigma className="h-3.5 w-3.5" />
                  Total
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-semibold">{stats.total_cards}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Cartas en el mazo</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Coste promedio
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-semibold">{stats.avg_cost ?? '—'}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Sin contar Oro</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-background">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Coins className="h-3.5 w-3.5" />
                  Oro promedio
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-semibold">{stats.avg_gold_value ?? '—'}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Valor de Oro (si aplica)</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {hasStats ? (
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Curva de coste</span>
                <Badge variant="secondary" className="ml-auto h-5 text-[10px]">
                  Sin Oro
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-1.5">
                {costEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay datos para graficar.</p>
                ) : (
                  costEntries.map(([cost, qty]) => {
                    const percentage = (qty / maxCostQty) * 100;
                    return (
                      <div key={cost} className="flex items-center gap-2">
                        <span className="w-8 text-[11px] font-mono text-muted-foreground">
                          {cost === 'N/A' ? '—' : cost}
                        </span>
                        <div className="relative h-4 flex-1 overflow-hidden rounded-md bg-muted">
                          <div className="h-full bg-primary/70 transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="w-7 text-right text-[11px] font-mono font-semibold">{qty}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}


        {hasStats ? (
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Distribución por tipo</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2">
                {typeEntries.map(([type, qty]) => {
                  const percentage = (qty / stats.total_cards) * 100;
                  return (
                    <div key={type} className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-medium">{type}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {qty} · {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary/60" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {hasStats && avgCostByTypeEntries.length > 0 ? (
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Coste promedio por tipo</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-1.5">
                {avgCostByTypeEntries.map(([type, agg]) => (
                  <div key={type} className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{type}</span>
                    <span className="flex-shrink-0 text-[11px] font-mono text-muted-foreground">
                      avg:{agg.avg ?? '—'} · qty:{agg.qty}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {hasStats && raceEntries.length > 0 ? (
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Distribución por raza</span>
                <Badge variant="outline" className="ml-auto h-5 text-[10px]">
                  Solo Aliados
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {raceEntries.map(([race, qty]) => (
                  <Badge key={race} variant="secondary" className="h-5 text-[10px]">
                    {race}: {qty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {hasStats && rarityEntries.length > 0 ? (
          <Card>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Distribución por rareza</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex flex-wrap gap-1.5">
                {rarityEntries.map(([rarity, qty]) => (
                  <Badge key={rarity} variant="outline" className="h-5 text-[10px]">
                    {rarity}: {qty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </ScrollArea>
  );
}
