'use client';

import { useEffect, useState, useCallback } from 'react';
import type { CommunityPriceSubmission, PriceStats, SubmitPrice, VotePrice } from '@myl/shared';

interface PriceHistoryItem {
  price: number;
  captured_at: string;
  source_name: string;
}

// ============================================================================
// usePriceSubmissions - Fetch submissions and stats for a card printing
// ============================================================================

interface UsePriceSubmissionsResult {
  submissions: CommunityPriceSubmission[];
  stats: PriceStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePriceSubmissions(cardPrintingId: string | null): UsePriceSubmissionsResult {
  const [submissions, setSubmissions] = useState<CommunityPriceSubmission[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    if (!cardPrintingId) {
      setSubmissions([]);
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/prices/${cardPrintingId}`);
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar precios');
        return;
      }

      setSubmissions(json.data.submissions ?? []);
      setStats(json.data.stats ?? null);
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [cardPrintingId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return {
    submissions,
    stats,
    isLoading,
    error,
    refetch: fetchSubmissions,
  };
}

// ============================================================================
// useSubmitPrice - Submit a new community price
// ============================================================================

interface UseSubmitPriceResult {
  submitPrice: (data: SubmitPrice) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

export function useSubmitPrice(onSuccess?: () => void): UseSubmitPriceResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPrice = useCallback(
    async (data: SubmitPrice) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/v1/prices/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!json.ok) {
          const errorMsg = json.error?.message ?? 'Error al enviar precio';
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        onSuccess?.();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error de conexión');
        }
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSuccess],
  );

  return {
    submitPrice,
    isSubmitting,
    error,
  };
}

// ============================================================================
// useVotePrice - Vote on a price submission
// ============================================================================

interface UseVotePriceResult {
  vote: (data: VotePrice) => Promise<void>;
  isVoting: boolean;
  error: string | null;
}

export function useVotePrice(onSuccess?: () => void): UseVotePriceResult {
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(
    async (data: VotePrice) => {
      setIsVoting(true);
      setError(null);

      try {
        const res = await fetch('/api/v1/prices/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!json.ok) {
          const errorMsg = json.error?.message ?? 'Error al votar';
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        onSuccess?.();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error de conexión');
        }
        throw err;
      } finally {
        setIsVoting(false);
      }
    },
    [onSuccess],
  );

  return {
    vote,
    isVoting,
    error,
  };
}

// ============================================================================
// usePriceHistory - Fetch price history for a card printing
// ============================================================================

interface UsePriceHistoryResult {
  history: PriceHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePriceHistory(cardPrintingId: string | null): UsePriceHistoryResult {
  const [history, setHistory] = useState<PriceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!cardPrintingId) {
      setHistory([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/prices/${cardPrintingId}/history`);
      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar histórico');
        return;
      }

      setHistory(json.data.history ?? []);
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [cardPrintingId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}
