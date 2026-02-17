'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriceSection } from '@/components/prices';
import { DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CardDetailPricesProps {
  printings: CardDetail['printings'];
  selectedPrintingId?: string | null;
  onSelectPrinting?: (printingId: string) => void;
}

export function CardDetailPrices({
  printings,
  selectedPrintingId,
  onSelectPrinting,
}: CardDetailPricesProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState<string>(printings[0]?.card_printing_id ?? '');

  // Check authentication status and get default currency
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const json = await res.json();
        setIsAuthenticated(json.ok && !!json.data?.user);
      } catch {
        setIsAuthenticated(false);
      }
    }

    async function getCurrency() {
      try {
        const res = await fetch('/api/v1/catalog/currencies');
        const json = await res.json();
        if (json.ok && json.data?.currencies) {
          const usd = json.data.currencies.find((c: { code: string }) => c.code === 'USD');
          setDefaultCurrencyId(usd?.currency_id ?? json.data.currencies[0]?.currency_id ?? null);
        }
      } catch {
        // Fallback to hardcoded UUID for USD if API fails
        setDefaultCurrencyId('00000000-0000-0000-0000-000000000001');
      }
    }

    checkAuth();
    getCurrency();
  }, []);

  const effectiveSelectedId = selectedPrintingId ?? localSelectedId;

  const selected = useMemo(
    () => printings.find((p) => p.card_printing_id === effectiveSelectedId) ?? printings[0] ?? null,
    [printings, effectiveSelectedId],
  );

  if (printings.length === 0) {
    return (
      <div className="py-8 text-center">
        <DollarSign className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No hay reimpresiones disponibles para esta carta.
        </p>
      </div>
    );
  }

  if (!defaultCurrencyId) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">Cargando precios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold">Precios por impresión</h3>
          <p className="text-xs text-muted-foreground">
            Selecciona una reimpresión para ver su histórico y precios.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <Select
            value={effectiveSelectedId}
            onValueChange={(id) => {
              if (onSelectPrinting) onSelectPrinting(id);
              else setLocalSelectedId(id);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una impresión" />
            </SelectTrigger>
            <SelectContent>
              {printings.map((p) => (
                <SelectItem key={p.card_printing_id} value={p.card_printing_id}>
                  {editionDisplayName(p.edition.name)}
                  {p.collector_number ? ` — #${p.collector_number}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selected ? (
        <>
          {/* Printing header */}
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold">
              {editionDisplayName(selected.edition.name)}
            </h4>
            {selected.rarity_tier && (
              <Badge variant="secondary" className="text-xs">
                {selected.rarity_tier.name}
              </Badge>
            )}
            {selected.printing_variant !== 'standard' && (
              <Badge variant="outline" className="text-xs">
                {selected.printing_variant}
              </Badge>
            )}
          </div>

          {/* Price section (stores + community) */}
          <PriceSection
            cardPrintingId={selected.card_printing_id}
            isAuthenticated={isAuthenticated}
            defaultCurrencyId={defaultCurrencyId}
          />
        </>
      ) : null}
    </div>
  );
}
