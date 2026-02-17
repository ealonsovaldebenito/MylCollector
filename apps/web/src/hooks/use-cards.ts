'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { CardFilters } from '@myl/shared';

interface CardItem {
  card_printing_id: string;
  card_id: string;
  edition_id: string;
  rarity_tier_id: string | null;
  image_url: string | null;
  illustrator: string | null;
  collector_number: string | null;
  legal_status: string;
  printing_variant: string;
  edition: { edition_id: string; block_id: string; name: string; code: string; release_date: string | null; sort_order: number };
  rarity_tier: { rarity_tier_id: string; name: string; code: string; sort_order: number } | null;
  card: {
    card_id: string;
    name: string;
    name_normalized: string;
    card_type_id: string;
    race_id: string | null;
    ally_strength: number | null;
    cost: number | null;
    is_unique: boolean;
    has_ability: boolean;
    can_be_starting_gold: boolean;
    text: string | null;
    flavor_text: string | null;
    card_type: { card_type_id: string; name: string; code: string; sort_order: number };
    race: { race_id: string; name: string; code: string; sort_order: number } | null;
    tags: { tag_id: string; name: string; slug: string }[];
  };
  store_min_price: number | null;
}

interface UseCardsResult {
  cards: CardItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  total: number | null;
}

function buildQueryString(filters: Partial<CardFilters>, cursor?: string): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.block_id) params.set('block_id', filters.block_id);
  if (filters.edition_id) params.set('edition_id', filters.edition_id);
  if (filters.race_id) params.set('race_id', filters.race_id);
  if (filters.card_type_id) params.set('card_type_id', filters.card_type_id);
  if (filters.rarity_tier_id) params.set('rarity_tier_id', filters.rarity_tier_id);
  if (filters.legal_status) params.set('legal_status', filters.legal_status);
  if (filters.cost_min !== undefined) params.set('cost_min', String(filters.cost_min));
  if (filters.cost_max !== undefined) params.set('cost_max', String(filters.cost_max));
  if (filters.tag_slug) params.set('tag_slug', filters.tag_slug);
  if (filters.price_min !== undefined) params.set('price_min', String(filters.price_min));
  if (filters.price_max !== undefined) params.set('price_max', String(filters.price_max));
  if (filters.has_price) params.set('has_price', 'true');
  if (filters.limit) params.set('limit', String(filters.limit));
  if (cursor) params.set('cursor', cursor);
  return params.toString();
}

export function useCards(filters: Partial<CardFilters>): UseCardsResult {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchCards = useCallback(
    async (cursor?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const qs = buildQueryString(filters, cursor);
        const res = await fetch(`/api/v1/cards?${qs}`);
        const json = await res.json();

        if (!json.ok) {
          setError(json.error?.message ?? 'Error al cargar cartas');
          return;
        }

        const { items, next_cursor, total: t } = json.data;
        if (cursor) {
          setCards((prev) => [...prev, ...items]);
        } else {
          setCards(items);
        }
        setNextCursor(next_cursor);
        if (t !== undefined) setTotal(t);
      } catch {
        setError('Error de conexion');
      } finally {
        setIsLoading(false);
      }
    },
    [filters],
  );

  // Debounce search text, immediate for other filters
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const delay = filters.q ? 300 : 0;
    debounceRef.current = setTimeout(() => {
      fetchCards();
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchCards]);

  const loadMore = useCallback(() => {
    if (nextCursor && !isLoading) {
      fetchCards(nextCursor);
    }
  }, [nextCursor, isLoading, fetchCards]);

  return {
    cards,
    isLoading,
    error,
    hasMore: nextCursor !== null,
    loadMore,
    total,
  };
}
