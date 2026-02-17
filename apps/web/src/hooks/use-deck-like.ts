/**
 * useDeckLike — Hook para toggle de like en mazos.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useCallback } from 'react';

interface UseDeckLikeResult {
  hasLiked: boolean;
  likeCount: number;
  toggleLike: () => Promise<void>;
  isToggling: boolean;
}

export function useDeckLike(
  deckId: string,
  initialHasLiked: boolean,
  initialLikeCount: number,
): UseDeckLikeResult {
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isToggling, setIsToggling] = useState(false);

  const toggleLike = useCallback(async () => {
    setIsToggling(true);
    // Optimistic update
    const prevLiked = hasLiked;
    const prevCount = likeCount;
    setHasLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/v1/decks/${deckId}/like`, { method: 'POST' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error');
      setLikeCount(json.data.like_count);
      setHasLiked(json.data.action === 'liked');
    } catch {
      // Rollback
      setHasLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsToggling(false);
    }
  }, [deckId, hasLiked, likeCount]);

  return { hasLiked, likeCount, toggleLike, isToggling };
}
