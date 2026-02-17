/**
 * DeckPublicCard — Tarjeta de mazo público para la galería.
 * Muestra nombre, autor, formato, likes/views/comments, fecha.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import Link from 'next/link';
import { Heart, Eye, MessageCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  return (
    <Link
      href={`/community/decks/${deck.deck_id}`}
      className="group relative flex flex-col glass-card rounded-xl p-4 transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5"
    >
      {/* Header: format badge + date */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
          {deck.format_name || deck.format_code}
        </Badge>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {relativeTime(deck.created_at)}
        </span>
      </div>

      {/* Deck name */}
      <h3 className="font-display text-lg font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2 mb-1">
        {deck.name}
      </h3>

      {/* Description */}
      {deck.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {deck.description}
        </p>
      )}

      <div className="mt-auto" />

      {/* Author */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
          {(deck.display_name || 'U').charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-muted-foreground truncate">
          {deck.display_name || 'Usuario'}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className={`h-3.5 w-3.5 ${deck.viewer_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
          {deck.like_count}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {deck.view_count}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {deck.comment_count}
        </span>
      </div>
    </Link>
  );
}
