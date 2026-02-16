'use client';

import type { DeckComputedStats } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, PieChart } from 'lucide-react';

interface BuilderStatsPanelProps {
  stats: DeckComputedStats | null;
}

export function BuilderStatsPanel({ stats }: BuilderStatsPanelProps) {
  if (!stats || stats.total_cards === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BarChart3 className="mb-2 h-6 w-6 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">
          Sin estadisticas aun
        </p>
      </div>
    );
  }

  const costEntries = Object.entries(stats.cost_histogram).sort(([a], [b]) => {
    if (a === 'N/A') return 1;
    if (b === 'N/A') return -1;
    return Number(a) - Number(b);
  });

  const maxCostQty = Math.max(...Object.values(stats.cost_histogram), 1);

  const typeEntries = Object.entries(stats.type_distribution).sort(([, a], [, b]) => b - a);
  const raceEntries = Object.entries(stats.race_distribution).sort(([, a], [, b]) => b - a);
  const rarityEntries = Object.entries(stats.rarity_distribution).sort(([, a], [, b]) => b - a);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
        {/* Cost curve */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Curva de coste</span>
          </div>
          <div className="space-y-1">
            {costEntries.map(([cost, qty]) => {
              const percentage = (qty / maxCostQty) * 100;
              return (
                <div key={cost} className="flex items-center gap-2">
                  <span className="w-6 text-[10px] font-mono text-muted-foreground">
                    {cost === 'N/A' ? '--' : cost}
                  </span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                    <div
                      className="h-full bg-primary/70 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-[10px] font-mono font-bold">{qty}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type distribution */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">Distribucion por tipo</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {typeEntries.map(([type, qty]) => (
              <Badge key={type} variant="secondary" className="h-5 text-[10px]">
                {type}: {qty}
              </Badge>
            ))}
          </div>
        </div>

        {/* Race distribution */}
        {raceEntries.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">Distribucion por raza</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {raceEntries.map(([race, qty]) => (
                <Badge key={race} variant="outline" className="h-5 text-[10px]">
                  {race}: {qty}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rarity distribution */}
        {rarityEntries.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">Distribucion por rareza</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {rarityEntries.map(([rarity, qty]) => (
                <Badge key={rarity} variant="outline" className="h-5 text-[10px]">
                  {rarity}: {qty}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
