/**
 * useDashboardStats — Hook para estadísticas del dashboard del usuario.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect } from 'react';
import type { PublicDeckListItem } from '@myl/shared';

interface DashboardStats {
  deckCount: number;
  collectionCount: number;
  totalLikes: number;
  recentDecks: Array<{ deck_id: string; name: string; format_name: string; updated_at: string }>;
  trendingDecks: PublicDeckListItem[];
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    deckCount: 0,
    collectionCount: 0,
    totalLikes: 0,
    recentDecks: [],
    trendingDecks: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Fetch user's decks
        const [decksRes, trendingRes] = await Promise.all([
          fetch('/api/v1/decks'),
          fetch('/api/v1/community/trending'),
        ]);

        const decksJson = await decksRes.json();
        const trendingJson = await trendingRes.json();

        if (!mounted) return;

        const userDecks = decksJson.ok ? (decksJson.data?.items ?? []) : [];
        const trending = trendingJson.ok ? (trendingJson.data?.trending ?? []) : [];

        setStats({
          deckCount: userDecks.length,
          collectionCount: 0, // Will be populated later
          totalLikes: userDecks.reduce((s: number, d: { like_count?: number }) => s + (d.like_count ?? 0), 0),
          recentDecks: userDecks.slice(0, 3).map((d: Record<string, unknown>) => ({
            deck_id: d.deck_id as string,
            name: d.name as string,
            format_name: (d.format_name as string) ?? '',
            updated_at: d.updated_at as string,
          })),
          trendingDecks: trending.slice(0, 3) as PublicDeckListItem[],
        });
      } catch {
        // Silently fail — dashboard is best-effort
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => { mounted = false; };
  }, []);

  return { ...stats, isLoading };
}
