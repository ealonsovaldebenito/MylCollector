/**
 * useDeckComments — Hook para comentarios de un mazo.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DeckComment, CreateComment } from '@myl/shared';

interface UseDeckCommentsResult {
  comments: DeckComment[];
  isLoading: boolean;
  error: string | null;
  postComment: (data: CreateComment) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  isPosting: boolean;
  refresh: () => void;
}

export function useDeckComments(deckId: string | null): UseDeckCommentsResult {
  const [comments, setComments] = useState<DeckComment[]>([]);
  const [isLoading, setIsLoading] = useState(!!deckId);
  const [error, setError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!deckId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/decks/${deckId}/comments`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error');
      setComments(json.data.items as DeckComment[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const postComment = useCallback(async (data: CreateComment) => {
    if (!deckId) return;
    setIsPosting(true);
    try {
      const res = await fetch(`/api/v1/decks/${deckId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error');
      await fetchComments();
    } finally {
      setIsPosting(false);
    }
  }, [deckId, fetchComments]);

  const editComment = useCallback(async (commentId: string, content: string) => {
    const res = await fetch(`/api/v1/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error?.message ?? 'Error');
    await fetchComments();
  }, [fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    const res = await fetch(`/api/v1/comments/${commentId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error?.message ?? 'Error');
    await fetchComments();
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    error,
    postComment,
    editComment,
    deleteComment,
    isPosting,
    refresh: fetchComments,
  };
}
