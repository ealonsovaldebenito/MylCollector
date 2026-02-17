/**
 * CollectionStatsPanel — Panel lateral de estadísticas de colección.
 * Muestra resumen, valor estimado, distribución por bloque/rareza/condición.
 *
 * Changelog:
 *   2026-02-17 — Creación inicial
 *   2026-02-18 — Mejora: más datos, barras de progreso, valor total, en venta
 *   2026-02-19 — Mejora: valores separados (usuario vs catálogo) y nuevas condiciones locales
 */

'use client';

import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  Layers,
  Star,
  DollarSign,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CollectionStats } from '@myl/shared';

interface CollectionStatsPanelProps {
  stats: CollectionStats | null;
  isLoading: boolean;
  /** Items currently displayed (for live value calculation) */
  items?: Array<Record<string, unknown>>;
  className?: string;
}

const CONDITION_ORDER = [
  'PERFECTA',
  'CASI PERFECTA',
  'EXCELENTE',
  'BUENA',
  'POCO USO',
  'JUGADA',
  'MALAS CONDICIONES',
];
const CONDITION_LABELS: Record<string, string> = {
  PERFECTA: 'Perfecta (9-10)',
  'CASI PERFECTA': 'Casi Perfecta (8)',
  EXCELENTE: 'Excelente (7)',
  BUENA: 'Buena (6)',
  'POCO USO': 'Poco uso (5)',
  JUGADA: 'Jugada (4)',
  'MALAS CONDICIONES': 'Pobre (1-3)',
};
const CONDITION_COLORS: Record<string, string> = {
  PERFECTA: 'bg-emerald-500',
  'CASI PERFECTA': 'bg-green-500',
  EXCELENTE: 'bg-blue-500',
  BUENA: 'bg-amber-500',
  'POCO USO': 'bg-orange-500',
  JUGADA: 'bg-red-500',
  'MALAS CONDICIONES': 'bg-zinc-500',
};

const RARITY_COLORS: Record<string, string> = {
  COMUN: 'bg-zinc-400',
  POCO_COMUN: 'bg-blue-400',
  RARA: 'bg-purple-400',
  ULTRA_RARA: 'bg-amber-400',
  SECRETA: 'bg-yellow-400',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/30 bg-surface-1/30 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn(
        'text-2xl font-bold font-mono',
        accent ? 'text-primary' : 'text-foreground',
      )}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground truncate">{label}</span>
        <span className="font-mono text-muted-foreground ml-2 shrink-0">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass ?? 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CollectionStatsPanel({
  stats,
  isLoading,
  items,
  className,
}: CollectionStatsPanelProps) {
  // Calculate value from items if available
  const {
    userValueCalc,
    storeValueCalc,
    forSaleCount,
    forSaleValue,
  } = useMemo(() => {
    if (!items || items.length === 0) {
      return { userValueCalc: 0, storeValueCalc: 0, forSaleCount: 0, forSaleValue: 0 };
    }
    let uv = 0;
    let sv = 0;
    let fsc = 0;
    let fsv = 0;
    for (const item of items) {
      const userPrice = (item.user_price as number | null) ?? null;
      const storePrice = (item.store_min_price as number | null) ?? null;
      const qty = (item.qty as number) ?? 1;
      if (userPrice != null) uv += userPrice * qty;
      if (storePrice != null) sv += storePrice * qty;
      if (item.is_for_sale) {
        fsc += qty;
        fsv += (userPrice ?? storePrice ?? 0) * qty;
      }
    }
    return { userValueCalc: uv, storeValueCalc: sv, forSaleCount: fsc, forSaleValue: fsv };
  }, [items]);

  const userValue = stats?.total_user_value ?? userValueCalc;
  const storeValue = stats?.total_store_value ?? storeValueCalc;

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  if (!stats) return null;

  const maxBlock = Math.max(...Object.values(stats.by_block).map((b) => b.count), 1);
  const maxRarity = Math.max(...Object.values(stats.by_rarity).map((r) => r.count), 1);
  const maxCondition = Math.max(
    ...Object.values(stats.by_condition).map((c) => (typeof c === 'number' ? c : 0)),
    1,
  );

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">Estadísticas</h2>
      </div>

      {/* Main stat cards */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Package}
          label="Cartas"
          value={stats.total_cards}
          sub={`${stats.total_printings} impresiones`}
        />
        <StatCard
          icon={Star}
          label="Únicas"
          value={stats.total_unique_cards}
        />
        {userValue > 0 && (
          <StatCard
            icon={DollarSign}
            label="Valor (mi precio)"
            value={`$${Math.round(userValue).toLocaleString('es-CL')}`}
            accent
            sub="Venta estimada"
          />
        )}
        {storeValue > 0 && (
          <StatCard
            icon={TrendingUp}
            label="Valor catálogo"
            value={`$${Math.round(storeValue).toLocaleString('es-CL')}`}
            sub="Precio tienda"
          />
        )}
        {forSaleCount > 0 && (
          <StatCard
            icon={ShoppingCart}
            label="En venta"
            value={forSaleCount}
            sub={forSaleValue > 0 ? `$${Math.round(forSaleValue).toLocaleString('es-CL')}` : undefined}
          />
        )}
      </div>

      {(userValue > 0 || storeValue > 0) && (
        <div className="rounded-lg border border-border/40 bg-gradient-to-br from-surface-1/60 via-surface-1 to-surface-2/80 p-3 space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            Comparativa valor
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/80">Mi precio</span>
            <span className="font-mono font-semibold text-primary">
              ${Math.round(userValue).toLocaleString('es-CL')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/80">Catálogo</span>
            <span className="font-mono font-semibold text-muted-foreground">
              ${Math.round(storeValue).toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      )}

      {/* By block */}
      {Object.keys(stats.by_block).length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Por Bloque
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.by_block)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([blockId, data]) => (
                <ProgressBar
                  key={blockId}
                  label={data.block_name}
                  value={data.count}
                  max={maxBlock}
                  colorClass="bg-primary/70"
                />
              ))}
          </div>
        </div>
      )}

      {/* By rarity */}
      {Object.keys(stats.by_rarity).length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Por Rareza
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.by_rarity)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([rarityId, data]) => (
                <ProgressBar
                  key={rarityId}
                  label={data.rarity_name}
                  value={data.count}
                  max={maxRarity}
                  colorClass={RARITY_COLORS[
                    Object.entries(RARITY_COLORS).find(([k]) =>
                      data.rarity_name.toUpperCase().includes(k.replace('_', ' '))
                    )?.[0] ?? ''
                  ] ?? 'bg-primary/60'}
                />
              ))}
          </div>
        </div>
      )}

      {/* By condition */}
      {Object.keys(stats.by_condition).length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Por Condición
          </h3>
          <div className="space-y-2">
            {CONDITION_ORDER
              .filter((code) => stats.by_condition[code as keyof typeof stats.by_condition] != null)
              .map((code) => {
                const count = stats.by_condition[code as keyof typeof stats.by_condition] ?? 0;
                return (
                  <ProgressBar
                    key={code}
                    label={CONDITION_LABELS[code] ?? code}
                    value={count}
                    max={maxCondition}
                    colorClass={CONDITION_COLORS[code]}
                  />
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
