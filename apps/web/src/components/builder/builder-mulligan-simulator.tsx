/**
 * File: apps/web/src/components/builder/builder-mulligan-simulator.tsx
 *
 * BuilderMulliganSimulator — Simula manos iniciales y mulligans desde el mazo actual.
 *
 * Relaciones:
 * - Consume `DeckCardSlot[]` desde `useDeckBuilder` vía `BuilderWorkspace`.
 *
 * Bugfixes / Notas:
 * - Adaptado a modelo “por copia” (cada slot es una copia; no depende de `qty`).
 * - La mano se agrupa y ordena por coste (y nombre) y muestra cantidades.
 * - Agrega curva visual de mano + plan sugerido por turnos (1 oro/turno).
 *
 * Changelog:
 * - 2026-02-17 — Fix: pool por copia + orden por coste + plan sugerido.
 */

'use client';

import { useMemo, useState } from 'react';
import { Dices, RotateCcw } from 'lucide-react';

import type { DeckCardSlot } from '@/hooks/use-deck-builder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type MulliganRule = 'KEEP_SAME' | 'DRAW_MINUS_ONE';

interface HandEntry {
  card_printing_id: string;
  name: string;
  type: string;
  cost: number | null;
  qty: number;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function buildPool(cards: DeckCardSlot[]) {
  const pool: Array<Omit<HandEntry, 'qty'>> = [];
  for (const slot of cards) {
    if (slot.is_starting_gold) continue;
    pool.push({
      card_printing_id: slot.card_printing_id,
      name: slot.card.name,
      type: slot.card.card_type.name,
      cost: slot.card.cost ?? null,
    });
  }
  return pool;
}

function groupHand(entries: Array<Omit<HandEntry, 'qty'>>): HandEntry[] {
  const map = new Map<string, HandEntry>();
  for (const e of entries) {
    const existing = map.get(e.card_printing_id);
    if (existing) existing.qty += 1;
    else map.set(e.card_printing_id, { ...e, qty: 1 });
  }
  return [...map.values()].sort((a, b) => {
    const ca = a.cost ?? 999;
    const cb = b.cost ?? 999;
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name, 'es');
  });
}

