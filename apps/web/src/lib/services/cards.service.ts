import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { CardFilters, CreateCard, UpdateCard, CreateCardPrinting, UpdateCardPrinting } from '@myl/shared';

import { AppError } from '../api/errors';

/**
 * Cards service - search, CRUD, printings.
 * Doc reference: 11_API_CONTRACTS.md, 03_DATA_MODEL_SQL.md
 *
 * Changelog:
 *   2026-02-18 - Admin printing delete hardening: cleanup derived refs + clear conflict errors.
 *   2026-02-18 - Printing mutations now support optional card ownership guard (card_id).
 */

type Client = SupabaseClient<Database>;

type PrintingMutationOptions = {
  cardId?: string;
};

type PrintingReferenceRule = {
  table: string;
  label: string;
  mode: 'block' | 'cleanup';
};

// Keep this list explicit so admin delete stays predictable and auditable.
const PRINTING_REFERENCE_RULES: PrintingReferenceRule[] = [
  { table: 'deck_version_cards', label: 'mazos', mode: 'block' },
  { table: 'user_cards', label: 'colecciones de usuario', mode: 'block' },
  { table: 'public_deck_cards', label: 'mazos publicos', mode: 'block' },
  { table: 'store_printing_links', label: 'vinculos de tiendas', mode: 'cleanup' },
  { table: 'card_price_consensus', label: 'consenso de precios', mode: 'cleanup' },
  { table: 'card_prices', label: 'historial de precios', mode: 'cleanup' },
  { table: 'scrape_job_items', label: 'historial de scraping', mode: 'cleanup' },
  { table: 'community_price_submissions', label: 'propuestas de precio', mode: 'cleanup' },
  { table: 'link_suggestions', label: 'sugerencias de links', mode: 'cleanup' },
];

async function countPrintingReferences(
  supabase: Client,
  table: string,
  printingId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table as never)
    .select('card_printing_id', { head: true, count: 'exact' })
    .eq('card_printing_id', printingId);

  // Some deployments may not include legacy/optional tables.
  if (error?.code === '42P01') return 0;
  if (error) throw error;

  return count ?? 0;
}

async function cleanupPrintingReferences(
  supabase: Client,
  table: string,
  printingId: string,
): Promise<void> {
  const { error } = await supabase
    .from(table as never)
    .delete()
    .eq('card_printing_id', printingId);

  if (error?.code === '42P01') return;
  if (error) throw error;
}

/**
 * Normalize card name for search: lowercase, trim, remove accents.
 */
function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Search card printings with filters and cursor-based pagination.
 * Returns printings with nested card + edition + rarity relations.
 */
