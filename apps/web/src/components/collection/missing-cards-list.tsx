'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CardImage } from '@/components/catalog/card-image';
import { AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MissingCard } from '@myl/shared';

interface MissingCardsListProps {
  missingCards: MissingCard[];
  isLoading: boolean;
  onAddCard?: (cardPrintingId: string) => void;
  className?: string;
}

export function MissingCardsList({
  missingCards,
  isLoading,
  onAddCard,
  className,
}: MissingCardsListProps) {
  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Card>
    );
  }

  if (missingCards.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-500 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-foreground">¡Tienes todas las cartas!</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Tu colección contiene todas las cartas necesarias para este mazo.
          </p>
        </div>
      </Card>
    );
  }

  const totalMissing = missingCards.reduce((sum, card) => sum + card.qty_missing, 0);
  const totalEstimate = missingCards.reduce(
    (sum, card) => sum + (card.price_estimate ?? 0) * card.qty_missing,
    0,
  );

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-foreground">Cartas Faltantes</h2>
            <Badge variant="destructive" className="font-mono">
              {totalMissing} faltantes
            </Badge>
          </div>
          {totalEstimate > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Valor estimado: ${totalEstimate.toFixed(2)}
            </p>
          )}
        </div>

        {/* Missing cards list */}
        <div className="space-y-3">
          {missingCards.map((card) => (
            <div
              key={card.card_printing_id}
              className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {/* Card image */}
              <CardImage
                src={card.image_url}
                alt={card.card_name}
                className="w-16 h-20 rounded flex-shrink-0"
              />

              {/* Card info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {card.card_name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {card.edition_name}
                  {card.rarity_tier_name && ` • ${card.rarity_tier_name}`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Tienes: {card.qty_owned}
                  </Badge>
                  <Badge variant="destructive" className="text-xs font-mono">
                    Faltan: {card.qty_missing}
                  </Badge>
                  {card.price_estimate && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      ~${(card.price_estimate * card.qty_missing).toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              {onAddCard && (
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddCard(card.card_printing_id)}
                    title="Agregar a colección"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
