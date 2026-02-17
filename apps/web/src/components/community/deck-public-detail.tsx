/**
 * DeckPublicDetail — Vista completa de un mazo público.
 * Cards agrupadas, estadísticas, likes, comentarios.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Eye, MessageCircle, Calendar, User as UserIcon, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DeckCommentSection } from './deck-comment-section';
import { usePublicDeckDetail } from '@/hooks/use-public-deck-detail';
import { useDeckLike } from '@/hooks/use-deck-like';
import { useUser } from '@/contexts/user-context';
import { ErrorState } from '@/components/feedback';
import { toast } from 'sonner';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DeckPublicDetail({ deckId }: { deckId: string }) {
  const { deck, isLoading, error } = usePublicDeckDetail(deckId);
  const { user } = useUser();
  const { hasLiked, likeCount, toggleLike, isToggling } = useDeckLike(
    deckId,
    deck?.viewer_has_liked ?? false,
    deck?.like_count ?? 0,
  );

  // Group cards by type
  const cardGroups = useMemo(() => {
    if (!deck?.cards) return [];
    const groups = new Map<string, { typeName: string; cards: unknown[] }>();
    for (const vc of deck.cards as Array<{ card?: { card_type_id?: string }; qty?: number }>) {
      const typeId = vc.card?.card_type_id ?? 'unknown';
      if (!groups.has(typeId)) groups.set(typeId, { typeName: typeId, cards: [] });
      groups.get(typeId)!.cards.push(vc);
    }
    return [...groups.values()];
  }, [deck?.cards]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Inicia sesión para dar like');
      return;
    }
    await toggleLike();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-page-enter">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return <ErrorState message={error ?? 'Mazo no encontrado'} />;
  }

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Back + title */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/community">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Comunidad
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header card */}
          <div className="rounded-xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold">{deck.name}</h1>
                {deck.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{deck.description}</p>
                )}
              </div>
              {deck.format && (
                <Badge variant="outline" className="text-xs font-semibold uppercase">
                  {deck.format.name}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <button
                onClick={handleLike}
                disabled={isToggling}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all hover:bg-red-500/10"
              >
                <Heart
                  className={`h-4 w-4 transition-all ${hasLiked ? 'fill-red-500 text-red-500 scale-110' : ''}`}
                />
                <span className={hasLiked ? 'text-red-500 font-medium' : ''}>{likeCount}</span>
              </button>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> {deck.view_count}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> {deck.comment_count}
              </span>
              <span className="flex items-center gap-1.5 ml-auto">
                <Calendar className="h-4 w-4" /> {formatDate(deck.created_at)}
              </span>
            </div>
          </div>

          {/* Cards list */}
          <div className="rounded-xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
            <h2 className="font-display text-lg font-bold mb-4">
              <Shield className="inline h-4 w-4 mr-1.5 text-accent" />
              Cartas ({(deck.cards as unknown[]).length})
            </h2>
            {cardGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cartas</p>
            ) : (
              <div className="space-y-3">
                {(deck.cards as Array<{
                  deck_version_card_id?: string;
                  qty?: number;
                  is_starting_gold?: boolean;
                  card?: { name?: string; cost?: number | null };
                  printing?: { image_url?: string | null };
                }>).map((vc, i) => (
                  <div
                    key={vc.deck_version_card_id ?? i}
                    className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-accent font-bold w-6 text-right">
                      {vc.qty}×
                    </span>
                    <span className="flex-1 truncate font-medium">
                      {vc.card?.name ?? 'Carta desconocida'}
                    </span>
                    {vc.card?.cost != null && (
                      <span className="text-xs text-muted-foreground">
                        Coste {vc.card.cost}
                      </span>
                    )}
                    {vc.is_starting_gold && (
                      <Badge variant="outline" className="text-[9px]">Oro</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strategy sections */}
          {(deck.strategy as Array<{ section_id: string; title: string; content: string }>).length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
              <h2 className="font-display text-lg font-bold mb-4">Estrategia</h2>
              <div className="space-y-4">
                {(deck.strategy as Array<{ section_id: string; title: string; content: string }>).map((s) => (
                  <div key={s.section_id}>
                    <h3 className="text-sm font-semibold text-accent mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
            <DeckCommentSection deckId={deckId} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Author */}
          <Link
            href={`/community/users/${deck.author.user_id}`}
            className="block rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm transition-all hover:border-accent/30"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Constructor
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {(deck.author.display_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{deck.author.display_name || 'Usuario'}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <UserIcon className="h-3 w-3" /> Ver perfil
                </p>
              </div>
            </div>
          </Link>

          {/* Quick stats */}
          <div className="rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Información
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 py-2">
                <p className="text-lg font-bold text-accent">{likeCount}</p>
                <p className="text-[10px] text-muted-foreground">Likes</p>
              </div>
              <div className="rounded-lg bg-muted/40 py-2">
                <p className="text-lg font-bold">{deck.view_count}</p>
                <p className="text-[10px] text-muted-foreground">Vistas</p>
              </div>
              <div className="rounded-lg bg-muted/40 py-2">
                <p className="text-lg font-bold">{deck.comment_count}</p>
                <p className="text-[10px] text-muted-foreground">Comentarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
