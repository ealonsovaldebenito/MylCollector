import type { SupabaseClient as Client } from '@supabase/supabase-js';
import {
  type CollectionStats,
  type MissingCard,
  type BlockCompletion,
  type EditionCompletion,
  type AddToCollection,
  type UpdateCollectionItem,
  type BulkCollectionUpdate,
  type CollectionFilters,
  type UserCardWithRelations,
} from '@myl/shared';
import { AppError } from '../api/errors';

/**
 * Get user's collection with filters and pagination
 */
export async function getUserCollection(
  supabase: Client,
  userId: string,
  filters: CollectionFilters,
) {
  let query = supabase
    .from('user_cards')
    .select(
      `
      user_card_id,
      user_id,
      card_printing_id,
      qty,
      condition,
      notes,
      acquired_at,
      created_at,
      updated_at,
      card_printing:card_printings!inner(
        card_printing_id,
        image_url,
        legal_status,
        card:cards!inner(
          card_id,
          name,
          card_type:card_types!inner(name, code),
          race:races(name, code),
          cost
        ),
        edition:editions!inner(edition_id, block_id, name, code),
        rarity_tier:rarity_tiers(name, code)
      )
    `,
    )
    .eq('user_id', userId);

  // Apply filters
  if (filters.q) {
    query = query.ilike('card_printing.card.name', `%${filters.q}%`);
  }

  if (filters.block_id) {
    query = query.eq('card_printing.edition.block_id', filters.block_id);
  }

  if (filters.edition_id) {
    query = query.eq('card_printing.edition_id', filters.edition_id);
  }

  if (filters.card_type_id) {
    query = query.eq('card_printing.card.card_type_id', filters.card_type_id);
  }

  if (filters.race_id) {
    query = query.eq('card_printing.card.race_id', filters.race_id);
  }

  if (filters.rarity_tier_id) {
    query = query.eq('card_printing.rarity_tier_id', filters.rarity_tier_id);
  }

  if (filters.condition) {
    query = query.eq('condition', filters.condition);
  }

  if (filters.min_qty) {
    query = query.gte('qty', filters.min_qty);
  }

  // Sorting
  const sortMap = {
    name_asc: { column: 'card_printing.card.name', ascending: true },
    name_desc: { column: 'card_printing.card.name', ascending: false },
    qty_asc: { column: 'qty', ascending: true },
    qty_desc: { column: 'qty', ascending: false },
    acquired_asc: { column: 'acquired_at', ascending: true },
    acquired_desc: { column: 'acquired_at', ascending: false },
    cost_asc: { column: 'card_printing.card.cost', ascending: true },
    cost_desc: { column: 'card_printing.card.cost', ascending: false },
  };

  const sort = sortMap[filters.sort || 'name_asc'];
  if (sort) {
    query = query.order(sort.column, { ascending: sort.ascending });
  }

  // Pagination
  const limit = Math.min(filters.limit || 50, 200);
  query = query.limit(limit);

  if (filters.cursor) {
    // Implement cursor-based pagination if needed
    // For now, using offset
  }

  const { data, error } = await query;

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar colección', { error });

  return (data ?? []) as unknown as UserCardWithRelations[];
}

/**
 * Add card to collection (or update qty if exists)
 */
