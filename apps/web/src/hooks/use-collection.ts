'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import type {
  CollectionFilters,
  CollectionStats,
  AddToCollection,
  UpdateCollectionItem,
  MissingCard,
  BlockCompletion,
  EditionCompletion,
  UserCardWithRelations,
} from '@myl/shared';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error?.message ?? 'Error al cargar datos');
  }
  return json.data;
};

/**
 * Build query string from filters
 */
function buildQueryString(filters: Partial<CollectionFilters> & { legal_status?: string; collection_id?: string | null }): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.block_id) params.set('block_id', filters.block_id);
  if (filters.edition_id) params.set('edition_id', filters.edition_id);
  if (filters.card_type_id) params.set('card_type_id', filters.card_type_id);
  if (filters.race_id) params.set('race_id', filters.race_id);
  if (filters.rarity_tier_id) params.set('rarity_tier_id', filters.rarity_tier_id);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.legal_status) params.set('legal_status', filters.legal_status);
  if (filters.min_qty !== undefined) params.set('min_qty', String(filters.min_qty));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.collection_id !== undefined) {
    params.set('collection_id', filters.collection_id === null ? '__none__' : filters.collection_id);
  }
  return params.toString();
}

/**
 * Hook to fetch user collection with filters
 */
export function useCollection(filters: Partial<CollectionFilters> = {}) {
  const qs = buildQueryString(filters);
  const { data, error, isLoading, mutate } = useSWR<{ items: UserCardWithRelations[] }>(
    `/api/v1/collection?${qs}`,
    fetcher,
  );

  return {
    items: data?.items ?? [],
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

/**
 * Hook to fetch collection stats
 */
export function useCollectionStats() {
  const { data, error, isLoading, mutate } = useSWR<CollectionStats>(
    '/api/v1/collection/stats',
    fetcher,
  );

  return {
    stats: data ?? null,
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

/**
 * Hook to add card to collection
 */
export function useAddToCollection() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/v1/collection',
    async (url: string, { arg }: { arg: AddToCollection }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message ?? 'Error al agregar a colección');
      }
      return json.data;
    },
  );

  return {
    addToCollection: trigger,
    isAdding: isMutating,
    error: error?.message ?? null,
  };
}

/**
 * Hook to update collection item
 */
export function useUpdateCollectionItem() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/v1/collection/update',
    async (
      url: string,
      { arg }: { arg: { userCardId: string; updates: UpdateCollectionItem } },
    ) => {
      const res = await fetch(`/api/v1/collection/${arg.userCardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg.updates),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message ?? 'Error al actualizar item');
      }
      return json.data;
    },
  );

  return {
    updateItem: trigger,
    isUpdating: isMutating,
    error: error?.message ?? null,
  };
}

/**
 * Hook to remove card from collection
 */
export function useRemoveFromCollection() {
  const { trigger, isMutating, error } = useSWRMutation(
    '/api/v1/collection/remove',
    async (url: string, { arg }: { arg: { userCardId: string } }) => {
      const res = await fetch(`/api/v1/collection/${arg.userCardId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message ?? 'Error al eliminar de colección');
      }
      return json.data;
    },
  );

  return {
    removeFromCollection: trigger,
    isRemoving: isMutating,
    error: error?.message ?? null,
  };
}

/**
 * Hook to fetch missing cards for a deck
 */
export function useMissingCards(deckVersionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ items: MissingCard[] }>(
    deckVersionId ? `/api/v1/collection/missing?deck_version_id=${deckVersionId}` : null,
    fetcher,
  );

  return {
    missingCards: data?.items ?? [],
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

/**
 * Hook to fetch block completion
 */
export function useBlockCompletion(blockId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<BlockCompletion>(
    blockId ? `/api/v1/collection/completion/block/${blockId}` : null,
    fetcher,
  );

  return {
    completion: data ?? null,
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

/**
 * Hook to fetch edition completion
 */
export function useEditionCompletion(editionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EditionCompletion>(
    editionId ? `/api/v1/collection/completion/edition/${editionId}` : null,
    fetcher,
  );

  return {
    completion: data ?? null,
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}
