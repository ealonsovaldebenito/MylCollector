'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriceStats } from '@myl/shared';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface PriceStatsCardProps {
  stats: PriceStats | null;
  isLoading: boolean;
}

export function PriceStatsCard({ stats, isLoading }: PriceStatsCardProps) {
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
        {/* Consensus price */}
        {stats.consensus_price !== null && (
          <div className="flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Precio consenso</p>
                <p className="text-2xl font-bold">${stats.consensus_price.toFixed(2)}</p>
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
                <p className="text-xl font-bold">${stats.avg_price.toFixed(2)}</p>
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
                <p className="text-lg font-bold">${stats.min_price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="rounded-full bg-red-100 p-2">
                <TrendingUp className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Máximo</p>
                <p className="text-lg font-bold">${stats.max_price.toFixed(2)}</p>
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
