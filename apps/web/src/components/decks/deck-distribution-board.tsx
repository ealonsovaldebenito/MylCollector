/**
 * File: apps/web/src/components/decks/deck-distribution-board.tsx
 *
 * DeckDistributionBoard - Shareable board for deck visual distribution.
 *
 * Changelog:
 * - 2026-02-18: Initial version.
 * - 2026-02-18: Refined layout and theme-aligned styling.
 * - 2026-02-18: UX cleanup: removed "Otros" bucket, hid zero-value stats/rows, excluded Oro cards from cost curve.
 */

'use client';

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  Coins,
  Gem,
  Mountain,
  Shield,
  Star,
  Sword,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { cn } from '@/lib/utils';

export interface DeckDistributionCard {
  id: string;
  name: string;
  qty: number;
  cost: number | null;
  typeCode?: string | null;
  typeName?: string | null;
  imageUrl: string | null;
  isStartingGold?: boolean;
  isKeyCard?: boolean;
}

interface DeckDistributionBoardProps {
  deckName: string;
  formatLabel?: string | null;
  authorLabel?: string | null;
  updatedAt?: string | null;
  cards: DeckDistributionCard[];
  className?: string;
}

type TypeBucket = 'ally' | 'weapon' | 'totem' | 'talisman' | 'gold';
type CurveBucket = '0' | '1' | '2' | '3' | '4' | '5' | '6+';

const CURVE_BUCKETS: CurveBucket[] = ['0', '1', '2', '3', '4', '5', '6+'];
const TYPE_ORDER: TypeBucket[] = ['ally', 'weapon', 'totem', 'talisman', 'gold'];

const TYPE_META: Record<TypeBucket, { label: string; icon: LucideIcon }> = {
  ally: { label: 'Aliado', icon: Users },
  weapon: { label: 'Arma', icon: Sword },
  totem: { label: 'Totem', icon: Mountain },
  talisman: { label: 'Talisman', icon: Gem },
  gold: { label: 'Oro', icon: Coins },
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveTypeBucket(typeCode?: string | null, typeName?: string | null): TypeBucket | null {
  const raw = normalizeText(`${typeCode ?? ''} ${typeName ?? ''}`);
  if (raw.includes('ally') || raw.includes('aliado')) return 'ally';
  if (raw.includes('weapon') || raw.includes('arma')) return 'weapon';
  if (raw.includes('totem')) return 'totem';
  if (raw.includes('talisman')) return 'talisman';
  if (raw.includes('gold') || raw.includes('oro')) return 'gold';
  return null;
}

function resolveCurveBucket(cost: number | null): CurveBucket | null {
  if (typeof cost !== 'number' || Number.isNaN(cost)) return null;
  if (cost >= 6) return '6+';
  const safe = Math.max(0, Math.min(5, Math.floor(cost)));
  return String(safe) as CurveBucket;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return null;
  }
}

