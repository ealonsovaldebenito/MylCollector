'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Load user and profile once
    const loadUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        setUser(authUser);

        if (authUser) {
          // Use API endpoint to fetch profile (bypasses RLS issues)
          try {
            const response = await fetch('/api/v1/me');
            if (response.ok) {
              const data = await response.json();
              setProfile(data.profile);
            } else {
              console.warn('API returned error, using fallback');
              // Fallback if API fails
              setProfile({
                user_id: authUser.id,
                email: authUser.email || '',
                display_name: authUser.user_metadata?.display_name || null,
                avatar_url: authUser.user_metadata?.avatar_url || null,
                bio: null,
                role: 'user',
                is_active: true,
                created_at: authUser.created_at,
                updated_at: authUser.updated_at || authUser.created_at,
              });
            }
          } catch (error) {
            console.warn('Failed to load profile via API', error);
            // Fallback profile
            setProfile({
              user_id: authUser.id,
              email: authUser.email || '',
              display_name: authUser.user_metadata?.display_name || null,
              avatar_url: null,
              bio: null,
              role: 'user',
              is_active: true,
              created_at: authUser.created_at,
              updated_at: authUser.created_at,
            });
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const { data: profileData, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (error) {
            console.warn('Error loading profile on auth change:', error.message);
            // Use API endpoint as fallback
            try {
              const response = await fetch('/api/v1/me');
              if (response.ok) {
                const data = await response.json();
                setProfile(data.profile);
              }
            } catch {
              // Ultimate fallback
              setProfile({
                user_id: session.user.id,
                email: session.user.email || '',
                display_name: session.user.user_metadata?.display_name || null,
                avatar_url: null,
                bio: null,
                role: 'user',
                is_active: true,
                created_at: session.user.created_at,
                updated_at: session.user.created_at,
              });
            }
          } else {
            setProfile(profileData);
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: profile?.role === 'admin',
    }),
    [user, profile, isLoading],
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
