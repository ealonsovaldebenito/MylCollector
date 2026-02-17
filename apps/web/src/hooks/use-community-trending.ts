/**
 * useCommunityTrending — Hook para tendencias y top builders.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect } from 'react';
import type { PublicDeckListItem, TopBuilder } from '@myl/shared';

interface UseCommunityTrendingResult {
  trendingDecks: PublicDeckListItem[];
  topBuilders: TopBuilder[];
  isLoading: boolean;
  error: string | null;
}

export function useCommunityTrending(): UseCommunityTrendingResult {
  const [trendingDecks, setTrendingDecks] = useState<PublicDeckListItem[]>([]);
  const [topBuilders, setTopBuilders] = useState<TopBuilder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch('/api/v1/community/trending')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (!json.ok) throw new Error(json.error?.message ?? 'Error');
        setTrendingDecks(json.data.trending as PublicDeckListItem[]);
        setTopBuilders(json.data.top_builders as TopBuilder[]);
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : 'Error desconocido');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  return { trendingDecks, topBuilders, isLoading, error };
}
