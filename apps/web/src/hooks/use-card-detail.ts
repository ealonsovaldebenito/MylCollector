'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CardDetail } from '@myl/shared';

interface UseCardDetailResult {
  card: CardDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useCardDetail(cardId: string | null): UseCardDetailResult {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCard = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/cards/${id}`);
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar carta');
        setCard(null);
        return;
      }

      setCard(json.data);
    } catch {
      setError('Error de conexion');
      setCard(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cardId) {
      fetchCard(cardId);
    } else {
      setCard(null);
      setError(null);
    }
  }, [cardId, fetchCard]);

  return { card, isLoading, error };
}
