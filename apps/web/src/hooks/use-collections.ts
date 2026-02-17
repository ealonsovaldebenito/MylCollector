/**
 * use-collections — Hooks para gestionar colecciones (carpetas) del usuario.
 *
 * Changelog:
 *   2026-02-17 — Creación inicial
 */

'use client';

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import type { UserCollection, CreateCollection, UpdateCollection } from '@myl/shared';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message ?? 'Error al cargar datos');
  return json.data;
};

/** List all collections for the current user */
export function useCollections() {
  const { data, error, isLoading, mutate } = useSWR<{ items: UserCollection[] }>(
    '/api/v1/collections',
    fetcher,
  );

  return {
    collections: data?.items ?? [],
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

/** Create a new collection */
export function useCreateCollection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateCollection) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error al crear colección');
      return json.data.collection;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { create, isLoading, error };
}

/** Update a collection */
export function useUpdateCollection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (collectionId: string, input: UpdateCollection) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error al actualizar colección');
      return json.data.collection;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { update, isLoading, error };
}

/** Delete a collection */
export function useDeleteCollection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (collectionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/collections/${collectionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error al eliminar colección');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { remove, isLoading, error };
}

/** Move cards between collections */
export function useMoveCards() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = useCallback(async (userCardIds: string[], targetCollectionId: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const target = targetCollectionId ?? 'general';
      const res = await fetch(`/api/v1/collections/${target}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_card_ids: userCardIds, target_collection_id: targetCollectionId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error al mover cartas');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { move, isLoading, error };
}
