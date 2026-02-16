'use client';

import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { CardImage } from './card-image';
import { Shield, ShieldAlert, ShieldOff, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardDetailPrintingsProps {
  printings: CardDetail['printings'];
}

const STATUS_ICONS: Record<string, typeof Shield> = {
  LEGAL: Shield,
  RESTRICTED: ShieldAlert,
  BANNED: ShieldX,
  DISCONTINUED: ShieldOff,
};

const STATUS_COLORS: Record<string, string> = {
  LEGAL: 'text-green-500',
  RESTRICTED: 'text-yellow-500',
  BANNED: 'text-red-500',
  DISCONTINUED: 'text-muted-foreground',
};

export function CardDetailPrintings({ printings }: CardDetailPrintingsProps) {
  if (printings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay printings registrados para esta carta.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {printings.map((p) => {
        const Icon = STATUS_ICONS[p.legal_status] ?? Shield;
        const iconColor = STATUS_COLORS[p.legal_status] ?? '';

        return (
          <div
            key={p.card_printing_id}
            className="flex gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
          >
            <CardImage
              src={p.image_url}
              alt={`Printing ${p.edition.code}`}
              className="h-20 w-14 flex-shrink-0 rounded"
            />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium">{editionDisplayName(p.edition.name)}</span>
                <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', iconColor)} />
              </div>

              {p.rarity_tier && (
                <Badge variant="secondary" className="text-[10px]">
                  {p.rarity_tier.name}
                </Badge>
              )}

              {p.illustrator && (
                <p className="truncate text-xs text-muted-foreground">
                  Ilustrador: {p.illustrator}
                </p>
              )}

              {p.collector_number && (
                <p className="font-mono text-xs text-muted-foreground">
                  #{p.collector_number}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
