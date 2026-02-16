'use client';

import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { BarChart3, Layers, DollarSign, Calendar } from 'lucide-react';

interface CardDetailStatsProps {
  card: CardDetail;
}

export function CardDetailStats({ card }: CardDetailStatsProps) {
  const totalPrintings = card.printings.length;
  const editions = [...new Set(card.printings.map((p) => p.edition.name))];
  const rarities = card.printings
    .map((p) => p.rarity_tier?.name)
    .filter((r): r is string => !!r);
  const uniqueRarities = [...new Set(rarities)];
  const hasPrice = card.printings.some((p) => p.price_consensus);

  return (
    <div className="space-y-6">
      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Layers className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{totalPrintings}</p>
          <p className="text-xs text-muted-foreground">
            {totalPrintings === 1 ? 'Impresion' : 'Impresiones'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Calendar className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{editions.length}</p>
          <p className="text-xs text-muted-foreground">
            {editions.length === 1 ? 'Edicion' : 'Ediciones'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <BarChart3 className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{uniqueRarities.length}</p>
          <p className="text-xs text-muted-foreground">
            {uniqueRarities.length === 1 ? 'Rareza' : 'Rarezas'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <DollarSign className="mx-auto mb-2 h-5 w-5 text-accent" />
          <p className="text-2xl font-bold font-mono">{hasPrice ? 'Si' : 'No'}</p>
          <p className="text-xs text-muted-foreground">Precio disponible</p>
        </div>
      </div>

      {/* Edition breakdown */}
      {editions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Historial de ediciones
          </h4>
          <div className="space-y-2">
            {card.printings.map((p) => (
              <div
                key={p.card_printing_id}
                className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.collector_number ?? '—'}
                  </span>
                  <span className="text-sm font-medium">
                    {editionDisplayName(p.edition.name)}
                  </span>
                  {p.rarity_tier && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {p.rarity_tier.name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {p.edition.release_date ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card properties summary */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Propiedades
        </h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: 'Tipo', value: card.card_type.name },
            { label: 'Raza', value: card.race?.name ?? '—' },
            { label: 'Coste', value: card.cost !== null ? String(card.cost) : '—' },
            { label: 'Fuerza', value: card.ally_strength !== null ? String(card.ally_strength) : '—' },
            { label: 'Unica', value: card.is_unique ? 'Si' : 'No' },
            { label: 'Habilidad', value: card.has_ability ? 'Si' : 'No' },
            { label: 'Oro inicial', value: card.can_be_starting_gold ? 'Si' : 'No' },
          ].map((prop) => (
            <div
              key={prop.label}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">{prop.label}</span>
              <span className="text-sm font-medium">{prop.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
