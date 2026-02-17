/**
 * usePublicDeckDetail — Hook para detalle de mazo público.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect } from 'react';

interface PublicDeckDetail {
  deck_id: string;
  name: string;
  description: string | null;
  user_id: string;
  format_id: string;
  edition_id: string | null;
  race_id: string | null;
  like_count: number;
  view_count: number;
  comment_count: number;
  visibility: string;
  created_at: string;
  updated_at: string;
  author: { user_id: string; display_name: string | null; avatar_url: string | null };
  format: { format_id: string; name: string; code: string } | null;
  cards: unknown[];
  strategy: unknown[];
  viewer_has_liked: boolean;
}

export function usePublicDeckDetail(deckId: string | null) {
  const [deck, setDeck] = useState<PublicDeckDetail | null>(null);
  const [isLoading, setIsLoading] = useState(!!deckId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) {
      setDeck(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/v1/community/decks/${deckId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (!json.ok) throw new Error(json.error?.message ?? 'Error al cargar mazo');
        setDeck(json.data as PublicDeckDetail);
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : 'Error desconocido');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [deckId]);

  return { deck, isLoading, error, setDeck };
}