export async function searchCards(supabase: Client, filters: CardFilters) {
  const { q, block_id, edition_id, race_id, card_type_id, rarity_tier_id, legal_status, cost_min, cost_max, tag_slug, price_min, price_max, has_price, limit, cursor } = filters;

  // If filtering by price, first resolve matching card_printing_ids
  let pricePrintingIds: string[] | undefined;
  if (price_min !== undefined || price_max !== undefined || has_price) {
    let priceQuery = supabase
      .from('store_printing_links')
      .select('card_printing_id')
      .eq('is_active', true)
      .not('last_price', 'is', null);

    if (price_min !== undefined) {
      priceQuery = priceQuery.gte('last_price', price_min);
    }
    if (price_max !== undefined) {
      priceQuery = priceQuery.lte('last_price', price_max);
    }

    const { data: priceMatches } = await priceQuery;
    if (priceMatches && priceMatches.length > 0) {
      pricePrintingIds = [...new Set(priceMatches.map((p) => p.card_printing_id as string))];
    } else {
      return { items: [], next_cursor: null, total: 0 };
    }
  }

  // If filtering by tag, first resolve matching card_ids
  let tagCardIds: string[] | undefined;
  if (tag_slug) {
    const { data: tagMatches } = await supabase
      .from('card_tags')
      .select('card_id, tag:tags!inner(slug)')
      .eq('tag.slug' as string, tag_slug);

    if (tagMatches && tagMatches.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tagCardIds = tagMatches.map((t: any) => t.card_id as string);
    } else {
      // No cards match the tag — return empty result
      return { items: [], next_cursor: null, total: 0 };
    }
  }

  let query = supabase
    .from('card_printings')
    .select(
      `
      card_printing_id,
      card_id,
      edition_id,
      rarity_tier_id,
      image_url,
      illustrator,
      collector_number,
      legal_status,
      printing_variant,
      edition:editions!inner(edition_id, block_id, name, code, release_date, sort_order),
      rarity_tier:rarity_tiers(rarity_tier_id, name, code, sort_order),
      card:cards!inner(
        card_id,
        name,
        name_normalized,
        card_type_id,
        race_id,
        ally_strength,
        cost,
        is_unique,
        has_ability,
        can_be_starting_gold,
        text,
        flavor_text,
        card_type:card_types!inner(card_type_id, name, code, sort_order),
        race:races(race_id, name, code, sort_order)
      )
    `,
      { count: 'exact' }
    )
    .order('card_printing_id')
    .limit(limit);

  // Fuzzy search
  if (q) {
    query = query.ilike('card.name' as string, `%${q}%`);
  }

  // Filters on card
  if (card_type_id) {
    query = query.eq('card.card_type_id' as string, card_type_id);
  }
  if (race_id) {
    query = query.eq('card.race_id' as string, race_id);
  }
  if (cost_min !== undefined) {
    query = query.gte('card.cost' as string, cost_min);
  }
  if (cost_max !== undefined) {
    query = query.lte('card.cost' as string, cost_max);
  }

  // Tag filter — restrict to card_ids that have the tag
  if (tagCardIds) {
    query = query.in('card_id', tagCardIds);
  }

  // Price filter — restrict to printing_ids that have prices in range
  if (pricePrintingIds) {
    query = query.in('card_printing_id', pricePrintingIds);
  }

  // Filters on printing
  if (edition_id) {
    query = query.eq('edition_id', edition_id);
  }
  if (block_id) {
    query = query.eq('edition.block_id' as string, block_id);
  }
  if (rarity_tier_id) {
    query = query.eq('rarity_tier_id', rarity_tier_id);
  }
  if (legal_status) {
    query = query.eq('legal_status', legal_status);
  }

  // Cursor pagination
  if (cursor) {
    query = query.gt('card_printing_id', cursor);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (data ?? []) as any[];

  // Batch-fetch tags for all cards in this page
  const cardIds = [...new Set(rawItems.map((row) => row.card.card_id as string))];
  const tagsMap = new Map<string, Array<{ tag_id: string; name: string; slug: string }>>();

  if (cardIds.length > 0) {
    const { data: cardTags } = await supabase
      .from('card_tags')
      .select('card_id, tag:tags!inner(tag_id, name, slug)')
      .in('card_id', cardIds);

    if (cardTags) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const ct of cardTags as any[]) {
        const cid = ct.card_id as string;
        if (!tagsMap.has(cid)) tagsMap.set(cid, []);
        tagsMap.get(cid)!.push(ct.tag);
      }
    }
  }

  // Batch-fetch store min prices for all printings in this page
  const printingIds = rawItems.map((row) => row.card_printing_id as string);
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

  const items = rawItems.map((row) => ({
    ...row,
    card: {
      ...row.card,
      tags: tagsMap.get(row.card.card_id as string) ?? [],
    },
    store_min_price: priceMap.get(row.card_printing_id as string) ?? null,
  }));

  const lastItem = items[items.length - 1] as Record<string, unknown> | undefined;
  const nextCursor = items.length === limit ? (lastItem?.card_printing_id as string) ?? null : null;

  return {
    items,
    next_cursor: nextCursor,
    total: count,
  };
}

/**
 * Get a single card with all relations, printings, and price consensus.
 */
