'use client';

import { useEffect, useState, useCallback } from 'react';

interface DeckItem {
  deck_id: string;
  user_id: string;
  format_id: string;
  edition_id: string | null;
  race_id: string | null;
  name: string;
  description: string | null;
  strategy: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  format: { format_id: string; name: string; code: string };
  edition?: { name: string; code: string } | null;
  race?: { name: string } | null;
  card_count?: number;
}

interface UseMyDecksResult {
  decks: DeckItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export type { DeckItem };

export function useMyDecks(): UseMyDecksResult {
  const [decks, setDecks] = useState<DeckItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/decks');
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar mazos');
        return;
      }
      setDecks(json.data.items);
    } catch {
      setError('Error de conexion');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { decks, isLoading, error, refresh: load };
}