export function BuilderMulliganSimulator({ cards }: { cards: DeckCardSlot[] }) {
  const startingGold = useMemo(() => cards.find((c) => c.is_starting_gold) ?? null, [cards]);
  const pool = useMemo(() => buildPool(cards), [cards]);

  const baseHandSize = 8;
  const [rule, setRule] = useState<MulliganRule>('DRAW_MINUS_ONE');
  const [mulligans, setMulligans] = useState<number>(0);
  const [hand, setHand] = useState<HandEntry[]>([]);

  const effectiveHandSize = Math.max(1, baseHandSize - (rule === 'DRAW_MINUS_ONE' ? mulligans : 0));
  const canDraw = pool.length > 0;
  const canMulligan = canDraw && (rule === 'KEEP_SAME' || effectiveHandSize > 1);

  function drawHand(nextMulligans: number) {
    if (pool.length === 0) return;
    const nextEffective = Math.max(1, baseHandSize - (rule === 'DRAW_MINUS_ONE' ? nextMulligans : 0));
    const count = Math.min(nextEffective, pool.length);
    const shuffled = shuffleInPlace([...pool]);
    setHand(groupHand(shuffled.slice(0, count)));
  }

  function handleNewHand() {
    setMulligans(0);
    drawHand(0);
  }

  function handleMulligan() {
    const next = mulligans + 1;
    setMulligans(next);
    drawHand(next);
  }

  function handleReset() {
    setMulligans(0);
    setHand([]);
  }

  const handCostCurve = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of hand) {
      const k = h.cost == null ? 'N/A' : String(h.cost);
      map.set(k, (map.get(k) ?? 0) + h.qty);
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'N/A') return 1;
      if (b === 'N/A') return -1;
      return Number(a) - Number(b);
    });
    const max = entries.length > 0 ? Math.max(...entries.map(([, v]) => v), 1) : 1;
    return { entries, max };
  }, [hand]);

  const suggestedTurns = useMemo(() => {
    const byCost = new Map<number, HandEntry[]>();
    for (const h of hand) {
      if (h.cost == null) continue;
      const list = byCost.get(h.cost) ?? [];
      list.push(h);
      byCost.set(h.cost, list);
    }
    for (const [k, list] of byCost.entries()) {
      list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      byCost.set(k, list);
    }
    return byCost;
  }, [hand]);

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Dices className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Simulador de mulligan</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Roba una mano al azar desde tu mazo (excluye el oro inicial) y repite mulligans.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleReset} disabled={hand.length === 0 && mulligans === 0}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button type="button" size="sm" onClick={handleNewHand} disabled={!canDraw}>
            Nueva mano
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-medium text-muted-foreground">Regla</div>
          <Select value={rule} onValueChange={(v) => setRule(v as MulliganRule)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Regla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAW_MINUS_ONE">Cada mulligan -1 carta</SelectItem>
              <SelectItem value="KEEP_SAME">Mantener tamaño</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="mb-1 text-[11px] font-medium text-muted-foreground">Estado</div>
            <div className="flex flex-wrap items-center gap-1">
              <Badge variant="secondary" className="h-5 text-[10px]">
                Mano inicial: {baseHandSize}
              </Badge>
              <Badge variant="outline" className="h-5 text-[10px]">
                Mulligans: {mulligans}
              </Badge>
              <Badge variant="outline" className="h-5 text-[10px]">
                Mano: {hand.reduce((s, h) => s + h.qty, 0)}/{effectiveHandSize}
              </Badge>
              {startingGold ? (
                <Badge variant="secondary" className="h-5 max-w-[180px] truncate text-[10px]">
                  Oro: {startingGold.card.name}
                </Badge>
              ) : null}
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleMulligan} disabled={!canMulligan || hand.length === 0}>
            Mulligan
          </Button>
        </div>
      </div>

      <div className="mt-3">
        {pool.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Agrega cartas para poder simular mulligans.</p>
        ) : hand.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Presiona “Nueva mano” para comenzar.</p>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-border/60 bg-background p-2">
              <div className="mb-1 text-[11px] font-medium text-muted-foreground">Curva de coste (mano)</div>
              <div className="space-y-1.5">
                {handCostCurve.entries.map(([cost, qty]) => {
                  const pct = (qty / handCostCurve.max) * 100;
                  return (
                    <div key={cost} className="flex items-center gap-2">
                      <span className="w-8 text-[11px] font-mono text-muted-foreground">{cost === 'N/A' ? '—' : cost}</span>
                      <div className="relative h-3 flex-1 overflow-hidden rounded bg-muted">
                        <div className="h-full bg-primary/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-[11px] font-mono font-semibold">{qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-background p-2">
              <div className="mb-1 text-[11px] font-medium text-muted-foreground">Plan sugerido (1 oro/turno)</div>
              <div className="space-y-1 text-[11px]">
                {[1, 2, 3, 4, 5].map((t) => {
                  const list = suggestedTurns.get(t) ?? [];
                  const total = list.reduce((s, x) => s + x.qty, 0);
                  return (
                    <div key={t} className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground">T{t}</span>
                      {total === 0 ? (
                        <span className="text-muted-foreground">Sin jugadas de coste {t}</span>
                      ) : (
                        <span className="text-right text-foreground">{list.map((x) => `${x.name} x${x.qty}`).join(' · ')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              {hand.map((h) => (
                <div key={h.card_printing_id} className={cn('flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5')}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-medium">{h.name}</span>
                      {h.qty > 1 ? (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                          x{h.qty}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="truncate">{h.type}</span>
                      <span className="flex-shrink-0">· C:{h.cost ?? '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