export async function getCardById(supabase: Client, cardId: string) {
  // Fetch card with relations
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select(
      `
      card_id,
      name,
      name_normalized,
      card_type_id,
      race_id,
      ally_strength,
      cost,
      is_unique,
      has_ability,
      can_be_starting_gold,
      text,
      flavor_text,
      created_at,
      updated_at,
      card_type:card_types!inner(card_type_id, name, code, sort_order),
      race:races(race_id, name, code, sort_order)
    `
    )
    .eq('card_id', cardId)
    .single();

  if (cardError || !card) {
    throw new AppError('NOT_FOUND', `Carta no encontrada: ${cardId}`);
  }

  // Fetch tags
  const { data: cardTags } = await supabase
    .from('card_tags')
    .select('tag:tags!inner(tag_id, name, slug)')
    .eq('card_id', cardId);

  const tags = (cardTags ?? []).map((ct) => (ct as Record<string, unknown>).tag);

  // Fetch printings
  const { data: printings } = await supabase
    .from('card_printings')
    .select(
      `
      card_printing_id,
      card_id,
      edition_id,
      rarity_tier_id,
      image_url,
      illustrator,
      collector_number,
      legal_status,
      printing_variant,
      edition:editions!inner(edition_id, block_id, name, code, release_date, sort_order),
      rarity_tier:rarity_tiers(rarity_tier_id, name, code, sort_order)
    `
    )
    .eq('card_id', cardId)
    .order('edition_id');

  // Fetch price consensus for each printing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const printingRows = (printings ?? []) as any[];
  const printingIds = printingRows.map((p) => p.card_printing_id as string);
  const consensusMap: Record<string, unknown> = {};

  if (printingIds.length > 0) {
    const { data: consensusData } = await supabase
      .from('card_price_consensus')
      .select('consensus_id, card_printing_id, consensus_price, currency_id, computed_at')
      .in('card_printing_id', printingIds);

    if (consensusData) {
      for (const c of consensusData) {
        consensusMap[c.card_printing_id] = c;
      }
    }
  }

  const printingsWithPrices = printingRows.map((p) => ({
    ...p,
    price_consensus: consensusMap[p.card_printing_id as string] ?? null,
  }));

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(card as any),
    tags,
    printings: printingsWithPrices,
  };
}

/**
 * Get all printings for a card.
 */
export async function getCardPrintings(supabase: Client, cardId: string) {
  const { data, error } = await supabase
    .from('card_printings')
    .select(
      `
      card_printing_id,
      card_id,
      edition_id,
      rarity_tier_id,
      image_url,
      illustrator,
      collector_number,
      legal_status,
      printing_variant,
      edition:editions!inner(edition_id, block_id, name, code, release_date, sort_order),
      rarity_tier:rarity_tiers(rarity_tier_id, name, code, sort_order)
    `
    )
    .eq('card_id', cardId)
    .order('edition_id');

  if (error) throw error;
  return data;
}

/**
 * Create a new card with optional tags.
 */
export async function createCard(supabase: Client, input: CreateCard) {
  const { tag_ids, ...cardData } = input;

  const { data: card, error } = await supabase
    .from('cards')
    .insert({
      ...cardData,
      name_normalized: normalizeCardName(cardData.name),
    })
    .select()
    .single();

  if (error) throw error;

  // Insert tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRow = card as any;
  if (tag_ids && tag_ids.length > 0) {
    const tagRows = tag_ids.map((tag_id) => ({
      card_id: cardRow.card_id as string,
      tag_id,
    }));
    const { error: tagError } = await supabase.from('card_tags').insert(tagRows);
    if (tagError) throw tagError;
  }

  return cardRow;
}

/**
 * Update an existing card. Syncs tags (delete all + re-insert).
 */
export async function updateCard(supabase: Client, cardId: string, input: UpdateCard) {
  const { tag_ids, ...cardData } = input;

  const updatePayload: Record<string, unknown> = { ...cardData };
  if (cardData.name) {
    updatePayload.name_normalized = normalizeCardName(cardData.name);
  }

  const { data: card, error } = await supabase
    .from('cards')
    .update(updatePayload)
    .eq('card_id', cardId)
    .select()
    .single();

  if (error) throw error;
  if (!card) throw new AppError('NOT_FOUND', `Carta no encontrada: ${cardId}`);

  // Sync tags if provided
  if (tag_ids !== undefined) {
    await supabase.from('card_tags').delete().eq('card_id', cardId);

    if (tag_ids.length > 0) {
      const tagRows = tag_ids.map((tag_id) => ({ card_id: cardId, tag_id }));
      const { error: tagError } = await supabase.from('card_tags').insert(tagRows);
      if (tagError) throw tagError;
    }
  }

  return card;
}

