/**
 * Stores service — CRUD for stores and store-printing links.
 * Handles association between stores and card printings for price tracking.
 *
 * Doc reference: 03_DATA_MODEL_SQL.md
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { CreateStore, UpdateStore, CreateStorePrintingLink } from '@myl/shared';

import { AppError } from '../api/errors';
import { isManagedCardImageUrl, uploadCardImageFromUrl } from './storage.service';

type Client = SupabaseClient<Database>;

// ============================================================================
// Store CRUD
// ============================================================================

/** List all stores with optional filters. */
export async function getStores(
  supabase: Client,
  filters?: { is_active?: boolean },
) {
  let query = supabase
    .from('stores')
    .select('*')
    .order('name', { ascending: true });

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  const { data, error } = await query;
  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar tiendas');
  return data ?? [];
}

/** Get a single store by ID with its printing link count. */
export async function getStore(supabase: Client, storeId: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (error || !data) throw new AppError('NOT_FOUND', 'Tienda no encontrada');

  // Get link count
  const { count } = await supabase
    .from('store_printing_links')
    .select('store_printing_link_id', { count: 'exact', head: true })
    .eq('store_id', storeId);

  return { ...data, link_count: count ?? 0 };
}

/** Create a new store. */
export async function createStore(supabase: Client, data: CreateStore) {
  const { data: store, error } = await supabase
    .from('stores')
    .insert({
      name: data.name,
      url: data.url ?? null,
      currency_id: data.currency_id ?? null,
      logo_url: data.logo_url ?? null,
      scraper_type: data.scraper_type ?? 'manual',
      scraper_config: data.scraper_config ?? {},
      polling_interval_hours: data.polling_interval_hours ?? null,
    } as never)
    .select('*')
    .single();

  if (error || !store) throw new AppError('INTERNAL_ERROR', 'Error al crear tienda');
  return store;
}

/** Update an existing store. */
export async function updateStore(supabase: Client, storeId: string, data: UpdateStore) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.url !== undefined) payload.url = data.url;
  if (data.currency_id !== undefined) payload.currency_id = data.currency_id;
  if (data.logo_url !== undefined) payload.logo_url = data.logo_url;
  if (data.scraper_type !== undefined) payload.scraper_type = data.scraper_type;
  if (data.scraper_config !== undefined) payload.scraper_config = data.scraper_config;
  if (data.polling_interval_hours !== undefined) payload.polling_interval_hours = data.polling_interval_hours;

  const { data: store, error } = await supabase
    .from('stores')
    .update(payload as never)
    .eq('store_id', storeId)
    .select('*')
    .single();

  if (error || !store) throw new AppError('INTERNAL_ERROR', 'Error al actualizar tienda');
  return store;
}

/** Soft-delete a store (set is_active = false). */
export async function deactivateStore(supabase: Client, storeId: string) {
  const { error } = await supabase
    .from('stores')
    .update({ is_active: false } as never)
    .eq('store_id', storeId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al desactivar tienda');
}

// ============================================================================
// Store-Printing Links
// ============================================================================

/** Get all printing links for a store. */
export async function getStorePrintingLinks(
  supabase: Client,
  storeId: string,
  options?: { limit?: number; offset?: number },
) {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const { data, error, count } = await supabase
    .from('store_printing_links')
    .select(`
      *,
      card_printing:card_printings!inner(
        card_printing_id, image_url, collector_number,
        card:cards!inner(card_id, name),
        edition:editions!inner(edition_id, name, code)
      )
    `, { count: 'exact' })
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar links de tienda');
  return { items: data ?? [], total: count ?? 0 };
}

/** Create a new store-printing link. */
export async function createStorePrintingLink(
  supabase: Client,
  storeId: string,
  data: CreateStorePrintingLink,
  options?: { scraped_image_url?: string | null },
) {
  async function fillMissingPrintingImage() {
    const scraped = options?.scraped_image_url?.trim();
    if (!scraped) return;

    const { data: printing } = await supabase
      .from('card_printings')
      .select('image_url')
      .eq('card_printing_id', data.card_printing_id)
      .single();

    const currentImage = printing?.image_url?.trim() ?? '';
    const shouldUpload =
      currentImage === '' || !isManagedCardImageUrl(currentImage);
    if (!shouldUpload) return;

    const uploaded = await uploadCardImageFromUrl(
      supabase,
      scraped,
      data.card_printing_id,
      { base_url: data.product_url },
    );
    if (!uploaded) return;

    await supabase
      .from('card_printings')
      .update({ image_url: uploaded } as never)
      .eq('card_printing_id', data.card_printing_id);
  }

  const { data: link, error } = await supabase
    .from('store_printing_links')
    .insert({
      store_id: storeId,
      card_printing_id: data.card_printing_id,
      product_url: data.product_url,
      product_name: data.product_name ?? null,
    } as never)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('store_printing_links')
        .select('*')
        .eq('store_id', storeId)
        .eq('card_printing_id', data.card_printing_id)
        .maybeSingle();

      if (!existing) {
        throw new AppError('VALIDATION_ERROR', 'Este printing ya esta vinculado a esta tienda');
      }

      const updatePayload: Record<string, unknown> = {};
      if ((!existing.product_name || existing.product_name.trim() === '') && data.product_name) {
        updatePayload.product_name = data.product_name;
      }
      if ((!existing.product_url || existing.product_url.trim() === '') && data.product_url) {
        updatePayload.product_url = data.product_url;
      }

      let updated = existing;
      if (Object.keys(updatePayload).length > 0) {
        const { data: next, error: updateErr } = await supabase
          .from('store_printing_links')
          .update(updatePayload as never)
          .eq('store_printing_link_id', existing.store_printing_link_id)
          .select('*')
          .single();
        if (updateErr) throw new AppError('INTERNAL_ERROR', 'Error al completar link existente');
        if (next) updated = next;
      }

      await fillMissingPrintingImage();
      return updated;
    }
    throw new AppError('INTERNAL_ERROR', 'Error al crear link de tienda');
  }

  await fillMissingPrintingImage();
  return link;
}
/** Delete a store-printing link. */
export async function deleteStorePrintingLink(supabase: Client, linkId: string) {
  const { error } = await supabase
    .from('store_printing_links')
    .delete()
    .eq('store_printing_link_id', linkId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar link de tienda');
}

/** Get all stores that sell a specific printing (with prices). */
export async function getStoresForPrinting(supabase: Client, printingId: string) {
  const { data, error } = await supabase
    .from('store_printing_links')
    .select(`
      store_printing_link_id, product_url, product_name, last_price,
      last_currency_id, last_scraped_at, is_active,
      store:stores!inner(store_id, name, url, logo_url, is_active)
    `)
    .eq('card_printing_id', printingId)
    .eq('is_active', true)
    .order('last_price', { ascending: true, nullsFirst: false });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar tiendas para el printing');
  return data ?? [];
}

