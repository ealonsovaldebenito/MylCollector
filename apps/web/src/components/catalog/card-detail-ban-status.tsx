/**
 * CardDetailBanStatus — Muestra el estado de restricción de una carta por formato.
 * Consulta format_card_limits para ver en qué formatos tiene restricciones.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldX, ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Types
// ============================================================================

interface FormatLimit {
  format_id: string;
  format_name: string;
  max_qty: number;
  notes: string | null;
}

// ============================================================================
// Component
// ============================================================================

interface CardDetailBanStatusProps {
  cardId: string;
}

export function CardDetailBanStatus({ cardId }: CardDetailBanStatusProps) {
  const [limits, setLimits] = useState<FormatLimit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBanStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/cards/${cardId}/ban-status`);
      const json = await res.json();
      if (json.ok) {
        setLimits(json.data.items ?? json.data ?? []);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadBanStatus();
  }, [loadBanStatus]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (limits.length === 0) {
    return (
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          Restricciones por Formato
        </h4>
        <div className="rounded-lg border bg-green-500/5 p-4">
          <p className="text-sm text-muted-foreground">
            Esta carta no tiene restricciones en ningún formato activo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <ShieldX className="h-5 w-5 text-rose-500" />
        Restricciones por Formato
      </h4>
      <div className="space-y-2">
        {limits.map((limit) => {
          const isBanned = limit.max_qty === 0;
          const Icon = isBanned ? ShieldX : ShieldAlert;
          const label = isBanned
            ? 'Prohibida'
            : `Limitada a ${limit.max_qty}`;
          const badgeClass = isBanned
            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            : limit.max_qty === 1
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';

          return (
            <div
              key={limit.format_id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <Icon className={`h-4 w-4 shrink-0 ${isBanned ? 'text-red-500' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{limit.format_name}</p>
                {limit.notes && (
                  <p className="text-xs text-muted-foreground truncate">{limit.notes}</p>
                )}
              </div>
              <Badge className={badgeClass}>{label}</Badge>
            </div>
          );
        })}
      </div>
      <Link
        href="/resources/banlist"
        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
      >
        Ver ban lists completas
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
