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

const CONDITION_CODES = [
  'PERFECTA',
  'CASI PERFECTA',
  'EXCELENTE',
  'BUENA',
  'POCO USO',
  'JUGADA',
  'MALAS CONDICIONES',
] as const;
const CONDITION_ALIASES: Record<string, (typeof CONDITION_CODES)[number]> = {
  MINT: 'PERFECTA',
  NEAR_MINT: 'CASI PERFECTA',
  EXCELLENT: 'EXCELENTE',
  GOOD: 'BUENA',
  LIGHT_PLAYED: 'POCO USO',
  PLAYED: 'JUGADA',
  POOR: 'MALAS CONDICIONES',
};

/**
 * Get user's collection with filters and pagination
 */
export async function getUserCollection(
  supabase: Client,
  userId: string,
  filters: CollectionFilters & { collection_id?: string | null },
) {
  let query = supabase
    .from('user_cards')
    .select(
      `
      *,
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

  // Collection folder filter — only apply if collection_id column exists
  // When collection_id filter is undefined, show all cards (no filter applied)
  if (filters.collection_id === null) {
    // "General" folder = cards without a collection
    query = query.is('collection_id' as string, null);
  } else if (filters.collection_id) {
    query = query.eq('collection_id' as string, filters.collection_id);
  }

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

  // Legal status filter (on card_printings)
  if ((filters as Record<string, unknown>).legal_status) {
    query = query.eq('card_printing.legal_status', (filters as Record<string, unknown>).legal_status);
  }

  if (filters.min_qty) {
    query = query.gte('qty', filters.min_qty);
  }

  // Sorting
  // Supabase PostgREST only supports ordering by direct columns, not nested relations.
  // For nested ordering, sort client-side after fetching.
  const directSortMap: Record<string, { column: string; ascending: boolean }> = {
    qty_asc: { column: 'qty', ascending: true },
    qty_desc: { column: 'qty', ascending: false },
    acquired_asc: { column: 'acquired_at', ascending: true },
    acquired_desc: { column: 'acquired_at', ascending: false },
    price_asc: { column: 'user_price', ascending: true },
    price_desc: { column: 'user_price', ascending: false },
  };

  const directSort = directSortMap[filters.sort || ''];
  if (directSort) {
    query = query.order(directSort.column, { ascending: directSort.ascending });
  } else {
    // Default: order by created_at desc (most recent first)
    query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const limit = Math.min(filters.limit || 50, 200);
  query = query.limit(limit);

  if (filters.cursor) {
    // Implement cursor-based pagination if needed
    // For now, using offset
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getUserCollection] Supabase error:', JSON.stringify(error));
    throw new AppError('INTERNAL_ERROR', `Error al cargar colección: ${error.message}`, { error });
  }

  const rows = (data ?? []) as unknown as (UserCardWithRelations & { card_printing_id: string })[];

  // Batch-fetch store min prices for all printings
  const printingIds = rows.map((r) => r.card_printing?.card_printing_id ?? (r as Record<string, unknown>).card_printing_id as string).filter(Boolean);
  const priceMap = new Map<string, number>();

  if (printingIds.length > 0) {
    const { data: storePrices } = await supabase
      .from('store_printing_links')
      .select('card_printing_id, last_price')
      .in('card_printing_id', printingIds)
      .eq('is_active', true)
      .not('last_price', 'is', null);

    if (storePrices) {
      for (const sp of storePrices) {
        const pid = sp.card_printing_id as string;
        const price = sp.last_price as number;
        const current = priceMap.get(pid);
        if (current === undefined || price < current) {
          priceMap.set(pid, price);
        }
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    store_min_price: priceMap.get(row.card_printing?.card_printing_id ?? '') ?? null,
  })) as unknown as UserCardWithRelations[];
}

/**
 * Add card to collection.
 * Only merges (increments qty) if same printing+condition+collection AND no custom price.
 * Otherwise creates a new row — user can have multiple copies with different prices.
 */
export async function addToCollection(
  supabase: Client,
  userId: string,
  input: AddToCollection,
) {
  // Determine target collection_id (null = General)
  const targetCollectionId = input.collection_id ?? null;

  // Only merge if no custom price is set (user wants uniform copies)
  if (!input.user_price) {
    const { data: existingRows } = await supabase
      .from('user_cards')
      .select('user_card_id, qty')
      .eq('user_id', userId)
      .eq('card_printing_id', input.card_printing_id)
      .eq('condition', input.condition)
      .is('user_price', null)
      .limit(1);

    const existing = existingRows?.[0];

    if (existing) {
      const { data, error } = await supabase
        .from('user_cards')
        .update({ qty: existing.qty + input.qty })
        .eq('user_card_id', existing.user_card_id)
        .select()
        .single();

      if (error) {
        console.error('[addToCollection] Supabase update error:', JSON.stringify(error));
        throw new AppError('INTERNAL_ERROR', `Error al actualizar colección: ${error.message}`);
      }
      return data;
    }
  }

  // Insert new entry — always in target collection
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    card_printing_id: input.card_printing_id,
    qty: input.qty,
    condition: input.condition,
    notes: input.notes || null,
    collection_id: targetCollectionId,
  };
  if (input.user_price != null) insertPayload.user_price = input.user_price;
  if (input.is_for_sale) insertPayload.is_for_sale = true;
  if (input.acquired_at) insertPayload.acquired_at = input.acquired_at;

  const { data, error } = await supabase
    .from('user_cards')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('[addToCollection] Supabase insert error:', JSON.stringify(error));
    throw new AppError('INTERNAL_ERROR', `Error al agregar a colección: ${error.message}`);
  }
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
  // Total cards, printings y precios
  const { data: totals, error: totalsError } = await supabase
    .from('user_cards')
    .select('qty, card_printing_id, user_price, condition')
    .eq('user_id', userId);

  if (totalsError) {
    throw new AppError('INTERNAL_ERROR', 'Error al calcular totales de colecciÃ³n', { error: totalsError });
  }

  const totalCards = totals?.reduce((sum, item) => sum + (item.qty ?? 0), 0) || 0;
  const totalPrintings = totals?.length || 0;

  // Precios de tienda (mÃ­nimo por impresiÃ³n)
  const priceMap = new Map<string, number>();
  if (totals && totals.length > 0) {
    const printingIds = totals.map((t) => t.card_printing_id).filter(Boolean);
    if (printingIds.length > 0) {
      const { data: storePrices } = await supabase
        .from('store_printing_links')
        .select('card_printing_id, last_price')
        .in('card_printing_id', printingIds)
        .eq('is_active', true)
        .not('last_price', 'is', null);

      if (storePrices) {
        for (const sp of storePrices) {
          const pid = sp.card_printing_id as string;
          const price = sp.last_price as number;
          const current = priceMap.get(pid);
          if (current === undefined || price < current) {
            priceMap.set(pid, price);
          }
        }
      }
    }
  }

  let totalUserValue = 0;
  let totalStoreValue = 0;
  if (totals) {
    for (const row of totals) {
      const qty = row.qty ?? 0;
      if (row.user_price != null) {
        totalUserValue += row.user_price * qty;
      }
      const storePrice = priceMap.get(row.card_printing_id);
      if (storePrice != null) {
        totalStoreValue += storePrice * qty;
      }
    }
  }

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
  const byCondition: CollectionStats['by_condition'] = {};
  for (const code of CONDITION_CODES) {
    byCondition[code] = 0;
  }
  if (totals) {
    for (const item of totals) {
      const normalized = CONDITION_ALIASES[item.condition] ?? item.condition;
      const condition = normalized as keyof CollectionStats['by_condition'];
      if (byCondition[condition] == null) byCondition[condition] = 0;
      byCondition[condition] = (byCondition[condition] ?? 0) + (item.qty ?? 0);
    }
  }

  return {
    total_cards: totalCards,
    total_printings: totalPrintings,
    total_unique_cards: uniqueCount || 0,
    total_user_value: Math.round(totalUserValue * 100) / 100,
    total_store_value: Math.round(totalStoreValue * 100) / 100,
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
