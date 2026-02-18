/**
 * DeckPublicCard — Tarjeta de mazo público para la galería.
 * Muestra portada, autor, formato y panel CARDSD con métricas y cartas clave.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 *   2026-02-18 — Rediseño modular: layout visual enriquecido + integración con DeckPublicCardsD.
 *   2026-02-18 — Compacto: stats visibles (likes/comentarios/actualización) y card de menor altura.
 *   2026-02-18 — Layout "estilo carta": imagen vertical + cuerpo compacto.
 */

'use client';

import Link from 'next/link';
import { Calendar, Clock, Heart, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { DeckPublicCardsD } from './deck-public-cardsd';
import type { PublicDeckListItem } from '@myl/shared';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
}

export function DeckPublicCard({ deck }: { deck: PublicDeckListItem }) {
  const coverImage = deck.cardsd?.cover_image_url ?? null;
  const authorName = deck.display_name || 'Usuario';

  return (
    <Link
      href={`/community/decks/${deck.deck_id}`}
      className="group block h-[320px] overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-[128px] gap-3 p-3">
          <div className="h-[112px] w-[80px] flex-shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/20">
          <CardImage
            src={coverImage}
            alt={deck.name}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
            fit="contain"
          />
        </div>
          <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
              {deck.format_name || deck.format_code}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {relativeTime(deck.created_at)}
            </span>
          </div>
          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
            {deck.name}
          </h3>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {authorName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{authorName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className={`h-3.5 w-3.5 ${deck.viewer_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
              {deck.like_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {deck.comment_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Act.: {relativeTime(deck.updated_at)}
            </span>
          </div>
          <div className="h-[16px]">
            {deck.description ? (
              <p className="line-clamp-1 text-[11px] text-muted-foreground">{deck.description}</p>
            ) : (
              <span className="text-[11px] opacity-0">placeholder</span>
            )}
          </div>
          </div>
        </div>

        <div className="mt-auto h-[192px] border-t border-border/50 px-3 py-2">
          <DeckPublicCardsD deck={deck} />
        </div>
      </div>
    </Link>
  );
}
