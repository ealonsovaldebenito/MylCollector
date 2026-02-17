/**
 * UserPublicProfile — Perfil público de un usuario.
 * Avatar, bio, stats, follow, mazos públicos.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { ArrowLeft, Heart, Users, ScrollText, UserPlus, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPublicProfile } from '@/hooks/use-user-public-profile';
import { usePublicDecks } from '@/hooks/use-public-decks';
import { useUser } from '@/contexts/user-context';
import { ErrorState } from '@/components/feedback';
import { DeckPublicCard } from './deck-public-card';
import { toast } from 'sonner';

export function UserPublicProfile({ userId }: { userId: string }) {
  const { user } = useUser();
  const { profile, isLoading, error, toggleFollow, isFollowing, isTogglingFollow } =
    useUserPublicProfile(userId);
  const { decks, isLoading: decksLoading } = usePublicDecks({
    sort: 'most_liked',
    limit: 12,
  });

  // Filter decks to this user's decks (client-side since we don't have a user filter in the API yet)
  const userDecks = decks.filter((d) => d.user_id === userId);

  const handleFollow = async () => {
    if (!user) {
      toast.error('Inicia sesión para seguir usuarios');
      return;
    }
    await toggleFollow();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-page-enter">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <ErrorState message={error ?? 'Usuario no encontrado'} />;
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="space-y-6 animate-page-enter">
      <Link href="/community">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Comunidad
        </Button>
      </Link>

      {/* Profile header */}
      <div className="rounded-xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
            {(profile.display_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold">
              {profile.display_name || 'Usuario'}
            </h1>
            {profile.bio && (
              <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Miembro desde {new Date(profile.created_at).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          {!isOwnProfile && user && (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={handleFollow}
              disabled={isTogglingFollow}
            >
              {isFollowing ? (
                <><UserMinus className="h-4 w-4 mr-1.5" /> Siguiendo</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-1.5" /> Seguir</>
              )}
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/40 py-3 text-center">
            <ScrollText className="h-4 w-4 mx-auto mb-1 text-accent" />
            <p className="text-xl font-bold">{profile.deck_count}</p>
            <p className="text-[10px] text-muted-foreground">Mazos</p>
          </div>
          <div className="rounded-lg bg-muted/40 py-3 text-center">
            <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-xl font-bold">{profile.total_likes}</p>
            <p className="text-[10px] text-muted-foreground">Likes</p>
          </div>
          <div className="rounded-lg bg-muted/40 py-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-indigo-500" />
            <p className="text-xl font-bold">{profile.follower_count}</p>
            <p className="text-[10px] text-muted-foreground">Seguidores</p>
          </div>
          <div className="rounded-lg bg-muted/40 py-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xl font-bold">{profile.following_count}</p>
            <p className="text-[10px] text-muted-foreground">Siguiendo</p>
          </div>
        </div>
      </div>

      {/* User's public decks */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">Mazos Públicos</h2>
        {decksLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : userDecks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <ScrollText className="h-10 w-10 opacity-30" />
            <p className="text-sm">Este usuario no tiene mazos públicos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userDecks.map((deck) => (
              <DeckPublicCard key={deck.deck_id} deck={deck} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