export async function addToCollection(
  supabase: Client,
  userId: string,
  input: AddToCollection,
) {
  // Check if card already exists in collection
  const { data: existing } = await supabase
    .from('user_cards')
    .select('user_card_id, qty')
    .eq('user_id', userId)
    .eq('card_printing_id', input.card_printing_id)
    .eq('condition', input.condition)
    .single();

  if (existing) {
    // Update existing entry
    const { data, error } = await supabase
      .from('user_cards')
      .update({ qty: existing.qty + input.qty })
      .eq('user_card_id', existing.user_card_id)
      .select()
      .single();

    if (error) throw new AppError('INTERNAL_ERROR', 'Error al actualizar colección');
    return data;
  }

  // Insert new entry
  const { data, error } = await supabase
    .from('user_cards')
    .insert({
      user_id: userId,
      card_printing_id: input.card_printing_id,
      qty: input.qty,
      condition: input.condition,
      notes: input.notes || null,
      acquired_at: input.acquired_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al agregar a colección');
  return data;
}

/**
 * Update collection item
 */
export async function updateCollectionItem(
  supabase: Client,
  userId: string,
  userCardId: string,
  updates: UpdateCollectionItem,
) {
  const { data, error } = await supabase
    .from('user_cards')
    .update(updates)
    .eq('user_card_id', userCardId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al actualizar item');
  return data;
}

/**
 * Remove card from collection
 */
export async function removeFromCollection(
  supabase: Client,
  userId: string,
  userCardId: string,
) {
  const { error } = await supabase
    .from('user_cards')
    .delete()
    .eq('user_card_id', userCardId)
    .eq('user_id', userId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar de colección');
}

/**
 * Bulk update collection (for CSV import)
 */
export async function bulkUpdateCollection(
  supabase: Client,
  userId: string,
  bulkUpdate: BulkCollectionUpdate,
) {
  if (bulkUpdate.mode === 'REPLACE') {
    // Delete all existing entries
    await supabase.from('user_cards').delete().eq('user_id', userId);
  }

  const operations = bulkUpdate.updates.map(async (update) => {
    // Check if exists
    const { data: existing } = await supabase
      .from('user_cards')
      .select('user_card_id, qty')
      .eq('user_id', userId)
      .eq('card_printing_id', update.card_printing_id)
      .eq('condition', update.condition)
      .single();

    if (existing && bulkUpdate.mode === 'MERGE') {
      // Update qty
      return supabase
        .from('user_cards')
        .update({ qty: existing.qty + update.qty })
        .eq('user_card_id', existing.user_card_id);
    }

    // Insert new
    return supabase.from('user_cards').insert({
      user_id: userId,
      card_printing_id: update.card_printing_id,
      qty: update.qty,
      condition: update.condition,
      notes: update.notes || null,
    });
  });

  await Promise.all(operations);
  return { success: true, count: bulkUpdate.updates.length };
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(
  supabase: Client,
  userId: string,
): Promise<CollectionStats> {
  // Total cards and printings
  const { data: totals } = await supabase
    .from('user_cards')
    .select('qty, card_printing_id')
    .eq('user_id', userId);

  const totalCards = totals?.reduce((sum, item) => sum + item.qty, 0) || 0;
  const totalPrintings = totals?.length || 0;

  // Unique cards (by card_id)
  const { count: uniqueCount } = await supabase
    .from('user_cards')
    .select('card_printing:card_printings!inner(card_id)', { count: 'exact', head: true })
    .eq('user_id', userId);

  // By block
  const { data: byBlockData } = await supabase
    .from('user_cards')
    .select(
      `
      qty,
      card_printing:card_printings!inner(
        edition:editions!inner(
          block:blocks!inner(block_id, name)
        )
      )
    `,
    )
    .eq('user_id', userId);

  const byBlock: CollectionStats['by_block'] = {};
  if (byBlockData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of byBlockData as any[]) {
      const blockId = item.card_printing.edition.block.block_id;
      const blockName = item.card_printing.edition.block.name;
      if (!byBlock[blockId]) {
        byBlock[blockId] = { block_name: blockName, count: 0, unique_cards: 0 };
      }
      byBlock[blockId]!.count += item.qty;
    }
  }

  // By rarity
  const { data: byRarityData } = await supabase
    .from('user_cards')
    .select(
      `
      qty,
      card_printing:card_printings!inner(
        rarity_tier:rarity_tiers(rarity_tier_id, name)
      )
    `,
    )
    .eq('user_id', userId);

  const byRarity: CollectionStats['by_rarity'] = {};
  if (byRarityData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of byRarityData as any[]) {
      const rarity = item.card_printing.rarity_tier;
      if (rarity) {
        const rarityId = rarity.rarity_tier_id;
        const rarityName = rarity.name;
        if (!byRarity[rarityId]) {
          byRarity[rarityId] = { rarity_name: rarityName, count: 0 };
        }
        byRarity[rarityId]!.count += item.qty;
      }
    }
  }

  // By condition
  const { data: byConditionData } = await supabase
    .from('user_cards')
    .select('qty, condition')
    .eq('user_id', userId);

  const byCondition: CollectionStats['by_condition'] = {};
  if (byConditionData) {
    for (const item of byConditionData) {
      const condition = item.condition as keyof CollectionStats['by_condition'];
      if (!byCondition[condition]) {
        byCondition[condition] = 0;
      }
      byCondition[condition] = (byCondition[condition] ?? 0) + item.qty;
    }
  }

  return {
    total_cards: totalCards,
    total_printings: totalPrintings,
    total_unique_cards: uniqueCount || 0,
    by_block: byBlock,
    by_rarity: byRarity,
    by_condition: byCondition,
  };
}

/**
 * Get missing cards for a deck version
 */
export async function getMissingCardsForDeck(
  supabase: Client,
  userId: string,
  deckVersionId: string,
): Promise<MissingCard[]> {
  // Get deck cards
  const { data: deckCards, error: deckError } = await supabase
    .from('deck_version_cards')
    .select(
      `
      card_printing_id,
      qty,
      card_printing:card_printings!inner(
        image_url,
        card:cards!inner(name),
        edition:editions!inner(name),
        rarity_tier:rarity_tiers(name)
      )
    `,
    )
    .eq('deck_version_id', deckVersionId);

  if (deckError || !deckCards) {
    throw new AppError('NOT_FOUND', 'Versión de mazo no encontrada');
  }

  // Get user's collection
  const { data: collection } = await supabase
    .from('user_cards')
    .select('card_printing_id, qty')
    .eq('user_id', userId);

  const collectionMap = new Map<string, number>();
  if (collection) {
    for (const item of collection) {
      const existing = collectionMap.get(item.card_printing_id) || 0;
      collectionMap.set(item.card_printing_id, existing + item.qty);
    }
  }

  // Calculate missing cards
  const missing: MissingCard[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const deckCard of deckCards as any[]) {
    const qtyOwned = collectionMap.get(deckCard.card_printing_id) || 0;
    const qtyNeeded = deckCard.qty;

    if (qtyOwned < qtyNeeded) {
      missing.push({
        card_printing_id: deckCard.card_printing_id,
        card_name: deckCard.card_printing.card.name,
        edition_name: deckCard.card_printing.edition.name,
        image_url: deckCard.card_printing.image_url,
        qty_needed: qtyNeeded,
        qty_owned: qtyOwned,
        qty_missing: qtyNeeded - qtyOwned,
        price_estimate: null, // TODO: Integrate with pricing when available
        rarity_tier_name: deckCard.card_printing.rarity_tier?.name || null,
      });
    }
  }

  return missing;
}

/**
 * Get completion stats by block
 */
export async function getCompletionByBlock(
  supabase: Client,
  userId: string,
  blockId: string,
): Promise<BlockCompletion> {
  // Total unique cards in block
  const { count: totalCount } = await supabase
    .from('card_printings')
    .select('card_id', { count: 'exact', head: true })
    .eq('editions.block_id', blockId);

  // Owned unique cards in block
  const { data: ownedData } = await supabase
    .from('user_cards')
    .select(
      `
      card_printing:card_printings!inner(
        card_id,
        edition:editions!inner(block_id)
      )
    `,
    )
    .eq('user_id', userId)
    .eq('card_printing.edition.block_id', blockId);

  const uniqueOwned = new Set(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ownedData?.map((item: any) => item.card_printing.card_id) || [],
  ).size;

  // Get block name
  const { data: block } = await supabase
    .from('blocks')
    .select('name')
    .eq('block_id', blockId)
    .single();

  const total = totalCount || 1;
  const percentage = (uniqueOwned / total) * 100;

  return {
    block_id: blockId,
    block_name: block?.name || 'Unknown',
    total_unique_cards: total,
    owned_unique_cards: uniqueOwned,
    completion_percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Get completion stats by edition
 */
export async function getCompletionByEdition(
  supabase: Client,
  userId: string,
  editionId: string,
): Promise<EditionCompletion> {
  // Total printings in edition
  const { count: totalCount } = await supabase
    .from('card_printings')
    .select('card_printing_id', { count: 'exact', head: true })
    .eq('edition_id', editionId);

  // Owned printings in edition
  const { count: ownedCount } = await supabase
    .from('user_cards')
    .select('card_printing_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('card_printings.edition_id', editionId);

  // Get edition info
  const { data: edition } = await supabase
    .from('editions')
    .select('name, block:blocks!inner(block_id, name)')
    .eq('edition_id', editionId)
    .single();

  const total = totalCount || 1;
  const owned = ownedCount || 0;
  const percentage = (owned / total) * 100;

  return {
    edition_id: editionId,
    edition_name: edition?.name || 'Unknown',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    block_id: (edition?.block as any)?.block_id || '',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    block_name: (edition?.block as any)?.name || 'Unknown',
    total_printings: total,
    owned_printings: owned,
    completion_percentage: Math.round(percentage * 100) / 100,
  };
}
