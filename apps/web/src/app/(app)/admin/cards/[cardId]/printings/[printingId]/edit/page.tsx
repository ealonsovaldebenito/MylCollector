/**
 * /admin/cards/[cardId]/printings/[printingId]/edit
 * Admin editor for a single printing.
 *
 * Changelog:
 *   2026-02-18 - Added richer printing summary panel for edit context.
 */

'use client';

import { use, useEffect, useState } from 'react';
import type { CardPrintingWithRelations } from '@myl/shared';
import { CardPrintingForm } from '@/components/admin/card-printing-form';
import { CardImage } from '@/components/catalog/card-image';
import { ErrorState } from '@/components/feedback';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogData } from '@/hooks/use-catalog-data';
import { ExternalLink } from 'lucide-react';

export default function EditPrintingPage({
  params,
}: {
  params: Promise<{ cardId: string; printingId: string }>;
}) {
  const { cardId, printingId } = use(params);
  const { editions, blocks, rarities, isLoading: catalogLoading } = useCatalogData();
  const [printing, setPrinting] = useState<CardPrintingWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrinting() {
      try {
        const res = await fetch(`/api/v1/cards/${cardId}`);
        const json = await res.json();
        if (!json.ok) {
          setError(json.error?.message ?? 'Error al cargar carta');
          return;
        }

        const foundPrinting = json.data.printings.find(
          (candidate: CardPrintingWithRelations) => candidate.card_printing_id === printingId,
        );
        if (!foundPrinting) {
          setError('Impresion no encontrada');
          return;
        }
        setPrinting(foundPrinting);
      } catch {
        setError('Error de conexion');
      } finally {
        setIsLoading(false);
      }
    }

    if (!catalogLoading) {
      loadPrinting();
    }
  }, [cardId, printingId, catalogLoading]);

  if (catalogLoading || isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !printing) {
    return <ErrorState message={error ?? 'Impresion no encontrada'} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Editar impresion: {printing.printing_variant?.trim() || 'standard'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Edicion: {printing.edition.name} ({printing.edition.code})
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
          <div className="overflow-hidden rounded-md border border-border bg-background">
            <CardImage
              src={printing.image_url ?? null}
              alt={`Impresion ${printing.printing_variant ?? 'standard'}`}
              className="h-[190px] w-full"
              fit="contain"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{printing.legal_status}</Badge>
              {printing.rarity_tier ? <Badge variant="outline">{printing.rarity_tier.name}</Badge> : null}
              {printing.collector_number ? (
                <Badge variant="outline" className="font-mono">
                  #{printing.collector_number}
                </Badge>
              ) : null}
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-mono text-xs">{printing.card_printing_id}</p>
              <p>{printing.illustrator ? `Ilustrador: ${printing.illustrator}` : 'Ilustrador: N/A'}</p>
              {printing.image_url ? (
                <a
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  href={printing.image_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver imagen actual <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-xs">Sin imagen registrada</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardPrintingForm
        cardId={cardId}
        printingId={printingId}
        editions={editions}
        blocks={blocks}
        rarities={rarities}
        mode="edit"
        initialData={{
          card_printing_id: printing.card_printing_id,
          edition_id: printing.edition_id,
          rarity_tier_id: printing.rarity_tier_id ?? undefined,
          illustrator: printing.illustrator ?? '',
          collector_number: printing.collector_number ?? '',
          legal_status: printing.legal_status,
          printing_variant: printing.printing_variant ?? 'standard',
          image_url: printing.image_url ?? undefined,
        }}
      />
    </div>
  );
}
