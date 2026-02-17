import type { SupabaseClient as Client } from '@supabase/supabase-js';
import type { CreateCollection, UpdateCollection } from '@myl/shared';
import { AppError } from '../api/errors';

// Read the existing apps/web/src/lib/api/errors.ts to see the AppError pattern if needed.

/**
 * Collections service — CRUD for user collection folders.
 */

export interface CollectionListItem {
  collection_id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  card_count: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

/** List all collections for a user, with card_count and total_value */
export async function getUserCollections(supabase: Client, userId: string): Promise<CollectionListItem[]> {
  // Query user_collections with a subquery count from user_cards
  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al obtener colecciones', { cause: error });

  // Get card counts per collection
  const { data: countData } = await supabase
    .from('user_cards')
    .select('collection_id, qty')
    .eq('user_id', userId);

  const countMap = new Map<string | null, { count: number; }>();
  for (const row of countData ?? []) {
    const key = row.collection_id;
    const existing = countMap.get(key) ?? { count: 0 };
    existing.count += row.qty;
    countMap.set(key, existing);
  }

  return (data ?? []).map((c) => ({
    ...c,
    description: c.description ?? null,
    card_count: countMap.get(c.collection_id)?.count ?? 0,
    total_value: 0, // Will be calculated client-side or via RPC
  }));
}

/** Create a new collection */
export async function createCollection(supabase: Client, userId: string, input: CreateCollection) {
  const { data, error } = await supabase
    .from('user_collections')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#6366f1',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('VALIDATION_ERROR', 'Ya existe una colección con ese nombre');
    }
    throw new AppError('INTERNAL_ERROR', 'Error al crear colección', { cause: error });
  }

  return data;
}

/** Update a collection */
export async function updateCollection(supabase: Client, userId: string, collectionId: string, input: UpdateCollection) {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.color !== undefined) updates.color = input.color;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from('user_collections')
    .update(updates)
    .eq('collection_id', collectionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError('VALIDATION_ERROR', 'Ya existe una colección con ese nombre');
    }
    throw new AppError('INTERNAL_ERROR', 'Error al actualizar colección', { cause: error });
  }

  return data;
}

/** Delete a collection (cards get collection_id = NULL via ON DELETE SET NULL) */
export async function deleteCollection(supabase: Client, userId: string, collectionId: string) {
  const { error } = await supabase
    .from('user_collections')
    .delete()
    .eq('collection_id', collectionId)
    .eq('user_id', userId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar colección', { cause: error });
}

/** Move cards to a different collection */
export async function moveCardsToCollection(
  supabase: Client,
  userId: string,
  userCardIds: string[],
  targetCollectionId: string | null,
) {
  const { error } = await supabase
    .from('user_cards')
    .update({ collection_id: targetCollectionId })
    .eq('user_id', userId)
    .in('user_card_id', userCardIds);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al mover cartas', { cause: error });
}

/** Get total value of a collection (or all cards) via RPC */
export async function getCollectionValue(supabase: Client, userId: string, collectionId?: string | null) {
  const { data, error } = await supabase.rpc('get_collection_value', {
    p_user_id: userId,
    p_collection_id: collectionId ?? null,
  });

  if (error) return { total_value: 0, card_count: 0 };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_value: Number(row?.total_value ?? 0),
    card_count: Number(row?.card_count ?? 0),
  };
}
