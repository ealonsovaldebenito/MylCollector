/**
 * UserProvider — Contexto global de autenticación y perfil de usuario.
 * Provee: user (Supabase Auth), profile (user_profiles), isAdmin, isLoading.
 *
 * Flujo:
 *   1. onAuthStateChange escucha cambios de sesión (login, logout, refresh)
 *   2. Cuando hay sesión, carga perfil desde user_profiles o /api/v1/me
 *   3. Expone isAdmin basado en profile.role
 *
 * Changelog:
 *   2026-02-16 — Creación inicial
 *   2026-02-17 — Fix: AbortController interfería con Navigator Locks de Supabase
 *   2026-02-17 — Fix: React Strict Mode double-mount causaba pérdida de sesión
 */

'use client';

import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserContextValue {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

function buildFallbackProfile(authUser: User): UserProfile {
  return {
    user_id: authUser.id,
    email: authUser.email || '',
    display_name: authUser.user_metadata?.display_name || null,
    avatar_url: authUser.user_metadata?.avatar_url || null,
    bio: null,
    role: 'user',
    is_active: true,
    created_at: authUser.created_at,
    updated_at: authUser.updated_at || authUser.created_at,
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  /** Load profile for an authenticated user (server is source of truth for role). */
  const loadProfile = useCallback(async (authUser: User, accessToken?: string) => {
    const supabase = createClient();

    // Prefer /api/v1/me to avoid RLS issues and to guarantee role comes from DB.
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const response = await fetch('/api/v1/me', { headers });
      if (response.ok && mountedRef.current) {
        const json = await response.json();
        if (json?.ok && json.data?.profile) {
          setProfile(json.data.profile as UserProfile);
          return;
        }
      }
    } catch {
      // API failed
    }

    // Secondary attempt: direct query (may be blocked by RLS in some setups).
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (!error && data && mountedRef.current) {
        setProfile(data as UserProfile);
        return;
      }
    } catch {
      // ignore
    }

    // Last resort: build from auth metadata (role defaults to 'user').
    if (mountedRef.current) setProfile(buildFallbackProfile(authUser));
  }, []);

  /** Refresh profile from server — call after updating profile fields. */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    await loadProfile(user, session?.access_token);
  }, [user, loadProfile]);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = createClient();

    // Subscribe to auth state changes — this is the single source of truth.
    // INITIAL_SESSION fires immediately with the current session (or null).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      const authUser = session?.user ?? null;
      setUser(authUser);

      if (authUser && session) {
        await loadProfile(authUser, session.access_token);
      } else {
        setProfile(null);
      }

      if (mountedRef.current) setIsLoading(false);
    });

    // Safety: if INITIAL_SESSION doesn't fire within 3s, stop loading.
    const timeout = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: profile?.role === 'admin',
      refreshProfile,
    }),
    [user, profile, isLoading, refreshProfile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
