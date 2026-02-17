'use client';

/**
 * File: apps/web/src/hooks/use-card-similar.ts
 * Context: Catalog → detalle de carta (embebido con `?card=`).
 * Description: Hook para cargar “cartas similares” (lista liviana).
 * Relations:
 * - API: `GET /api/v1/cards/:cardId/similar`
 * - UI: `apps/web/src/components/catalog/catalog-card-detail.tsx`
 * Changelog:
 * - 2026-02-17: Nuevo hook para similares.
 */

import { useCallback, useEffect, useState } from 'react';

export type SimilarCard = {
  card_id: string;
  name: string;
  image_url: string | null;
};

export function useCardSimilar(cardId: string | null) {
  const [items, setItems] = useState<SimilarCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimilar = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/cards/${id}/similar`);
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar similares');
        setItems([]);
        return;
      }

      setItems((json.data?.items ?? []) as SimilarCard[]);
    } catch {
      setError('Error de conexion');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cardId) {
      fetchSimilar(cardId);
    } else {
      setItems([]);
      setError(null);
    }
  }, [cardId, fetchSimilar]);

  return { items, isLoading, error };
}

