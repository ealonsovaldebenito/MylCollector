/**
 * /community/decks/:deckId — Detalle de mazo público.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { use } from 'react';
import { DeckPublicDetail } from '@/components/community/deck-public-detail';

export default function CommunityDeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  return <DeckPublicDetail deckId={deckId} />;
}