/**
 * Delete a card. card_tags cascade automatically (ON DELETE CASCADE).
 */
export async function deleteCard(supabase: Client, cardId: string) {
  const { error } = await supabase.from('cards').delete().eq('card_id', cardId);
  if (error) throw error;
}

/**
 * Create a new card printing.
 */
export async function createCardPrinting(supabase: Client, input: CreateCardPrinting) {
  const { data, error } = await supabase
    .from('card_printings')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing card printing.
 */
export async function updateCardPrinting(
  supabase: Client,
  printingId: string,
  input: UpdateCardPrinting,
  options?: PrintingMutationOptions,
) {
  let query = supabase.from('card_printings').update(input).eq('card_printing_id', printingId);
  if (options?.cardId) {
    query = query.eq('card_id', options.cardId);
  }

  const { data, error } = await query.select().maybeSingle();

  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', `Printing no encontrado: ${printingId}`);
  return data;
}

/**
 * Delete a card printing.
 */
export async function deleteCardPrinting(
  supabase: Client,
  printingId: string,
  options?: PrintingMutationOptions,
) {
  let existsQuery = supabase
    .from('card_printings')
    .select('card_printing_id', { head: true, count: 'exact' })
    .eq('card_printing_id', printingId);
  if (options?.cardId) {
    existsQuery = existsQuery.eq('card_id', options.cardId);
  }

  const { count: existingCount, error: existsError } = await existsQuery;
  if (existsError) throw existsError;
  if (!existingCount) {
    throw new AppError('NOT_FOUND', `Printing no encontrado: ${printingId}`);
  }

  const blockers = PRINTING_REFERENCE_RULES.filter((rule) => rule.mode === 'block');
  const blockerCounts = await Promise.all(
    blockers.map(async (rule) => ({
      ...rule,
      count: await countPrintingReferences(supabase, rule.table, printingId),
    })),
  );

  const blockingUsage = blockerCounts.filter((rule) => rule.count > 0);
  if (blockingUsage.length > 0) {
    throw new AppError(
      'CONFLICT',
      'No se puede eliminar la impresion porque esta vinculada a datos activos (mazos o colecciones).',
      {
        references: blockingUsage.map((rule) => ({
          table: rule.table,
          label: rule.label,
          count: rule.count,
        })),
      },
    );
  }

  const cleanupRules = PRINTING_REFERENCE_RULES.filter((rule) => rule.mode === 'cleanup');
  for (const rule of cleanupRules) {
    await cleanupPrintingReferences(supabase, rule.table, printingId);
  }

  let deleteQuery = supabase.from('card_printings').delete().eq('card_printing_id', printingId);
  if (options?.cardId) {
    deleteQuery = deleteQuery.eq('card_id', options.cardId);
  }

  const { error } = await deleteQuery;
  if (!error) return;

  // Fallback for any remaining FK dependencies not covered above.
  if (error.code === '23503') {
    throw new AppError(
      'CONFLICT',
      'No se puede eliminar la impresion porque todavia tiene registros relacionados.',
      { postgres_error: error.message },
    );
  }

  throw error;
}

/**
 * Set a reference price for a printing.
 * Upserts into card_price_consensus with a default CLP currency.
 */
export async function setReferencePrice(
  supabase: Client,
  printingId: string,
  price: number,
): Promise<void> {
  // Resolve CLP currency
  const { data: currency } = await supabase
    .from('currencies')
    .select('currency_id')
    .eq('code', 'CLP')
    .single();

  const currencyId = currency?.currency_id;
  if (!currencyId) {
    // If no CLP currency exists, skip silently
    return;
  }

  // Upsert consensus price
  const { error } = await supabase
    .from('card_price_consensus')
    .upsert(
      {
        card_printing_id: printingId,
        consensus_price: price,
        currency_id: currencyId,
      },
      { onConflict: 'card_printing_id' },
    );

  if (error) throw error;
}
