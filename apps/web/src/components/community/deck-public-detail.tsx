/**
 * DeckPublicDetail — Vista completa de un mazo público.
 * UI inspirada en el builder: tarjetas de vidrio, badges claros y layout con hero.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 *   2026-02-19 — Rediseño hero + stats + lista de cartas estilo builder.
 */

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Eye,
  Calendar,
  User as UserIcon,
  Shield,
  Clock,
  Link2,
  Coins,
  Star,
  Dices,
  Users,
  ScrollText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DeckCommentSection } from './deck-comment-section';
import { usePublicDeckDetail } from '@/hooks/use-public-deck-detail';
import { useDeckLike } from '@/hooks/use-deck-like';
import { useUserPublicProfile } from '@/hooks/use-user-public-profile';
import { useUser } from '@/contexts/user-context';
import { ErrorState } from '@/components/feedback';
import { CardImage } from '@/components/catalog/card-image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type DeckCardRow = {
  deck_version_card_id?: string;
  qty?: number;
  is_starting_gold?: boolean;
  is_key_card?: boolean;
  card?: { name?: string; cost?: number | null; card_type_id?: string | null; ally_strength?: number | null };
  printing?: { image_url?: string | null; edition_id?: string | null; rarity_tier_id?: string | null };
};

type MulliganCardCopy = {
  id: string;
  name: string;
  cost: number | null;
  typeId: string | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function groupHand(entries: MulliganCardCopy[]) {
  const map = new Map<string, { name: string; cost: number | null; qty: number }>();
  for (const e of entries) {
    const key = e.id;
    const existing = map.get(key);
    if (existing) {
      existing.qty += 1;
    } else {
      map.set(key, { name: e.name ?? 'Carta', cost: e.cost, qty: 1 });
    }
  }
  return [...map.values()].sort((a, b) => {
    const ca = a.cost ?? 999;
    const cb = b.cost ?? 999;
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name, 'es');
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

  const cards = useMemo(() => (deck?.cards as DeckCardRow[]) ?? [], [deck?.cards]);
  const { profile: authorProfile, isLoading: authorLoading } = useUserPublicProfile(deck?.author.user_id ?? null);
  const mulliganPool = useMemo<MulliganCardCopy[]>(() => {
    const pool: MulliganCardCopy[] = [];
    for (const c of cards) {
      if (c.is_starting_gold) continue; // no contamos oro inicial en mulligan
      const qty = c.qty ?? 1;
      for (let i = 0; i < qty; i++) {
        pool.push({
          id: `${c.deck_version_card_id ?? c.card?.name ?? 'c'}-${i}`,
          name: c.card?.name ?? 'Carta',
          cost: c.card?.cost ?? null,
          typeId: c.card?.card_type_id ?? null,
        });
      }
    }
    return pool;
  }, [cards]);

  const totals = useMemo(() => {
    let totalCopies = 0;
    let costSum = 0;
    let costCount = 0;
    let keyCards = 0;

    for (const c of cards) {
      const qty = c.qty ?? 1;
      totalCopies += qty;
      if (typeof c.card?.cost === 'number') {
        costSum += c.card.cost * qty;
        costCount += qty;
      }
      if (c.is_key_card) keyCards += 1;
    }

    return {
      totalCopies,
      uniqueCards: cards.length,
      keyCards,
      avgCost: costCount > 0 ? Number((costSum / costCount).toFixed(2)) : null,
    };
  }, [cards]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Inicia sesión para dar like');
      return;
    }
    await toggleLike();
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: deck?.name ?? 'Mazo', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace copiado');
      }
    } catch (err) {
      console.error(err);
      toast.error('No se pudo compartir');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-page-enter">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return <ErrorState message={error ?? 'Mazo no encontrado'} />;
  }

  const authorName = deck.author.display_name || 'Usuario';

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-950/80 via-background to-background shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.08),transparent_35%)]" />
        <div className="relative z-10 flex flex-col gap-6 p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Link href="/community">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Comunidad
              </Button>
            </Link>
            <Badge variant="secondary" className="uppercase tracking-wide">
              {deck.format?.name ?? deck.format?.code ?? 'Sin formato'}
            </Badge>
            <Badge variant="outline" className="uppercase tracking-wide">
              {deck.visibility}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
            <div className="lg:col-span-2 space-y-3">
              <h1 className="font-display text-3xl font-bold leading-tight">{deck.name}</h1>
              <p className="text-sm text-muted-foreground max-w-4xl">
                {deck.description || 'Este mazo aún no tiene descripción.'}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href={`/community/users/${deck.author.user_id}`}
                  className="group flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-3 py-2 backdrop-blur transition hover:border-accent/40"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Construido por</p>
                    <p className="text-sm font-semibold group-hover:text-accent transition-colors">
                      {authorName}
                    </p>
                  </div>
                  <UserIcon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </Link>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Creado: {formatDate(deck.created_at)}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Actualizado: {formatDate(deck.updated_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border/50 bg-card/70 px-2 py-3">
                <p className="text-xl font-bold text-accent">{formatNumber(likeCount)}</p>
                <p className="text-[11px] text-muted-foreground">Likes</p>
              </div>
                <div className="rounded-xl border border-border/50 bg-card/70 px-2 py-3">
                  <p className="text-xl font-bold">{formatNumber(deck.view_count)}</p>
                  <p className="text-[11px] text-muted-foreground">Vistas</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/70 px-2 py-3">
                  <p className="text-xl font-bold">{deck.comment_count}</p>
                  <p className="text-[11px] text-muted-foreground">Comentarios</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={hasLiked ? 'default' : 'secondary'}
                  size="sm"
                  className="gap-2"
                  onClick={handleLike}
                  disabled={isToggling}
                >
                  <Heart className={cn('h-4 w-4', hasLiked && 'fill-white')} />
                  {hasLiked ? 'Te gusta' : 'Dar like'}
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                  <Link2 className="h-4 w-4" />
                  Compartir
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/community/decks/${deckId}/view`}>
                    <Eye className="h-4 w-4" />
                    Vista
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick summary */}
          <div className="glass-card rounded-xl border border-border/60 p-5 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <h2 className="font-display text-lg font-semibold">Resumen del mazo</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-2xl font-bold">{totals.totalCopies}</p>
                <p className="text-xs text-muted-foreground">Cartas totales</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-2xl font-bold">{totals.uniqueCards}</p>
                <p className="text-xs text-muted-foreground">Únicas</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="text-2xl font-bold text-yellow-500">{totals.keyCards}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" /> Cartas clave
                </p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 sm:col-span-2">
                <p className="text-2xl font-bold">{totals.avgCost ?? '—'}</p>
                <p className="text-xs text-muted-foreground">Coste promedio</p>
              </div>
            </div>
          </div>

          {/* Card list */}
          <div className="glass-card rounded-xl border border-border/60 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <h2 className="font-display text-lg font-semibold">
                  Lista de cartas ({cards.length})
                </h2>
              </div>
              <Badge variant="outline" className="text-[11px]">
                {totals.totalCopies} copias
              </Badge>
            </div>

            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cartas todavía.</p>
            ) : (
              <div className="space-y-2">
                {cards.map((vc, i) => (
                  <div
                    key={vc.deck_version_card_id ?? i}
                    className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card/70 px-3 py-2 transition hover:border-accent/40"
                  >
                    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-md border border-border bg-muted/40">
                      <CardImage
                        src={vc.printing?.image_url ?? null}
                        alt={vc.card?.name ?? 'Carta'}
                        className="h-full w-full object-cover"
                        fit="cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold leading-tight">
                          {vc.card?.name ?? 'Carta desconocida'}
                        </span>
                        {vc.is_key_card && (
                          <Badge variant="secondary" className="h-5 text-[10px]">
                            Clave
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          {vc.card?.cost ?? '—'}
                        </span>
                        {vc.card?.ally_strength != null && (
                          <span className="inline-flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            Fuerza {vc.card.ally_strength}
                          </span>
                        )}
                        {vc.card?.card_type_id && (
                          <span className="rounded bg-muted/50 px-2 py-0.5 font-mono text-[10px]">
                            Tipo {vc.card.card_type_id.slice(0, 6)}
                          </span>
                        )}
                        {vc.printing?.edition_id && (
                          <span className="rounded bg-muted/50 px-2 py-0.5 font-mono text-[10px]">
                            Ed. {vc.printing.edition_id.slice(0, 6)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                      <Badge variant="outline" className="text-[11px]">
                        ×{vc.qty ?? 1}
                      </Badge>
                      {vc.printing?.rarity_tier_id && (
                        <span className="text-[10px] text-muted-foreground">
                          Rareza {vc.printing.rarity_tier_id.slice(0, 4)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mulligan simulator */}
          <div className="glass-card rounded-xl border border-border/60 p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Dices className="h-4 w-4 text-accent" />
                <h2 className="font-display text-lg font-semibold">Generador de mulligan</h2>
              </div>
              <Badge variant="outline" className="text-[11px]">
                Mano inicial 8 cartas
              </Badge>
            </div>
            <MiniMulliganSimulator pool={mulliganPool} />
          </div>

          {/* Strategy sections */}
          {(deck.strategy as Array<{ section_id: string; title: string; content: string }>).length > 0 && (
            <div className="glass-card rounded-xl border border-border/60 p-5 backdrop-blur">
              <h2 className="font-display text-lg font-semibold mb-3">Plan de juego</h2>
              <div className="space-y-4">
                {(deck.strategy as Array<{ section_id: string; title: string; content: string }>).map((s) => (
                  <div key={s.section_id} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                    <h3 className="text-sm font-semibold text-accent mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="glass-card rounded-xl border border-border/60 p-5 backdrop-blur">
            <DeckCommentSection deckId={deckId} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Author card */}
          <Link
            href={`/community/users/${deck.author.user_id}`}
            className="block rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur transition hover:border-accent/40"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Builder</p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold leading-tight">{authorName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5" />
                  Ver perfil público
                </p>
              </div>
            </div>
          </Link>

          {/* Author stats */}
          <div className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Stats del builder</p>
            {authorLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : authorProfile ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-center">
                  <ScrollText className="mx-auto mb-1 h-4 w-4 text-accent" />
                  <p className="text-sm font-bold">{authorProfile.deck_count}</p>
                  <p className="text-[10px] text-muted-foreground">Mazos públicos</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-center">
                  <Heart className="mx-auto mb-1 h-4 w-4 text-red-500" />
                  <p className="text-sm font-bold">{authorProfile.total_likes}</p>
                  <p className="text-[10px] text-muted-foreground">Likes recibidos</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-center">
                  <Users className="mx-auto mb-1 h-4 w-4 text-indigo-500" />
                  <p className="text-sm font-bold">{authorProfile.follower_count}</p>
                  <p className="text-[10px] text-muted-foreground">Seguidores</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-center">
                  <Users className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-bold">{authorProfile.following_count}</p>
                  <p className="text-[10px] text-muted-foreground">Siguiendo</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay estadísticas del autor.</p>
            )}
          </div>

          {/* Tech sheet */}
          <div className="rounded-xl border border-border/60 bg-card/70 p-4 backdrop-blur space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Ficha</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Formato</span>
                <span className="font-medium">{deck.format?.name ?? deck.format?.code ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Edición</span>
                <span className="font-medium">{deck.edition_id?.slice(0, 8) ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Raza</span>
                <span className="font-medium">{deck.race_id?.slice(0, 8) ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Visibilidad</span>
                <Badge variant="outline" className="text-[11px]">{deck.visibility}</Badge>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Última actividad</span>
                <span className="font-medium">{formatDate(deck.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMulliganSimulator({ pool }: { pool: MulliganCardCopy[] }) {
  const [hand, setHand] = useState<ReturnType<typeof groupHand>>([]);
  const [mulligans, setMulligans] = useState(0);
  const baseHand = 8;

  const canDraw = pool.length > 0;
  const effectiveHand = Math.max(1, baseHand - mulligans);

  const draw = (nextMulligans: number) => {
    if (!canDraw) return;
    const size = Math.min(Math.max(1, baseHand - nextMulligans), pool.length);
    const shuffled = shuffleInPlace([...pool]);
    setHand(groupHand(shuffled.slice(0, size)));
  };

  const handleNewHand = () => {
    setMulligans(0);
    draw(0);
  };

  const handleMulligan = () => {
    const next = mulligans + 1;
    setMulligans(next);
    draw(next);
  };

  const totalInHand = hand.reduce((s, h) => s + h.qty, 0);
  const costCurve = useMemo(() => {
    const m = new Map<number | 'NA', number>();
    for (const h of hand) {
      const key = h.cost ?? ('NA' as const);
      m.set(key, (m.get(key) ?? 0) + h.qty);
    }
    return [...m.entries()].sort(([a], [b]) => {
      if (a === 'NA') return 1;
      if (b === 'NA') return -1;
      return Number(a) - Number(b);
    });
  }, [hand]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleNewHand} disabled={!canDraw}>
          Nueva mano
        </Button>
        <Button size="sm" variant="outline" onClick={handleMulligan} disabled={!canDraw || totalInHand === 0 || effectiveHand <= 1}>
          Mulligan -1
        </Button>
        <Badge variant="outline" className="text-[11px]">
          Mulligans: {mulligans}
        </Badge>
        <Badge variant="secondary" className="text-[11px]">
          Mano: {totalInHand || '—'}/{effectiveHand}
        </Badge>
      </div>

      {pool.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay suficientes cartas para simular.</p>
      ) : hand.length === 0 ? (
        <p className="text-sm text-muted-foreground">Genera una mano para ver la curva.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Curva de coste (mano)</p>
            <div className="space-y-1.5">
              {costCurve.map(([cost, qty]) => {
                const max = Math.max(...costCurve.map(([, q]) => q), 1);
                const pct = (qty / max) * 100;
                return (
                  <div key={String(cost)} className="flex items-center gap-2">
                    <span className="w-8 text-[11px] font-mono text-muted-foreground">{cost === 'NA' ? '—' : cost}</span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded bg-muted">
                      <div className="h-full bg-primary/60" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-[11px] font-mono">{qty}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Mano actual</p>
            <div className="space-y-1.5">
              {hand.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{h.name}</p>
                    <p className="text-[10px] text-muted-foreground">Coste {h.cost ?? '—'}</p>
                  </div>
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    x{h.qty}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
