'use client';

import { useRouter } from 'next/navigation';
import { useMyDecks } from '@/hooks/use-my-decks';
import { DeckListPanel } from '@/components/builder/deck-list-panel';

export default function BuilderPage() {
  const router = useRouter();
  const { decks, isLoading, error } = useMyDecks();

  const handleCreateNew = () => {
    router.push('/builder/new');
  };

  const handleOpenDeck = (deckId: string) => {
    router.push(`/builder/${deckId}`);
  };

  return (
    <DeckListPanel
      decks={decks}
      isLoading={isLoading}
      error={error}
      onCreateNew={handleCreateNew}
      onOpenDeck={handleOpenDeck}
    />
  );
}
