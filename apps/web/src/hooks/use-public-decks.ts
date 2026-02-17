/**
 * usePublicDecks — Hook para galería pública de mazos con filtros y paginación.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PublicDeckFilters, PublicDeckListItem } from '@myl/shared';

interface UsePublicDecksResult {
  decks: PublicDeckListItem[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

export function usePublicDecks(filters: Partial<PublicDeckFilters> = {}): UsePublicDecksResult {
  const [decks, setDecks] = useState<PublicDeckListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const filtersRef = useRef(filters);
  const limit = filters.limit ?? 20;

  // Reset on filter change
  useEffect(() => {
    const prev = filtersRef.current;
    if (
      prev.format_id !== filters.format_id ||
      prev.edition_id !== filters.edition_id ||
      prev.race_id !== filters.race_id ||
      prev.q !== filters.q ||
      prev.sort !== filters.sort
    ) {
      setDecks([]);
      setOffset(0);
      setTotalCount(0);
    }
    filtersRef.current = filters;
  }, [filters.format_id, filters.edition_id, filters.race_id, filters.q, filters.sort]);

  const fetchDecks = useCallback(async (currentOffset: number, append: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.format_id) params.set('format_id', filters.format_id);
      if (filters.edition_id) params.set('edition_id', filters.edition_id);
      if (filters.race_id) params.set('race_id', filters.race_id);
      if (filters.q) params.set('q', filters.q);
      if (filters.sort) params.set('sort', filters.sort);
      params.set('limit', String(limit));
      params.set('offset', String(currentOffset));

      const res = await fetch(`/api/v1/community/decks?${params}`);
      const json = await res.json();

      if (!json.ok) throw new Error(json.error?.message ?? 'Error al cargar mazos');

      const items = json.data.items as PublicDeckListItem[];
      setDecks((prev) => append ? [...prev, ...items] : items);
      setTotalCount(json.data.total_count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [filters.format_id, filters.edition_id, filters.race_id, filters.q, filters.sort, limit]);

  useEffect(() => {
    void fetchDecks(offset, offset > 0);
  }, [fetchDecks, offset]);

  const loadMore = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  const refresh = useCallback(() => {
    setDecks([]);
    setOffset(0);
    void fetchDecks(0, false);
  }, [fetchDecks]);

  return {
    decks,
    isLoading,
    error,
    totalCount,
    hasMore: decks.length < totalCount,
    loadMore,
    refresh,
  };
}
