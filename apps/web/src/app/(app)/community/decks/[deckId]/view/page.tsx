/**
 * /community/decks/:deckId/view - Public deck visual distribution board.
 *
 * Changelog:
 * - 2026-02-18: Initial version.
 */

'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback';
import { usePublicDeckDetail } from '@/hooks/use-public-deck-detail';
import {
  DeckDistributionBoard,
  type DeckDistributionCard,
} from '@/components/decks/deck-distribution-board';

interface CommunityDeckViewPageProps {
  params: Promise<{ deckId: string }>;
}

interface CommunityDeckCardRow {
  deck_version_card_id?: string;
  card_printing_id?: string;
  qty?: number;
  is_starting_gold?: boolean;
  is_key_card?: boolean;
  card?: {
    name?: string;
    cost?: number | null;
    card_type_id?: string | null;
    card_type?: { name?: string | null; code?: string | null } | null;
  } | null;
  printing?: { image_url?: string | null } | null;
}

export default function CommunityDeckDistributionPage({ params }: CommunityDeckViewPageProps) {
  const { deckId } = use(params);
  const { deck, isLoading, error } = usePublicDeckDetail(deckId);

  const cards = useMemo<DeckDistributionCard[]>(() => {
    const rows = (deck?.cards as CommunityDeckCardRow[]) ?? [];
    return rows.map((row, idx) => ({
      id: row.deck_version_card_id ?? row.card_printing_id ?? `${idx}`,
      name: row.card?.name ?? 'Carta',
      qty: row.qty ?? 1,
      cost: row.card?.cost ?? null,
      typeCode: row.card?.card_type?.code ?? row.card?.card_type_id ?? null,
      typeName: row.card?.card_type?.name ?? null,
      imageUrl: row.printing?.image_url ?? null,
      isStartingGold: !!row.is_starting_gold,
      isKeyCard: !!row.is_key_card,
    }));
  }, [deck?.cards]);

  const topBar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/community/decks/${deckId}`} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al mazo
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Recargar
      </Button>
    </div>
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
        <ErrorState message={error ?? 'No se pudo cargar la vista'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topBar}
      <DeckDistributionBoard
        deckName={deck.name}
        formatLabel={deck.format?.name ?? deck.format?.code ?? 'Sin formato'}
        authorLabel={deck.author?.display_name ?? 'Usuario'}
        updatedAt={deck.updated_at}
        cards={cards}
      />
    </div>
  );
}
