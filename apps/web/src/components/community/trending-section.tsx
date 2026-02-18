/**
 * TrendingSection — Top mazos y builders más activos.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 *   2026-02-18 — Ajuste visual: grid y alturas alineadas con cards enriquecidas de comunidad.
 */

'use client';

import { useCommunityTrending } from '@/hooks/use-community-trending';
import { DeckPublicCard } from './deck-public-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function TrendingSection() {
  const { trendingDecks, topBuilders, isLoading, error } = useCommunityTrending();

  if (error) return null;

  return (
    <div className="space-y-8">
      {/* Trending decks */}
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
          <Flame className="h-5 w-5 text-orange-500" />
          Mazos Populares
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[280px] rounded-xl" />
            ))}
          </div>
        ) : trendingDecks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <TrendingUp className="h-10 w-10 opacity-30" />
            <p className="text-sm">Aún no hay mazos populares</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {trendingDecks.slice(0, 6).map((deck, i) => (
              <div key={deck.deck_id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <DeckPublicCard deck={deck} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top Builders */}
      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top Constructores
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : topBuilders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 opacity-30" />
            <p className="text-sm">Aún no hay constructores destacados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topBuilders.slice(0, 10).map((builder, i) => (
              <Link
                key={builder.user_id}
                href={`/community/users/${builder.user_id}`}
                className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card/60 px-4 py-3 transition-all hover:border-accent/30 hover:bg-card/80 animate-fade-in"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {(builder.display_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                    {builder.display_name || 'Usuario'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {builder.deck_count} mazos · {builder.total_likes} likes
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
