/**
 * /resources/banlist — Vista pública de ban lists por formato.
 * Muestra cartas prohibidas, limitadas a 1 y limitadas a 2 por formato.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldX, Ban, AlertTriangle, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

interface Format {
  format_id: string;
  name: string;
  code: string;
}

interface LimitRow {
  format_card_limit_id: string;
  card_id: string;
  max_qty: number;
  notes: string | null;
  card: {
    card_id: string;
    name: string;
    card_type: { name: string; code: string };
  };
}

interface GroupedLimits {
  banned: LimitRow[];
  limited_1: LimitRow[];
  limited_2: LimitRow[];
  other: LimitRow[];
}

// ============================================================================
// Main Component
// ============================================================================

export default function PublicBanlistPage() {
  const [formats, setFormats] = useState<Format[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [limits, setLimits] = useState<GroupedLimits | null>(null);
  const [limitsLoading, setLimitsLoading] = useState(false);

  // Load formats
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/catalog/formats');
        const json = await res.json();
        if (json.ok) {
          const items = json.data.items ?? json.data ?? [];
          setFormats(items);
          if (items.length > 0) {
            setSelectedFormatId(items[0]!.format_id);
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // Load limits when format changes
  const loadLimits = useCallback(async () => {
    if (!selectedFormatId) return;
    setLimitsLoading(true);
    try {
      const res = await fetch(
        `/api/v1/admin/banlists/formats/${selectedFormatId}/limits?grouped=true`,
      );
      const json = await res.json();
      if (json.ok) setLimits(json.data as GroupedLimits);
    } finally {
      setLimitsLoading(false);
    }
  }, [selectedFormatId]);

  useEffect(() => { loadLimits(); }, [loadLimits]);

  const selectedFormat = formats.find((f) => f.format_id === selectedFormatId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resources" className="text-muted-foreground hover:text-foreground">
          Recursos
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <ShieldX className="h-5 w-5 text-rose-600" />
          <h1 className="font-display text-2xl font-bold">Ban Lists</h1>
        </div>
      </div>

      <p className="text-muted-foreground">
        Listado oficial de cartas prohibidas y restringidas por formato de juego.
        Estas restricciones son actualizadas periódicamente por el equipo de Juego Organizado de MYL.
      </p>

      <Separator />

      {/* Format selector */}
      {loading ? (
        <Skeleton className="h-10 w-64" />
      ) : formats.length === 0 ? (
        <EmptyState
          title="Sin formatos"
          description="No hay formatos registrados en el sistema."
        />
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Formato:</span>
          <Select value={selectedFormatId} onValueChange={setSelectedFormatId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Seleccionar formato" />
            </SelectTrigger>
            <SelectContent>
              {formats.map((f) => (
                <SelectItem key={f.format_id} value={f.format_id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Limits display */}
      {limitsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : limits ? (
        <div className="space-y-8">
          {/* Prohibited */}
          <BanSection
            title="Cartas Prohibidas"
            subtitle="No puedes tener copias de estas cartas en tu mazo"
            icon={<Ban className="h-5 w-5 text-red-500" />}
            cards={limits.banned}
            badgeColor="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
            badgeLabel="Prohibida"
          />

          {/* Limited to 1 */}
          <BanSection
            title="Limitadas a 1 copia"
            subtitle="Solo puedes tener una copia de esta carta en tu mazo"
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            cards={limits.limited_1}
            badgeColor="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            badgeLabel="Limitada a 1"
          />

          {/* Limited to 2 */}
          <BanSection
            title="Limitadas a 2 copias"
            subtitle="Solo puedes tener hasta dos copias de esta carta en tu mazo"
            icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
            cards={limits.limited_2}
            badgeColor="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
            badgeLabel="Limitada a 2"
          />

          {/* Other */}
          {limits.other.length > 0 && (
            <BanSection
              title="Otras restricciones"
              subtitle="Restricciones especiales"
              icon={<ShieldX className="h-5 w-5 text-gray-500" />}
              cards={limits.other}
              badgeColor="bg-gray-100 text-gray-700"
              badgeLabel="Restringida"
            />
          )}

          {limits.banned.length === 0 &&
            limits.limited_1.length === 0 &&
            limits.limited_2.length === 0 && (
              <EmptyState
                title="Sin restricciones"
                description={`El formato "${selectedFormat?.name ?? ''}" no tiene restricciones activas.`}
              />
            )}
        </div>
      ) : null}

      {/* Info */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          Mínimo de aliados por mazo para todas las razas: <strong>16</strong>.
          Las cartas del producto Drácula y de Inferno no están permitidas en formato Racial Edición
          (salvo reimpresiones con diseño de edición).
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Ban Section Component
// ============================================================================

function BanSection({
  title,
  subtitle,
  icon,
  cards,
  badgeColor,
  badgeLabel,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  cards: LimitRow[];
  badgeColor: string;
  badgeLabel: string;
}) {
  if (cards.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {cards.length} carta(s)
        </Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.format_card_limit_id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{card.card?.name ?? 'Desconocida'}</p>
              <p className="text-xs text-muted-foreground">
                {card.card?.card_type?.name ?? ''}
              </p>
            </div>
            <Badge className={badgeColor}>{badgeLabel}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
