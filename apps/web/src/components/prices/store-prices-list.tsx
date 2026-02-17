/**
 * StorePricesList — Shows available store prices for a card printing.
 * Fetches from /api/v1/prices/:printingId/stores and renders
 * a compact list with store name, price, last scraped date, and buy link.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Store, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface StorePrice {
  store_printing_link_id: string;
  product_url: string;
  product_name: string | null;
  last_price: number | null;
  last_currency_id: string | null;
  last_scraped_at: string | null;
  is_active: boolean;
  store: {
    store_id: string;
    name: string;
    url: string | null;
    logo_url: string | null;
    is_active: boolean;
  };
}

interface StorePricesListProps {
  cardPrintingId: string;
}

function formatCLP(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function StorePricesList({ cardPrintingId }: StorePricesListProps) {
  const [stores, setStores] = useState<StorePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/prices/${cardPrintingId}/stores`);
        const json = await res.json();
        if (json.ok) {
          setStores(json.data?.items ?? []);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [cardPrintingId]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <Store className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          Sin precios de tiendas disponibles para esta edición.
        </p>
      </div>
    );
  }

  // Sort by price (lowest first), nulls last
  const sorted = [...stores].sort((a, b) => {
    if (a.last_price === null) return 1;
    if (b.last_price === null) return -1;
    return a.last_price - b.last_price;
  });

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Store className="h-4 w-4" />
        Precios en Tiendas
      </h4>
      <div className="space-y-1.5">
        {sorted.map((item) => (
          <a
            key={item.store_printing_link_id}
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/5"
          >
            <div className="flex items-center gap-3">
              {item.store.logo_url ? (
                <img
                  src={item.store.logo_url}
                  alt={item.store.name}
                  className="h-8 w-8 rounded object-contain"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                  <Store className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div>
                <span className="text-sm font-medium">{item.store.name}</span>
                {item.last_scraped_at && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {timeAgo(item.last_scraped_at)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.last_price !== null ? (
                <Badge
                  variant="secondary"
                  className="border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                >
                  {formatCLP(item.last_price)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Sin precio
                </Badge>
              )}
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
