/**
 * /builder/:deckId/view - Visual distribution board for deck sharing.
 *
 * Changelog:
 * - 2026-02-18: Initial version.
 */

'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback';
import {
  DeckDistributionBoard,
  type DeckDistributionCard,
} from '@/components/decks/deck-distribution-board';

interface BuilderDeckPageProps {
  params: Promise<{ deckId: string }>;
}

interface DeckHeaderData {
  deck_id: string;
  name: string;
  updated_at: string;
  format?: { name?: string | null; code?: string | null } | null;
  latest_version?: { deck_version_id: string } | null;
}

interface DeckVersionCardRow {
  deck_version_card_id: string;
  qty: number;
  is_starting_gold: boolean;
  is_key_card: boolean;
  card_printing: {
    card_printing_id: string;
    image_url: string | null;
    card: {
      name: string;
      cost: number | null;
      card_type?: { name?: string | null; code?: string | null } | null;
    };
  };
}

export default function BuilderDeckDistributionPage({ params }: BuilderDeckPageProps) {
  const { deckId } = use(params);
  const [deck, setDeck] = useState<DeckHeaderData | null>(null);
  const [cards, setCards] = useState<DeckDistributionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleExportPdf = useCallback(() => {
    const previousTitle = document.title;
    const safeName = (deck?.name ?? 'mazo').trim() || 'mazo';
    document.title = `${safeName} - vista`;
    window.print();
    setTimeout(() => {
      document.title = previousTitle;
    }, 300);
  }, [deck?.name]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const deckRes = await fetch(`/api/v1/decks/${deckId}`);
      const deckJson = await deckRes.json();
      if (!deckJson.ok) {
        throw new Error(deckJson.error?.message ?? 'No se pudo cargar el mazo');
      }

      const deckData = deckJson.data as DeckHeaderData;
      setDeck(deckData);

      if (!deckData.latest_version?.deck_version_id) {
        setCards([]);
        return;
      }

      const versionRes = await fetch(`/api/v1/deck-versions/${deckData.latest_version.deck_version_id}`);
      const versionJson = await versionRes.json();
      if (!versionJson.ok) {
        throw new Error(versionJson.error?.message ?? 'No se pudo cargar la version del mazo');
      }

      const versionCards = (versionJson.data?.cards ?? []) as DeckVersionCardRow[];
      setCards(
        versionCards.map((row) => ({
          id: row.deck_version_card_id ?? row.card_printing.card_printing_id,
          name: row.card_printing.card.name,
          qty: row.qty ?? 1,
          cost: row.card_printing.card.cost ?? null,
          typeCode: row.card_printing.card.card_type?.code ?? null,
          typeName: row.card_printing.card.card_type?.name ?? null,
          imageUrl: row.card_printing.image_url ?? null,
          isStartingGold: !!row.is_starting_gold,
          isKeyCard: !!row.is_key_card,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  const topBar = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/builder/${deckId}`} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al builder
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Recargar
        </Button>
        <Button size="sm" onClick={handleExportPdf} className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>
    ),
    [deckId, handleExportPdf, load],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {topBar}
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-[640px] rounded-2xl" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="space-y-4">
        {topBar}
        <ErrorState message={error ?? 'No se pudo cargar la vista'} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <>
      <div className="deck-view-screen space-y-4">
        <div className="app-print-hide">{topBar}</div>
        <div id="deck-view-print-root" className="mx-auto w-full max-w-[1800px]">
          <DeckDistributionBoard
            deckName={deck.name}
            formatLabel={deck.format?.name ?? deck.format?.code ?? 'Sin formato'}
            updatedAt={deck.updated_at}
            cards={cards}
            className="h-[calc(100vh-220px)] min-h-[660px]"
          />
          {cards.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/70 bg-card/50 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4" />
              Este mazo no tiene cartas guardadas todavia.
            </div>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        .deck-view-screen .deck-board {
          width: 100%;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }

          html,
          body {
            width: 100%;
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          #deck-view-print-root,
          #deck-view-print-root * {
            visibility: visible !important;
          }

          #deck-view-print-root {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            max-width: none !important;
            background: hsl(var(--background));
          }

          #deck-view-print-root .deck-board {
            height: 100vh !important;
            min-height: 0 !important;
            border-radius: 0 !important;
            border-width: 0 !important;
            box-shadow: none !important;
          }

          #deck-view-print-root .deck-board-header {
            padding: 8px 12px !important;
          }

          #deck-view-print-root .deck-board-grid {
            height: calc(100vh - 64px) !important;
            min-height: 0 !important;
            grid-template-columns: 1.6fr 1fr !important;
          }

          #deck-view-print-root .deck-board-left,
          #deck-view-print-root .deck-board-right {
            padding: 8px !important;
          }

          #deck-view-print-root .deck-board-cards-scroll {
            overflow: hidden !important;
          }

          #deck-view-print-root .deck-board-cards-grid {
            grid-template-columns: repeat(9, minmax(0, 1fr)) !important;
            gap: 3px !important;
          }

          #deck-view-print-root .deck-board-card-name {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
