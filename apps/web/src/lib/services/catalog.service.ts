import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';

/**
 * Catalog service — queries for blocks, editions, card types, races, rarities, tags.
 * All public read-only. Doc reference: 11_API_CONTRACTS.md
 */

type Client = SupabaseClient<Database>;

export async function getBlocks(supabase: Client) {
  const { data, error } = await supabase
    .from('blocks')
    .select('block_id, name, code, sort_order')
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function getEditions(supabase: Client, blockId?: string) {
  let query = supabase
    .from('editions')
    .select('edition_id, block_id, name, code, release_date, sort_order')
    .order('sort_order');

  if (blockId) {
    query = query.eq('block_id', blockId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCardTypes(supabase: Client) {
  const { data, error } = await supabase
    .from('card_types')
    .select('card_type_id, name, code, sort_order')
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function getRaces(supabase: Client) {
  const { data, error } = await supabase
    .from('races')
    .select('race_id, name, code, sort_order')
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function getRarityTiers(supabase: Client) {
  const { data, error } = await supabase
    .from('rarity_tiers')
    .select('rarity_tier_id, name, code, sort_order')
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function getTags(supabase: Client) {
  const { data, error } = await supabase
    .from('tags')
    .select('tag_id, name, slug')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getCardConditions(supabase: Client) {
  const { data, error } = await supabase
    .from('card_conditions')
    .select('condition_id, code, name, sort_order')
    .order('sort_order', { ascending: false });

  if (error) throw error;
  return data;
}
