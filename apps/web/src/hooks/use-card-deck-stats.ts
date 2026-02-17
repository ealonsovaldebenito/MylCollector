'use client';

/**
 * File: apps/web/src/hooks/use-card-deck-stats.ts
 * Context: Catalog → detalle de carta → tab "Estadísticas".
 * Description: Hook para cargar stats agregadas de mazos por carta (deck_count + top_companions).
 * Relations:
 * - API: `GET /api/v1/cards/:cardId/deck-stats`
 * - UI: `apps/web/src/components/catalog/card-detail-stats.tsx`
 * Changelog:
 * - 2026-02-17: Nuevo hook para deck stats.
 */

import { useCallback, useEffect, useState } from 'react';

export type CardDeckStats = {
  deck_count: number;
  top_companions: Array<{
    card_id: string;
    name: string;
    image_url: string | null;
    decks_with: number;
    total_qty: number;
  }>;
};

export function useCardDeckStats(cardId: string | null) {
  const [data, setData] = useState<CardDeckStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/cards/${id}/deck-stats`);
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar estadísticas');
        setData(null);
        return;
      }

      setData(json.data as CardDeckStats);
    } catch {
      setError('Error de conexion');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cardId) {
      fetchStats(cardId);
    } else {
      setData(null);
      setError(null);
    }
  }, [cardId, fetchStats]);

  return { data, isLoading, error };
}

