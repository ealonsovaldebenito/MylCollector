'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Layers, Star, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollectionStats } from '@myl/shared';

interface CollectionStatsPanelProps {
  stats: CollectionStats | null;
  isLoading: boolean;
  className?: string;
}

const CONDITION_LABELS: Record<string, string> = {
  MINT: 'Mint',
  NEAR_MINT: 'Near Mint',
  EXCELLENT: 'Excelente',
  GOOD: 'Buena',
  LIGHT_PLAYED: 'Poco Jugada',
  PLAYED: 'Jugada',
  POOR: 'Pobre',
};

export function CollectionStatsPanel({ stats, isLoading, className }: CollectionStatsPanelProps) {
  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Estadísticas de Colección</h2>
          <p className="text-sm text-muted-foreground mt-1">Resumen general de tu inventario</p>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Total de cartas</span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">{stats.total_cards}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span>Impresiones únicas</span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">{stats.total_printings}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>Cartas únicas</span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">{stats.total_unique_cards}</p>
          </div>
        </div>

        {/* By block */}
        {Object.keys(stats.by_block).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Por Bloque</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_block)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([blockId, data]) => (
                  <div key={blockId} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{data.block_name}</span>
                    <Badge variant="secondary" className="font-mono">
                      {data.count}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* By rarity */}
        {Object.keys(stats.by_rarity).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Por Rareza</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_rarity)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([rarityId, data]) => (
                  <div key={rarityId} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{data.rarity_name}</span>
                    <Badge variant="secondary" className="font-mono">
                      {data.count}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* By condition */}
        {Object.keys(stats.by_condition).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Por Condición
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.by_condition)
                .sort((a, b) => b[1] - a[1])
                .map(([condition, count]) => (
                  <div key={condition} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {CONDITION_LABELS[condition] ?? condition}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {count}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