export function DeckDistributionBoard({
  deckName,
  formatLabel,
  authorLabel,
  updatedAt,
  cards,
  className,
}: DeckDistributionBoardProps) {
  const normalizedCards = useMemo(() => {
    return cards
      .map((card) => {
        const safeQty = Math.max(0, Math.floor(card.qty ?? 0));
        const effectiveQty = Math.max(0, safeQty - (card.isStartingGold ? 1 : 0));
        return { ...card, qty: effectiveQty };
      })
      .filter((card) => card.qty > 0)
      .sort((a, b) => {
        const ca = a.cost ?? 999;
        const cb = b.cost ?? 999;
        if (ca !== cb) return ca - cb;
        return a.name.localeCompare(b.name, 'es');
      });
  }, [cards]);

  const totals = useMemo(() => {
    let totalCopies = 0;
    let keyCopies = 0;
    for (const card of normalizedCards) {
      totalCopies += card.qty;
      if (card.isKeyCard) keyCopies += card.qty;
    }
    return {
      totalCopies,
      uniqueCards: normalizedCards.length,
      keyCopies,
    };
  }, [normalizedCards]);

  const typeCounts = useMemo(() => {
    const counts: Record<TypeBucket, number> = {
      ally: 0,
      weapon: 0,
      totem: 0,
      talisman: 0,
      gold: 0,
    };
    for (const card of normalizedCards) {
      const bucket = resolveTypeBucket(card.typeCode, card.typeName);
      if (!bucket) continue;
      counts[bucket] += card.qty;
    }
    return counts;
  }, [normalizedCards]);

  const curve = useMemo(() => {
    const counts: Record<CurveBucket, number> = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6+': 0,
    };

    let naCount = 0;
    for (const card of normalizedCards) {
      // Los oros suelen tener coste 0 y ensucian la curva de coste real.
      if (resolveTypeBucket(card.typeCode, card.typeName) === 'gold') continue;
      const bucket = resolveCurveBucket(card.cost);
      if (!bucket) {
        naCount += card.qty;
        continue;
      }
      counts[bucket] += card.qty;
    }

    const max = Math.max(...Object.values(counts), 1);
    return { counts, naCount, max };
  }, [normalizedCards]);

  const keyHighlights = useMemo(() => {
    return normalizedCards
      .filter((card) => card.isKeyCard)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [normalizedCards]);

  const maxTypeCount = Math.max(...TYPE_ORDER.map((bucket) => typeCounts[bucket]), 1);
  const visibleTypeBuckets = TYPE_ORDER.filter((bucket) => typeCounts[bucket] > 0);
  const visibleCurveBuckets = CURVE_BUCKETS.filter((bucket) => curve.counts[bucket] > 0);
  const statCards = [
    { label: 'Total', value: totals.totalCopies },
    { label: 'Cartas', value: totals.uniqueCards },
    { label: 'Clave', value: totals.keyCopies },
    { label: 'Sin coste', value: curve.naCount },
  ].filter((row) => row.value > 0);

  return (
    <section
      className={cn(
        'deck-board overflow-hidden rounded-2xl border border-border/70 bg-surface-1 shadow-[0_20px_50px_hsl(var(--background)/0.45)]',
        'print:rounded-none print:shadow-none',
        className,
      )}
    >
      <div className="deck-board-header relative border-b border-border/60 bg-gradient-to-r from-primary/18 via-primary/8 to-transparent px-4 py-4 sm:px-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">{formatLabel || 'Sin formato'}</Badge>
          {authorLabel ? <Badge variant="outline">{authorLabel}</Badge> : null}
          {updatedAt ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(updatedAt) ?? updatedAt}
            </span>
          ) : null}
        </div>
        <h1 className="truncate text-xl font-semibold sm:text-2xl">{deckName}</h1>
      </div>

      <div className="deck-board-grid grid min-h-[680px] lg:min-h-[720px] xl:grid-cols-[1.55fr_1fr]">
        <div className="deck-board-left relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/16 via-primary/8 to-transparent xl:border-b-0 xl:border-r">
          <Shield className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-primary/10" />

          <div className="relative flex h-full flex-col p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">Cartas del mazo</span>
              {totals.uniqueCards > 0 ? <Badge variant="outline">{totals.uniqueCards} unicas</Badge> : null}
              {totals.totalCopies > 0 ? <Badge variant="secondary">{totals.totalCopies} copias</Badge> : null}
            </div>

            {normalizedCards.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-card/60 p-5 text-sm text-muted-foreground">
                No hay cartas para mostrar.
              </div>
            ) : (
              <div className="deck-board-cards-scroll min-h-0 flex-1 overflow-auto pr-1">
                <div className="deck-board-cards-grid grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8">
                  {normalizedCards.map((card) => (
                    <article key={card.id} className="group">
                      <div className="relative overflow-hidden rounded-md border border-border/60 bg-card/70 shadow">
                        <CardImage
                          src={card.imageUrl}
                          alt={card.name}
                          className="aspect-[63/88] w-full transition-transform duration-200 group-hover:scale-[1.02]"
                          fit="cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                          {card.qty}
                        </span>
                        {card.isKeyCard ? (
                          <span className="absolute right-1 top-1 rounded bg-accent px-1 py-1 text-accent-foreground shadow">
                            <Star className="h-3 w-3 fill-current" />
                          </span>
                        ) : null}
                      </div>
                      <p className="deck-board-card-name mt-1 truncate text-[11px] text-muted-foreground">{card.name}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="deck-board-right flex flex-col gap-3 bg-gradient-to-br from-card via-card/90 to-accent/10 p-3 sm:p-4">
          {statCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {statCards.map((row) => (
                <StatCard key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border border-border/60 bg-surface-2/70 p-3">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Curva de coste</h2>
            </div>
            {visibleCurveBuckets.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin datos de coste (se excluyen cartas de Oro).
              </p>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {visibleCurveBuckets.map((bucket) => {
                const qty = curve.counts[bucket];
                const heightPct = Math.max(8, Math.round((qty / curve.max) * 100));
                return (
                  <div key={bucket} className="text-center">
                    <div className="mb-1 text-[10px] font-semibold">{qty}</div>
                    <div className="flex h-28 items-end rounded border border-border/60 bg-background/70 p-1">
                      <div
                        className="w-full rounded-sm bg-primary/75"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] font-semibold text-muted-foreground">{bucket}</div>
                  </div>
                );
                })}
              </div>
            )}
          </div>

          {visibleTypeBuckets.length > 0 ? (
            <div className="rounded-xl border border-border/60 bg-surface-2/70 p-3">
              <h2 className="mb-3 text-sm font-semibold">Distribucion del mazo</h2>
              <div className="space-y-2">
                {visibleTypeBuckets.map((bucket) => {
                const meta = TYPE_META[bucket];
                const Icon = meta.icon;
                const qty = typeCounts[bucket];
                const widthPct = Math.max(8, Math.round((qty / maxTypeCount) * 100));
                return (
                  <div key={bucket} className="rounded-lg border border-border/50 bg-background/60 p-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        {meta.label}
                      </span>
                      <span className="text-xs font-semibold">{qty}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          ) : null}

          {keyHighlights.length > 0 ? (
            <div className="rounded-xl border border-border/60 bg-surface-2/70 p-3">
              <h2 className="mb-2 text-sm font-semibold">Cartas clave</h2>
              <div className="flex flex-wrap gap-1.5">
                {keyHighlights.map((card) => (
                  <Badge key={card.id} variant="secondary">
                    {card.name} x{card.qty}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold leading-tight">{value}</p>
    </div>
  );
}
