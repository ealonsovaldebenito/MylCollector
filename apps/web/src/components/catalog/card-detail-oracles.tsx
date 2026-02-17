/**
 * CardDetailOracles — Muestra oráculos (rulings) oficiales de una carta.
 * Se carga client-side desde la API pública de oráculos.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Types
// ============================================================================

interface Oracle {
  oracle_id: string;
  card_id: string;
  source_document: string;
  ruling_text: string;
  ability_type: string | null;
  sort_order: number;
}

const ABILITY_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVADA: { label: 'Activada', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  PASIVA: { label: 'Pasiva', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  ESPECIAL: { label: 'Especial', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  CONTINUA: { label: 'Continua', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  DISPARADA: { label: 'Disparada', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

// ============================================================================
// Component
// ============================================================================

interface CardDetailOraclesProps {
  cardId: string;
}

export function CardDetailOracles({ cardId }: CardDetailOraclesProps) {
  const [oracles, setOracles] = useState<Oracle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOracles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/cards/${cardId}/oracles`);
      const json = await res.json();
      if (json.ok) {
        setOracles(json.data.items ?? json.data ?? []);
      }
    } catch {
      // Non-critical, silently ignore
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadOracles();
  }, [loadOracles]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (oracles.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Oráculos Oficiales</h4>
        </div>
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No hay oráculos registrados para esta carta.
          </p>
          <Link
            href="/resources/oracles"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Ver todos los oráculos
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Group by source document
  const bySource = new Map<string, Oracle[]>();
  for (const oracle of oracles) {
    const existing = bySource.get(oracle.source_document);
    if (existing) {
      existing.push(oracle);
    } else {
      bySource.set(oracle.source_document, [oracle]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-violet-500" />
          <h4 className="text-sm font-semibold">Oráculos Oficiales</h4>
          <Badge variant="secondary">{oracles.length} ruling(s)</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Rulings oficiales que aclaran el funcionamiento de las habilidades de esta carta.
        </p>
      </div>

      <Separator />

      {Array.from(bySource.entries()).map(([source, sourceOracles]) => (
        <div key={source} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {source}
            </Badge>
          </div>

          {sourceOracles.map((oracle) => {
            const abilityConfig = oracle.ability_type
              ? ABILITY_TYPE_CONFIG[oracle.ability_type]
              : null;

            return (
              <div
                key={oracle.oracle_id}
                className="rounded-lg border bg-card p-4 shadow-sm space-y-2"
              >
                {abilityConfig && (
                  <Badge className={abilityConfig.className}>
                    {abilityConfig.label}
                  </Badge>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {oracle.ruling_text}
                </p>
              </div>
            );
          })}
        </div>
      ))}

      <Link
        href="/resources/oracles"
        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
      >
        Ver todos los oráculos
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
