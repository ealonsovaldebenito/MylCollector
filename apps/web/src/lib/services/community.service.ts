/**
 * Community service — likes, comments, follows, public gallery, trending.
 * Doc reference: 20260218000000_community_social.sql
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { PublicDeckFilters } from '@myl/shared';

import { AppError } from '../api/errors';

type Client = SupabaseClient<Database>;

// ============================================================================
// Public Deck Gallery
// ============================================================================

export async function getPublicDecks(
  supabase: Client,
  filters: PublicDeckFilters,
  viewerId?: string,
  isAdmin = false,
) {
  const { data, error } = await supabase.rpc('get_public_decks', {
    p_format_id: filters.format_id ?? null,
    p_edition_id: filters.edition_id ?? null,
    p_race_id: filters.race_id ?? null,
    p_q: filters.q ?? null,
    p_sort: filters.sort,
    p_limit: filters.limit,
    p_offset: filters.offset,
    p_is_admin: isAdmin,
  });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar mazos públicos', { error });

  const items = data ?? [];
  const totalCount = items.length > 0 ? (items[0] as { total_count?: number }).total_count ?? 0 : 0;

  // Enrich with viewer_has_liked
  let likedDeckIds = new Set<string>();
  if (viewerId && items.length > 0) {
    const deckIds = items.map((d: { deck_id: string }) => d.deck_id);
    const { data: likes } = await supabase
      .from('deck_likes')
      .select('deck_id')
      .eq('user_id', viewerId)
      .in('deck_id', deckIds);
    if (likes) likedDeckIds = new Set(likes.map((l) => l.deck_id));
  }

  return {
    items: items.map((d: Record<string, unknown>) => ({
      ...d,
      viewer_has_liked: likedDeckIds.has(d.deck_id as string),
    })),
    total_count: totalCount,
    has_more: filters.offset + filters.limit < totalCount,
  };
}

// ============================================================================
// Public Deck Detail
// ============================================================================

export async function getPublicDeckDetail(
  supabase: Client,
  deckId: string,
  viewerId?: string,
) {
  const { data: deck, error } = await supabase
    .from('decks')
    .select('*')
    .eq('deck_id', deckId)
    .eq('visibility', 'PUBLIC')
    .single();

  if (error || !deck) throw new AppError('NOT_FOUND', 'Mazo no encontrado');

  // Author info
  const { data: author } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .eq('user_id', deck.user_id)
    .single();

  // Format info
  const { data: format } = await supabase
    .from('formats')
    .select('format_id, name, code')
    .eq('format_id', deck.format_id)
    .single();

  // Deck cards (latest version)
  const { data: latestVersion } = await supabase
    .from('deck_versions')
    .select('deck_version_id')
    .eq('deck_id', deckId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  let cards: unknown[] = [];
  if (latestVersion) {
    const { data: versionCards } = await supabase
      .from('deck_version_cards')
      .select(`
        deck_version_card_id,
        qty,
        is_starting_gold,
        is_key_card,
        card_printing_id
      `)
      .eq('deck_version_id', latestVersion.deck_version_id);

    if (versionCards && versionCards.length > 0) {
      const printingIds = versionCards.map((c) => c.card_printing_id);
      const { data: printings } = await supabase
        .from('card_printings')
        .select(`
          card_printing_id,
          image_url,
          edition_id,
          card_id,
          rarity_tier_id
        `)
        .in('card_printing_id', printingIds);

      const cardIds = [...new Set((printings ?? []).map((p) => p.card_id))];
      const { data: cardData } = await supabase
        .from('cards')
        .select('card_id, name, card_type_id, cost, ally_strength, race_id, card_type:card_types(name, code)')
        .in('card_id', cardIds);

      const cardMap = new Map((cardData ?? []).map((c) => [c.card_id, c]));
      const printingMap = new Map((printings ?? []).map((p) => [p.card_printing_id, p]));

      cards = versionCards.map((vc) => {
        const printing = printingMap.get(vc.card_printing_id);
        const card = printing ? cardMap.get(printing.card_id) : null;
        return {
          ...vc,
          printing: printing ?? null,
          card: card ?? null,
        };
      });
    }
  }

  // Strategy sections
  const { data: strategy } = await supabase
    .from('deck_strategy_sections')
    .select('*')
    .eq('deck_id', deckId)
    .order('sort_order');

  // Viewer has liked?
  let viewerHasLiked = false;
  if (viewerId) {
    const { data: like } = await supabase
      .from('deck_likes')
      .select('like_id')
      .eq('deck_id', deckId)
      .eq('user_id', viewerId)
      .maybeSingle();
    viewerHasLiked = !!like;
  }

  return {
    ...deck,
    author: author ?? { user_id: deck.user_id, display_name: 'Usuario', avatar_url: null },
    format: format ?? null,
    cards,
    strategy: strategy ?? [],
    viewer_has_liked: viewerHasLiked,
  };
}

// ============================================================================
// Toggle Like
// ============================================================================

export async function toggleDeckLike(
  supabase: Client,
  deckId: string,
  userId: string,
) {
  // Check if already liked
  const { data: existing } = await supabase
    .from('deck_likes')
    .select('like_id')
    .eq('deck_id', deckId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('deck_likes')
      .delete()
      .eq('like_id', existing.like_id);
    if (error) throw new AppError('INTERNAL_ERROR', 'Error al quitar like', { error });

    const { data: deck } = await supabase
      .from('decks')
      .select('like_count')
      .eq('deck_id', deckId)
      .single();

    return { action: 'unliked' as const, like_count: deck?.like_count ?? 0 };
  }

  const { error } = await supabase
    .from('deck_likes')
    .insert({ deck_id: deckId, user_id: userId });
  if (error) throw new AppError('INTERNAL_ERROR', 'Error al dar like', { error });

  const { data: deck } = await supabase
    .from('decks')
    .select('like_count')
    .eq('deck_id', deckId)
    .single();

  return { action: 'liked' as const, like_count: deck?.like_count ?? 0 };
}

// ============================================================================
// Comments
// ============================================================================

export async function getDeckComments(supabase: Client, deckId: string) {
  const { data, error } = await supabase
    .from('deck_comments')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar comentarios', { error });

  const comments = data ?? [];
  if (comments.length === 0) return [];

  // Load author info
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  // Build threaded structure
  type CommentWithMeta = (typeof comments)[number] & {
    display_name: string | null;
    avatar_url: string | null;
    replies: CommentWithMeta[];
  };

  const enriched: CommentWithMeta[] = comments.map((c) => {
    const profile = profileMap.get(c.user_id);
    return {
      ...c,
      content: c.is_deleted ? '[Comentario eliminado]' : c.content,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      replies: [],
    };
  });

  const commentMap = new Map(enriched.map((c) => [c.comment_id, c]));
  const topLevel: CommentWithMeta[] = [];

  for (const c of enriched) {
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id)!.replies.push(c);
    } else {
      topLevel.push(c);
    }
  }

  return topLevel;
}

export async function createDeckComment(
  supabase: Client,
  deckId: string,
  userId: string,
  data: { content: string; parent_id?: string },
) {
  // Verify deck is public
  const { data: deck } = await supabase
    .from('decks')
    .select('deck_id, visibility')
    .eq('deck_id', deckId)
    .single();

  if (!deck || deck.visibility !== 'PUBLIC') {
    throw new AppError('FORBIDDEN', 'Solo se puede comentar en mazos públicos');
  }

  const { data: comment, error } = await supabase
    .from('deck_comments')
    .insert({
      deck_id: deckId,
      user_id: userId,
      content: data.content,
      parent_id: data.parent_id ?? null,
    })
    .select()
    .single();

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al crear comentario', { error });
  return comment;
}

export async function updateDeckComment(
  supabase: Client,
  commentId: string,
  userId: string,
  data: { content: string },
) {
  const { data: comment, error } = await supabase
    .from('deck_comments')
    .update({ content: data.content })
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error) throw new AppError('NOT_FOUND', 'Comentario no encontrado o no autorizado');
  return comment;
}

export async function deleteDeckComment(
  supabase: Client,
  commentId: string,
  userId: string,
) {
  const { error } = await supabase
    .from('deck_comments')
    .update({ is_deleted: true })
    .eq('comment_id', commentId)
    .eq('user_id', userId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar comentario', { error });
}

// ============================================================================
// Follow / Unfollow
// ============================================================================

export async function toggleFollow(
  supabase: Client,
  followerId: string,
  followeeId: string,
) {
  if (followerId === followeeId) {
    throw new AppError('VALIDATION_ERROR', 'No puedes seguirte a ti mismo');
  }

  const { data: existing } = await supabase
    .from('user_followers')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);
    if (error) throw new AppError('INTERNAL_ERROR', 'Error al dejar de seguir', { error });
    return { action: 'unfollowed' as const };
  }

  const { error } = await supabase
    .from('user_followers')
    .insert({ follower_id: followerId, followee_id: followeeId });
  if (error) throw new AppError('INTERNAL_ERROR', 'Error al seguir', { error });
  return { action: 'followed' as const };
}

// ============================================================================
// User Public Profile
// ============================================================================

export async function getUserPublicProfile(
  supabase: Client,
  userId: string,
  viewerId?: string,
) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url, bio, created_at')
    .eq('user_id', userId)
    .single();

  if (error || !profile) throw new AppError('NOT_FOUND', 'Usuario no encontrado');

  // Count public decks
  const { count: deckCount } = await supabase
    .from('decks')
    .select('deck_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('visibility', 'PUBLIC');

  // Total likes on their public decks
  const { data: likeData } = await supabase
    .from('decks')
    .select('like_count')
    .eq('user_id', userId)
    .eq('visibility', 'PUBLIC');

  const totalLikes = (likeData ?? []).reduce((sum, d) => sum + (d.like_count ?? 0), 0);

  // Followers / following counts
  const { count: followerCount } = await supabase
    .from('user_followers')
    .select('follower_id', { count: 'exact', head: true })
    .eq('followee_id', userId);

  const { count: followingCount } = await supabase
    .from('user_followers')
    .select('followee_id', { count: 'exact', head: true })
    .eq('follower_id', userId);

  // Viewer is following?
  let viewerIsFollowing = false;
  if (viewerId && viewerId !== userId) {
    const { data: follow } = await supabase
      .from('user_followers')
      .select('follower_id')
      .eq('follower_id', viewerId)
      .eq('followee_id', userId)
      .maybeSingle();
    viewerIsFollowing = !!follow;
  }

  return {
    ...profile,
    deck_count: deckCount ?? 0,
    total_likes: totalLikes,
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
    viewer_is_following: viewerIsFollowing,
  };
}

// ============================================================================
// Trending / Top Builders
// ============================================================================

export async function getTrendingDecks(supabase: Client, limit = 10) {
  const { data, error } = await supabase.rpc('get_public_decks', {
    p_sort: 'most_liked',
    p_limit: limit,
    p_offset: 0,
  });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar tendencias', { error });
  return data ?? [];
}

export async function getTopBuilders(supabase: Client, limit = 10) {
  // Users with most likes on public decks
  const { data: decks } = await supabase
    .from('decks')
    .select('user_id, like_count')
    .eq('visibility', 'PUBLIC')
    .gt('like_count', 0);

  if (!decks || decks.length === 0) return [];

  // Aggregate by user
  const userStats = new Map<string, { deck_count: number; total_likes: number }>();
  for (const d of decks) {
    const existing = userStats.get(d.user_id) ?? { deck_count: 0, total_likes: 0 };
    existing.deck_count++;
    existing.total_likes += d.like_count;
    userStats.set(d.user_id, existing);
  }

  // Sort by total likes
  const sorted = [...userStats.entries()]
    .sort((a, b) => b[1].total_likes - a[1].total_likes)
    .slice(0, limit);

  const userIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return sorted.map(([userId, stats]) => {
    const profile = profileMap.get(userId);
    return {
      user_id: userId,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      ...stats,
    };
  });
}

// ============================================================================
// View Count
// ============================================================================

export async function incrementDeckViewCount(supabase: Client, deckId: string) {
  const { error } = await supabase.rpc('increment_deck_view_count' as never, {
    p_deck_id: deckId,
  } as never);

  // Fallback if RPC doesn't exist yet: direct update
  if (error) {
    await supabase
      .from('decks')
      .update({ view_count: 1 } as never)
      .eq('deck_id', deckId);
  }
}
