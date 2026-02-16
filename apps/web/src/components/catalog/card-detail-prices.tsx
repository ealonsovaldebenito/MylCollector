'use client';

import { useEffect, useState } from 'react';
import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriceSection } from '@/components/prices';
import { DollarSign } from 'lucide-react';

interface CardDetailPricesProps {
  printings: CardDetail['printings'];
}

export function CardDetailPrices({ printings }: CardDetailPricesProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<string | null>(null);

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
    <div className="space-y-8">
      {printings.map((printing, index) => (
        <div key={printing.card_printing_id}>
          {/* Printing header */}
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {editionDisplayName(printing.edition.name)}
            </h3>
            {printing.rarity_tier && (
              <Badge variant="secondary" className="text-xs">
                {printing.rarity_tier.name}
              </Badge>
            )}
            {printing.printing_variant !== 'standard' && (
              <Badge variant="outline" className="text-xs">
                {printing.printing_variant}
              </Badge>
            )}
          </div>

          {/* Price section */}
          <PriceSection
            cardPrintingId={printing.card_printing_id}
            isAuthenticated={isAuthenticated}
            defaultCurrencyId={defaultCurrencyId}
          />

          {/* Separator between printings */}
          {index < printings.length - 1 && <Separator className="mt-8" />}
        </div>
      ))}
    </div>
  );
}
