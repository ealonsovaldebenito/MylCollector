'use client';

import { useEffect, useState } from 'react';
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

/**
 * Hook to get the current user with their profile from user_profiles table
 */
export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUserProfile = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      setUser(authUser);

      if (authUser) {
        // Fetch profile from user_profiles table
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        setProfile(profileData);
      }

      setIsLoading(false);
    };

    loadUserProfile();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
  };
}
