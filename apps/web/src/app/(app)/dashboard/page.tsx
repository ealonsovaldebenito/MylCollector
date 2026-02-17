/**
 * /dashboard — Panel principal del usuario autenticado.
 * Muestra estadísticas personales, mazos recientes y tendencias.
 *
 * Changelog:
 *   2026-02-18 — Reemplazo de placeholder con contenido real
 */

'use client';

import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useUser } from '@/contexts/user-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText, Heart, TrendingUp, Hammer, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, profile } = useUser();
  const { deckCount, totalLikes, recentDecks, trendingDecks, isLoading } = useDashboardStats();

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Hola, {displayName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenido de vuelta. Aquí tienes un resumen de tu actividad.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          <>
            <div className="glass-card flex items-center gap-4 rounded-xl p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ScrollText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deckCount}</p>
                <p className="text-xs text-muted-foreground">Mis Mazos</p>
              </div>
            </div>
            <div className="glass-card flex items-center gap-4 rounded-xl p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLikes}</p>
                <p className="text-xs text-muted-foreground">Likes Recibidos</p>
              </div>
            </div>
            <Link
              href="/decks"
              className="group flex items-center gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Hammer className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold group-hover:text-accent transition-colors">Nuevo Mazo</p>
                <p className="text-xs text-muted-foreground">Crea un mazo nuevo</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </Link>
          </>
        )}
      </div>

      {/* Recent decks */}
      {recentDecks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Mis Mazos Recientes</h2>
            <Link href="/decks" className="text-xs text-accent hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {recentDecks.map((d) => (
              <Link
                key={d.deck_id}
                href={`/decks?deck=${d.deck_id}`}
                className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:border-accent/30 hover:bg-card/70"
              >
                <ScrollText className="h-4 w-4 text-accent" />
                <span className="flex-1 text-sm font-medium truncate">{d.name}</span>
                {d.format_name && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {d.format_name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trendingDecks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Tendencias
            </h2>
            <Link href="/community" className="text-xs text-accent hover:underline">Ver más</Link>
          </div>
          <div className="space-y-2">
            {trendingDecks.map((d) => (
              <Link
                key={d.deck_id}
                href={`/community/decks/${d.deck_id}`}
                className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:border-accent/30 hover:bg-card/70"
              >
                <Heart className="h-4 w-4 text-red-500" />
                <span className="flex-1 text-sm font-medium truncate">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.like_count} likes</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
