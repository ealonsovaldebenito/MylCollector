/**
 * UserPublicProfile — Perfil público de un usuario.
 * Avatar, bio, stats, follow, mazos públicos.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import type { ReactNode } from 'react';
import { ArrowLeft, Heart, Users, ScrollText, UserPlus, UserMinus, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
    <div className="space-y-8 animate-page-enter">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-950/80 via-background to-background shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.12),transparent_40%)]" />
        <div className="relative z-10 flex flex-col gap-4 p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/community">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Comunidad
              </Button>
            </Link>
            {!isOwnProfile && user && (
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                size="sm"
                onClick={handleFollow}
                disabled={isTogglingFollow}
                className="gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    Siguiendo
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Seguir
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              {(profile.display_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold leading-tight">
                  {profile.display_name || 'Usuario'}
                </h1>
                <Badge variant="secondary" className="text-[11px] uppercase tracking-wider">
                  Comunidad
                </Badge>
              </div>
              {profile.bio ? (
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{profile.bio}</p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Aún no tiene biografía.</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Miembro desde {new Date(profile.created_at).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  Builder destacado
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={<ScrollText className="h-4 w-4 text-accent" />} label="Mazos" value={profile.deck_count} />
            <StatTile icon={<Heart className="h-4 w-4 text-red-500" />} label="Likes recibidos" value={profile.total_likes} />
            <StatTile icon={<Users className="h-4 w-4 text-indigo-500" />} label="Seguidores" value={profile.follower_count} />
            <StatTile icon={<Users className="h-4 w-4 text-muted-foreground" />} label="Siguiendo" value={profile.following_count} />
          </div>
        </div>
      </div>

      {/* User's public decks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Mazos públicos</h2>
          <Badge variant="outline" className="text-[11px]">
            {userDecks.length} resultados
          </Badge>
        </div>
        {decksLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : userDecks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/60 py-12 text-muted-foreground">
            <ScrollText className="h-10 w-10 opacity-30" />
            <p className="text-sm">Este usuario no tiene mazos públicos.</p>
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

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/70 px-3 py-3 text-center backdrop-blur">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted/60">
        {icon}
      </div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  );
}
