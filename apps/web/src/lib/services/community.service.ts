/**
 * Community service — likes, comments, follows, public gallery, trending.
 * Doc reference: 20260218000000_community_social.sql
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 *   2026-02-18 — Enriquecimiento CARDSD para galería: portada, cartas clave, coste promedio, raza y edición.
 *   2026-02-19 — Detalle público enriquecido con nombres de edición/raza + variante de impresión.
 *   2026-02-19 — Bugfix: el coste promedio de CARDSD excluye cartas de Oro.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { PublicDeckFilters } from '@myl/shared';

import { AppError } from '../api/errors';

type Client = SupabaseClient<Database>;

interface DeckCardsDKeyCard {
  card_printing_id: string;
  name: string;
  image_url: string | null;
  qty: number;
}

interface DeckCardsDSummary {
  cover_image_url: string | null;
  avg_cost: number | null;
  total_copies: number;
  unique_cards: number;
  key_cards_count: number;
  race_name: string | null;
  edition_name: string | null;
  key_cards: DeckCardsDKeyCard[];
}

interface DeckListBaseRow {
  deck_id: string;
  race_id: string | null;
  edition_id: string | null;
  cover_image_url?: string | null;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isGoldType(typeCode?: string | null, typeName?: string | null) {
  const raw = normalizeText(`${typeCode ?? ''} ${typeName ?? ''}`);
  return raw.includes('oro') || raw.includes('gold');
}

function pickMostFrequentId(counts: Map<string, number>): string | null {
  let bestId: string | null = null;
  let best = -1;
  for (const [id, count] of counts.entries()) {
    if (count > best) {
      best = count;
      bestId = id;
    }
  }
  return bestId;
}

async function buildDeckCardsDSummaries(
  supabase: Client,
  items: DeckListBaseRow[],
  coverOverrides?: Map<string, string | null>,
): Promise<Map<string, DeckCardsDSummary>> {
  const result = new Map<string, DeckCardsDSummary>();
  if (items.length === 0) return result;

  const deckIds = [...new Set(items.map((item) => item.deck_id))];
  const itemByDeckId = new Map(items.map((item) => [item.deck_id, item]));

  const { data: versions, error: versionsError } = await supabase
    .from('deck_versions')
    .select('deck_id, deck_version_id, version_number')
    .in('deck_id', deckIds)
    .order('deck_id', { ascending: true })
    .order('version_number', { ascending: false });

  if (versionsError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar versiones de mazo para CARDSD', { error: versionsError });
  }

  const latestByDeck = new Map<string, string>();
  for (const row of versions ?? []) {
    if (!latestByDeck.has(row.deck_id)) {
      latestByDeck.set(row.deck_id, row.deck_version_id);
    }
  }

  const versionIds = [...new Set(latestByDeck.values())];
  if (versionIds.length === 0) return result;

  const { data: versionCards, error: versionCardsError } = await supabase
    .from('deck_version_cards')
    .select('deck_version_id, card_printing_id, qty, is_key_card, is_starting_gold')
    .in('deck_version_id', versionIds);

  if (versionCardsError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar cartas de versión para CARDSD', { error: versionCardsError });
  }

  const printingIds = [...new Set((versionCards ?? []).map((row) => row.card_printing_id))];
  const { data: printings, error: printingsError } = printingIds.length > 0
    ? await supabase
      .from('card_printings')
      .select('card_printing_id, card_id, image_url, edition_id')
      .in('card_printing_id', printingIds)
    : { data: [], error: null };

  if (printingsError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar impresiones para CARDSD', { error: printingsError });
  }

  const printingById = new Map((printings ?? []).map((row) => [row.card_printing_id, row]));
  const cardIds = [...new Set((printings ?? []).map((row) => row.card_id))];

  const { data: cards, error: cardsError } = cardIds.length > 0
    ? await supabase
      .from('cards')
      .select('card_id, name, cost, race_id, card_type_id')
      .in('card_id', cardIds)
    : { data: [], error: null };

  if (cardsError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar cartas para CARDSD', { error: cardsError });
  }

  const cardById = new Map((cards ?? []).map((row) => [row.card_id, row]));
  const cardTypeIds = [...new Set((cards ?? []).map((row) => row.card_type_id).filter(Boolean) as string[])];
  const { data: cardTypes, error: cardTypesError } = cardTypeIds.length > 0
    ? await supabase
      .from('card_types')
      .select('card_type_id, name, code')
      .in('card_type_id', cardTypeIds)
    : { data: [], error: null };
  if (cardTypesError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar tipos de carta para CARDSD', { error: cardTypesError });
  }
  const cardTypeById = new Map((cardTypes ?? []).map((row) => [row.card_type_id, row]));
  const deckIdByVersionId = new Map<string, string>(
    [...latestByDeck.entries()].map(([deckId, versionId]) => [versionId, deckId]),
  );

  const editionVotesByDeck = new Map<string, Map<string, number>>();
  const raceVotesByDeck = new Map<string, Map<string, number>>();
  const keyCardsByDeck = new Map<string, Map<string, DeckCardsDKeyCard>>();
  const featuredCardsByDeck = new Map<string, Map<string, DeckCardsDKeyCard>>();
  const coverByDeck = new Map<string, string | null>();
  const totalsByDeck = new Map<string, {
    totalCopies: number;
    uniqueCards: number;
    costSum: number;
    costCount: number;
  }>();

  for (const deckId of deckIds) {
    editionVotesByDeck.set(deckId, new Map());
    raceVotesByDeck.set(deckId, new Map());
    keyCardsByDeck.set(deckId, new Map());
    featuredCardsByDeck.set(deckId, new Map());
    coverByDeck.set(deckId, coverOverrides?.get(deckId) ?? itemByDeckId.get(deckId)?.cover_image_url ?? null);
    totalsByDeck.set(deckId, { totalCopies: 0, uniqueCards: 0, costSum: 0, costCount: 0 });
  }

  for (const row of versionCards ?? []) {
    const deckId = deckIdByVersionId.get(row.deck_version_id);
    if (!deckId) continue;

    const qty = Math.max(0, row.qty ?? 0);
    if (qty <= 0) continue;

    const totals = totalsByDeck.get(deckId);
    if (!totals) continue;
    totals.totalCopies += qty;
    totals.uniqueCards += 1;

    const printing = printingById.get(row.card_printing_id);
    const card = printing ? cardById.get(printing.card_id) : null;

    if (!coverByDeck.get(deckId) && printing?.image_url) {
      coverByDeck.set(deckId, printing.image_url);
    }

    const cardType = card?.card_type_id ? cardTypeById.get(card.card_type_id) : null;
    const isGold = isGoldType(cardType?.code, cardType?.name);
    const resolvedCost =
      typeof card?.cost === 'number' && Number.isFinite(card.cost)
        ? card.cost
        : null;

    if (!isGold && resolvedCost !== null) {
      totals.costSum += resolvedCost * qty;
      totals.costCount += qty;
    }

    if (printing?.edition_id) {
      const counts = editionVotesByDeck.get(deckId)!;
      counts.set(printing.edition_id, (counts.get(printing.edition_id) ?? 0) + qty);
    }
    if (card?.race_id) {
      const counts = raceVotesByDeck.get(deckId)!;
      counts.set(card.race_id, (counts.get(card.race_id) ?? 0) + qty);
    }

    const targetMap = row.is_key_card ? keyCardsByDeck.get(deckId)! : featuredCardsByDeck.get(deckId)!;
    const existing = targetMap.get(row.card_printing_id);
    const cardName = card?.name ?? 'Carta';
    if (existing) {
      existing.qty += qty;
    } else {
      targetMap.set(row.card_printing_id, {
        card_printing_id: row.card_printing_id,
        name: cardName,
        image_url: printing?.image_url ?? null,
        qty,
      });
    }
  }

  const baseEditionIds = [...new Set(items.map((item) => item.edition_id).filter(Boolean) as string[])];
  const votedEditionIds = [...new Set(
    [...editionVotesByDeck.values()].flatMap((map) => [...map.keys()]),
  )];
  const editionIds = [...new Set([...baseEditionIds, ...votedEditionIds])];

  const baseRaceIds = [...new Set(items.map((item) => item.race_id).filter(Boolean) as string[])];
  const votedRaceIds = [...new Set(
    [...raceVotesByDeck.values()].flatMap((map) => [...map.keys()]),
  )];
  const raceIds = [...new Set([...baseRaceIds, ...votedRaceIds])];

  const { data: editions, error: editionsError } = editionIds.length > 0
    ? await supabase
      .from('editions')
      .select('edition_id, name, code')
      .in('edition_id', editionIds)
    : { data: [], error: null };
  if (editionsError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar ediciones para CARDSD', { error: editionsError });
  }

  const { data: races, error: racesError } = raceIds.length > 0
    ? await supabase
      .from('races')
      .select('race_id, name')
      .in('race_id', raceIds)
    : { data: [], error: null };
  if (racesError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar razas para CARDSD', { error: racesError });
  }

  const editionById = new Map((editions ?? []).map((row) => [row.edition_id, row]));
  const raceById = new Map((races ?? []).map((row) => [row.race_id, row]));

  for (const deckId of deckIds) {
    const base = itemByDeckId.get(deckId);
    const totals = totalsByDeck.get(deckId)!;
    const keyMap = keyCardsByDeck.get(deckId)!;
    const featuredMap = featuredCardsByDeck.get(deckId)!;
    const selectedCards = keyMap.size > 0 ? keyMap : featuredMap;
    const keyCards = [...selectedCards.values()]
      .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name, 'es'))
      .slice(0, 4);

    const votedRaceId = pickMostFrequentId(raceVotesByDeck.get(deckId)!);
    const votedEditionId = pickMostFrequentId(editionVotesByDeck.get(deckId)!);
    const raceId = base?.race_id ?? votedRaceId;
    const editionId = base?.edition_id ?? votedEditionId;

    const avgCost = totals.costCount > 0
      ? Number((totals.costSum / totals.costCount).toFixed(2))
      : null;

    const coverImage = coverByDeck.get(deckId) ?? keyCards[0]?.image_url ?? null;
    result.set(deckId, {
      cover_image_url: coverImage,
      avg_cost: avgCost,
      total_copies: totals.totalCopies,
      unique_cards: totals.uniqueCards,
      key_cards_count: keyMap.size,
      race_name: raceId ? (raceById.get(raceId)?.name ?? null) : null,
      edition_name: editionId ? (editionById.get(editionId)?.name ?? null) : null,
      key_cards: keyCards,
    });
  }

  return result;
}

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

  const deckIds = items.map((item: Record<string, unknown>) => item.deck_id as string);
  const { data: deckCovers, error: deckCoverError } = await supabase
    .from('decks')
    .select('deck_id, cover_image_url')
    .in('deck_id', deckIds);
  if (deckCoverError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar portada de mazos para CARDSD', { error: deckCoverError });
  }
  const coverMap = new Map((deckCovers ?? []).map((row) => [row.deck_id, row.cover_image_url ?? null]));

  const cardsdByDeckId = await buildDeckCardsDSummaries(
    supabase,
    items.map((item: Record<string, unknown>) => ({
      deck_id: item.deck_id as string,
      race_id: (item.race_id as string | null) ?? null,
      edition_id: (item.edition_id as string | null) ?? null,
      cover_image_url: coverMap.get(item.deck_id as string) ?? null,
    })),
    coverMap,
  );

  return {
    items: items.map((d: Record<string, unknown>) => ({
      ...d,
      viewer_has_liked: likedDeckIds.has(d.deck_id as string),
      cardsd: cardsdByDeckId.get(d.deck_id as string) ?? null,
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
  const editionVotes = new Map<string, number>();
  const raceVotes = new Map<string, number>();

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
          rarity_tier_id,
          printing_variant,
          edition:editions(edition_id, name, code)
        `)
        .in('card_printing_id', printingIds);

      const cardIds = [...new Set((printings ?? []).map((p) => p.card_id))];
      const { data: cardData } = await supabase
        .from('cards')
        .select('card_id, name, card_type_id, cost, ally_strength, race_id, card_type:card_types(name, code), race:races(race_id, name)')
        .in('card_id', cardIds);

      const cardMap = new Map((cardData ?? []).map((c) => [c.card_id, c]));
      const printingMap = new Map((printings ?? []).map((p) => [p.card_printing_id, p]));

      cards = versionCards.map((vc) => {
        const printing = printingMap.get(vc.card_printing_id);
        const card = printing ? cardMap.get(printing.card_id) : null;
        const qty = Math.max(1, vc.qty ?? 1);

        if (printing?.edition_id) {
          editionVotes.set(
            printing.edition_id,
            (editionVotes.get(printing.edition_id) ?? 0) + qty,
          );
        }
        if (card?.race_id) {
          raceVotes.set(card.race_id, (raceVotes.get(card.race_id) ?? 0) + qty);
        }

        return {
          ...vc,
          printing: printing ?? null,
          card: card ?? null,
        };
      });
    }
  }

  const resolvedEditionId = deck.edition_id ?? pickMostFrequentId(editionVotes);
  const resolvedRaceId = deck.race_id ?? pickMostFrequentId(raceVotes);

  const [{ data: edition }, { data: race }] = await Promise.all([
    resolvedEditionId
      ? supabase
        .from('editions')
        .select('edition_id, name, code')
        .eq('edition_id', resolvedEditionId)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    resolvedRaceId
      ? supabase
        .from('races')
        .select('race_id, name')
        .eq('race_id', resolvedRaceId)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

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

  const authorDisplayName = author?.display_name ?? 'Usuario';

  return {
    ...deck,
    author: {
      user_id: deck.user_id,
      display_name: authorDisplayName,
      avatar_url: author?.avatar_url ?? null,
    },
    format: format ?? null,
    edition: edition ?? null,
    race: race ?? null,
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
  const items = (data ?? []) as Record<string, unknown>[];
  if (items.length === 0) return [];

  const deckIds = items.map((item) => item.deck_id as string);
  const { data: deckCovers, error: deckCoverError } = await supabase
    .from('decks')
    .select('deck_id, cover_image_url')
    .in('deck_id', deckIds);
  if (deckCoverError) {
    throw new AppError('INTERNAL_ERROR', 'Error al cargar portada de mazos para CARDSD', { error: deckCoverError });
  }
  const coverMap = new Map((deckCovers ?? []).map((row) => [row.deck_id, row.cover_image_url ?? null]));

  const cardsdByDeckId = await buildDeckCardsDSummaries(
    supabase,
    items.map((item) => ({
      deck_id: item.deck_id as string,
      race_id: (item.race_id as string | null) ?? null,
      edition_id: (item.edition_id as string | null) ?? null,
      cover_image_url: coverMap.get(item.deck_id as string) ?? null,
    })),
    coverMap,
  );

  return items.map((item) => ({
    ...item,
    cardsd: cardsdByDeckId.get(item.deck_id as string) ?? null,
  }));
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
