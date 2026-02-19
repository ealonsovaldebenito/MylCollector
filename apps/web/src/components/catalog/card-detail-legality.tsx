'use client';

import type { CardDetail } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, ShieldAlert, ShieldX, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardDetailBanStatus } from './card-detail-ban-status';

interface CardDetailLegalityProps {
  card: CardDetail;
}

const LEGAL_STATUS_CONFIG = {
  LEGAL: {
    icon: Shield,
    label: 'Legal',
    className: 'bg-green-500/20 text-green-700 dark:text-green-300',
    iconClassName: 'text-green-500',
    description: 'Esta carta puede usarse sin restricciones.',
  },
  RESTRICTED: {
    icon: ShieldAlert,
    label: 'Restringida',
    className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    iconClassName: 'text-yellow-500',
    description: 'Esta carta tiene restricciones en su uso (ej: máximo 1 copia en el mazo).',
  },
  BANNED: {
    icon: ShieldX,
    label: 'Prohibida',
    className: 'bg-red-500/20 text-red-700 dark:text-red-300',
    iconClassName: 'text-red-500',
    description: 'Esta carta no puede usarse en torneos oficiales.',
  },
  DISCONTINUED: {
    icon: ShieldOff,
    label: 'Descontinuada',
    className: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
    iconClassName: 'text-muted-foreground',
    description: 'Esta edición ya no está en producción.',
  },
} as const;

export function CardDetailLegality({ card }: CardDetailLegalityProps) {
  // Group printings by legal status
  const statusGroups = card.printings.reduce((acc, printing) => {
    const status = printing.legal_status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(printing);
    return acc;
  }, {} as Record<string, typeof card.printings>);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Estado Legal por Edición</h4>

      </div>

      {/* Status groups */}
      <div className="space-y-4">
        {Object.entries(statusGroups).map(([status, printings]) => {
          const config = LEGAL_STATUS_CONFIG[status as keyof typeof LEGAL_STATUS_CONFIG] ?? {
            icon: Shield,
            label: status,
            className: 'bg-zinc-500/20 text-zinc-700',
            iconClassName: 'text-muted-foreground',
            description: 'Sin información de estado legal.',
          };
          const Icon = config.icon;

          return (
            <div key={status} className="space-y-3">
              {/* Status header */}
              <div className="flex items-start gap-2">
                <Icon className={cn('h-5 w-5 mt-0.5', config.iconClassName)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-semibold">{config.label}</h5>
                    <Badge className={config.className}>
                      {printings.length} {printings.length === 1 ? 'edición' : 'ediciones'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* Printings list */}
              <div className="ml-7 space-y-1.5">
                {printings.map((printing) => (
                  <div
                    key={printing.card_printing_id}
                    className="flex items-center justify-between rounded-md border border-border bg-card p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{editionDisplayName(printing.edition.name)}</span>
                      {printing.rarity_tier && (
                        <Badge variant="outline" className="text-xs">
                          {printing.rarity_tier.name}
                        </Badge>
                      )}
                    </div>
                    {printing.collector_number && (
                      <span className="font-mono text-xs text-muted-foreground">
                        #{printing.collector_number}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Format ban status */}
      <CardDetailBanStatus cardId={card.card_id} />
    </div>
  );
}
