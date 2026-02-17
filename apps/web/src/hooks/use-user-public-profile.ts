/**
 * useUserPublicProfile — Hook para perfil público de usuario.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserPublicProfile } from '@myl/shared';

interface UseUserPublicProfileResult {
  profile: UserPublicProfile | null;
  isLoading: boolean;
  error: string | null;
  toggleFollow: () => Promise<void>;
  isFollowing: boolean;
  isTogglingFollow: boolean;
}

export function useUserPublicProfile(userId: string | null): UseUserPublicProfileResult {
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/v1/community/users/${userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return;
        if (!json.ok) throw new Error(json.error?.message ?? 'Error');
        setProfile(json.data as UserPublicProfile);
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : 'Error desconocido');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [userId]);

  const toggleFollow = useCallback(async () => {
    if (!userId) return;
    setIsTogglingFollow(true);
    const prevFollowing = profile?.viewer_is_following ?? false;

    // Optimistic update
    if (profile) {
      setProfile({
        ...profile,
        viewer_is_following: !prevFollowing,
        follower_count: prevFollowing ? profile.follower_count - 1 : profile.follower_count + 1,
      });
    }

    try {
      const res = await fetch(`/api/v1/users/${userId}/follow`, { method: 'POST' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? 'Error');
    } catch {
      // Rollback
      if (profile) {
        setProfile({
          ...profile,
          viewer_is_following: prevFollowing,
          follower_count: profile.follower_count,
        });
      }
    } finally {
      setIsTogglingFollow(false);
    }
  }, [userId, profile]);

  return {
    profile,
    isLoading,
    error,
    toggleFollow,
    isFollowing: profile?.viewer_is_following ?? false,
    isTogglingFollow,
  };
}
