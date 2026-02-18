/**
 * Scraping service — manages scrape jobs and processes scraped price data.
 * Provides manual trigger + job history + item processing pipeline.
 *
 * Doc reference: 03_DATA_MODEL_SQL.md, 05_PRICING_SCRAPING_COMMUNITY.md
 *
 * Changelog:
 *   2026-02-19 — Scope `single` ahora respeta `store_printing_link_id` y evita scrape global.
 *   2026-02-16 — Initial creation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { TriggerScrape } from '@myl/shared';

import { AppError } from '../api/errors';
import { fetchAndScrape, type ScraperConfig, type ScraperPlatform } from './scraper-engines';
import { isManagedCardImageUrl, uploadCardImageFromUrl } from './storage.service';

type Client = SupabaseClient<Database>;

// ============================================================================
// Scrape Job Row — explicit shape since DB types may not resolve
// ============================================================================

interface ScrapeJobRow {
  scrape_job_id: string;
  price_source_id: string;
  store_id: string | null;
  status: string;
  triggered_by: string;
  items_count: number | null;
  items_success: number | null;
  items_failed: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TriggerScrapeResult {
  job: ScrapeJobRow;
  links_count: number;
}

// ============================================================================
// Scrape Job Management
// ============================================================================

/** Trigger a new scrape job for a store. */
export async function triggerScrape(
  supabase: Client,
  storeId: string,
  input: TriggerScrape,
): Promise<TriggerScrapeResult> {
  // 1. Get or create a price_source for this store
  let priceSourceId: string;

  const { data: existingSource } = await supabase
    .from('price_sources')
    .select('price_source_id')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (existingSource) {
    priceSourceId = existingSource.price_source_id;
  } else {
    // Get store name for the price source
    const { data: store } = await supabase
      .from('stores')
      .select('name')
      .eq('store_id', storeId)
      .single();

    const { data: newSource, error: srcErr } = await supabase
      .from('price_sources')
      .insert({
        store_id: storeId,
        name: `Scraper - ${store?.name ?? storeId}`,
        source_type: 'scrape',
        is_active: true,
      } as never)
      .select('price_source_id')
      .single();

    if (srcErr || !newSource) throw new AppError('INTERNAL_ERROR', 'Error al crear price source');
    priceSourceId = newSource.price_source_id;
  }

  // 2. Auto-expire stale jobs (stuck > 10 minutes in pending/running)
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase
    .from('scrape_jobs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: 'Job expirado automáticamente (>10 min sin completar)',
    } as never)
    .eq('store_id', storeId)
    .in('status', ['pending', 'running'])
    .lt('created_at', staleThreshold);

  // 3. Check for actually-running job (recent ones only)
  const { data: runningJob } = await supabase
    .from('scrape_jobs')
    .select('scrape_job_id')
    .eq('store_id', storeId)
    .in('status', ['pending', 'running'])
    .limit(1)
    .single();

  if (runningJob) {
    throw new AppError('VALIDATION_ERROR', 'Ya existe un job activo para esta tienda');
  }

  // 3. Get the printing links to scrape
  let linksQuery = supabase
    .from('store_printing_links')
    .select('store_printing_link_id, card_printing_id, product_url')
    .eq('store_id', storeId)
    .eq('is_active', true);

  if (input.scope === 'single') {
    if (input.store_printing_link_id) {
      linksQuery = linksQuery.eq('store_printing_link_id', input.store_printing_link_id);
    } else if (input.card_printing_id) {
      linksQuery = linksQuery.eq('card_printing_id', input.card_printing_id);
    }
  }

  const { data: links, error: linksErr } = await linksQuery;
  if (linksErr) throw new AppError('INTERNAL_ERROR', 'Error al cargar links para scraping');

  const itemsCount = links?.length ?? 0;

  // 4. Create the scrape job
  const { data: job, error: jobErr } = await supabase
    .from('scrape_jobs')
    .insert({
      price_source_id: priceSourceId,
      store_id: storeId,
      status: 'pending',
      triggered_by: 'manual',
      items_count: itemsCount,
    } as never)
    .select('*')
    .single();

  if (jobErr || !job) throw new AppError('INTERNAL_ERROR', 'Error al crear job de scraping');

  return {
    job: job as unknown as ScrapeJobRow,
    links_count: itemsCount,
  };
}

/** Get scrape job history for a store. */
export async function getScrapeJobs(
  supabase: Client,
  storeId: string,
  options?: { limit?: number },
) {
  const limit = options?.limit ?? 20;

  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('store_id', storeId)
    .order('started_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar historial de scraping');
  return data ?? [];
}

/** Get a single scrape job with its items. */
export async function getScrapeJob(supabase: Client, jobId: string) {
  const { data: job, error: jobErr } = await supabase
    .from('scrape_jobs')
    .select('*')
    .eq('scrape_job_id', jobId)
    .single();

  if (jobErr || !job) throw new AppError('NOT_FOUND', 'Job no encontrado');

  const { data: items, error: itemsErr } = await supabase
    .from('scrape_job_items')
    .select(`
      *,
      card_printing:card_printings!inner(
        card_printing_id,
        card:cards!inner(card_id, name),
        edition:editions!inner(edition_id, name)
      )
    `)
    .eq('scrape_job_id', jobId)
    .order('created_at', { ascending: false });

  if (itemsErr) throw new AppError('INTERNAL_ERROR', 'Error al cargar items del job');

  return { ...job, items: items ?? [] };
}

/** Process scraped items: copy to card_prices and update store_printing_links. */
export async function processScrapedItems(supabase: Client, jobId: string) {
  const { data: job } = await supabase
    .from('scrape_jobs')
    .select('scrape_job_id, price_source_id, store_id')
    .eq('scrape_job_id', jobId)
    .single();

  if (!job) throw new AppError('NOT_FOUND', 'Job no encontrado');

  interface ScrapeItemRow {
    scrape_job_item_id: string;
    scrape_job_id: string;
    card_printing_id: string;
    raw_price: number;
    currency_id: string;
    raw_data: Record<string, unknown> | null;
    created_at: string;
  }

  const { data: items } = await supabase
    .from('scrape_job_items')
    .select('*')
    .eq('scrape_job_id', jobId);

  const typedItems = (items ?? []) as unknown as ScrapeItemRow[];
  if (typedItems.length === 0) return { processed: 0 };

  let success = 0;
  let failed = 0;

  for (const item of typedItems) {
    try {
      // Insert into card_prices history
      await supabase.from('card_prices').insert({
        card_printing_id: item.card_printing_id,
        price_source_id: job.price_source_id,
        price: item.raw_price,
        currency_id: item.currency_id,
      } as never);

      // Update the store_printing_link with last price
      if (job.store_id) {
        await supabase
          .from('store_printing_links')
          .update({
            last_price: item.raw_price,
            last_currency_id: item.currency_id,
            last_scraped_at: new Date().toISOString(),
          } as never)
          .eq('store_id', job.store_id)
          .eq('card_printing_id', item.card_printing_id);
      }

      success++;
    } catch {
      failed++;
    }
  }

  // Update job status
  await supabase
    .from('scrape_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      items_success: success,
      items_failed: failed,
    } as never)
    .eq('scrape_job_id', jobId);

  // Update store last_polled_at
  if (job.store_id) {
    await supabase
      .from('stores')
      .update({ last_polled_at: new Date().toISOString() } as never)
      .eq('store_id', job.store_id);
  }

  return { processed: success, failed };
}

// ============================================================================
// Scrape Job Execution — actually fetches URLs and extracts prices
// ============================================================================

interface ExecutionResult {
  job_id: string;
  total: number;
  success: number;
  failed: number;
  errors: Array<{ url: string; error: string }>;
}

/**
 * Execute a scrape job: fetch each linked product page, parse it, insert items,
 * then process them into card_prices + store_printing_links.
 */
export async function executeScrapeJob(
  supabase: Client,
  jobId: string,
  input?: TriggerScrape,
): Promise<ExecutionResult> {
  // 1. Get the job
  const { data: job } = await supabase
    .from('scrape_jobs')
    .select('scrape_job_id, price_source_id, store_id, status')
    .eq('scrape_job_id', jobId)
    .single();

  if (!job) throw new AppError('NOT_FOUND', 'Job no encontrado');
  if (!job.store_id) throw new AppError('VALIDATION_ERROR', 'Job no tiene tienda asociada');

  // 2. Get the store config
  const { data: store } = await supabase
    .from('stores')
    .select('store_id, name, scraper_type, scraper_config, currency_id')
    .eq('store_id', job.store_id)
    .single();

  if (!store) throw new AppError('NOT_FOUND', 'Tienda no encontrada');

  const storeConfig = (store.scraper_config ?? {}) as Record<string, unknown>;
  const scraperConfig: ScraperConfig = {
    platform: (storeConfig.platform as ScraperPlatform) ?? (store.scraper_type === 'web_scrape' ? 'generic_og' : 'generic_og'),
    headers: (storeConfig.headers as Record<string, string>) ?? undefined,
    price_divisor: (storeConfig.price_divisor as number) ?? undefined,
    default_currency: (storeConfig.default_currency as string) ?? 'CLP',
  };

  // 3. Mark job as running
  await supabase
    .from('scrape_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    } as never)
    .eq('scrape_job_id', jobId);

  // 4. Get the printing links to scrape
  let linksQuery = supabase
    .from('store_printing_links')
    .select('store_printing_link_id, card_printing_id, product_url')
    .eq('store_id', job.store_id)
    .eq('is_active', true);

  if (input?.scope === 'single') {
    if (input.store_printing_link_id) {
      linksQuery = linksQuery.eq('store_printing_link_id', input.store_printing_link_id);
    } else if (input.card_printing_id) {
      linksQuery = linksQuery.eq('card_printing_id', input.card_printing_id);
    }
  }

  const { data: links } = await linksQuery;

  const allLinks = links ?? [];
  let success = 0;
  let failed = 0;
  const errors: Array<{ url: string; error: string }> = [];

  // 5. Get default currency ID
  let currencyId = store.currency_id;
  if (!currencyId) {
    const { data: clpCurrency } = await supabase
      .from('currencies')
      .select('currency_id')
      .eq('code', 'CLP')
      .single();
    currencyId = clpCurrency?.currency_id ?? null;
  }

  // 6. Scrape each link sequentially (be polite, don't DDoS stores)
  for (const link of allLinks) {
    try {
      const result = await fetchAndScrape(link.product_url, scraperConfig);

      if (result.price === null) {
        errors.push({ url: link.product_url, error: 'No se pudo extraer el precio' });
        failed++;
        continue;
      }

      // Insert scrape_job_item
      await supabase.from('scrape_job_items').insert({
        scrape_job_id: jobId,
        card_printing_id: link.card_printing_id,
        raw_price: result.price,
        currency_id: currencyId,
        raw_data: result.raw_data,
      } as never);

      // Insert into card_prices history
      await supabase.from('card_prices').insert({
        card_printing_id: link.card_printing_id,
        price_source_id: job.price_source_id,
        price: result.price,
        currency_id: currencyId,
      } as never);

      // Update store_printing_link with last price + scraped product info
      await supabase
        .from('store_printing_links')
        .update({
          last_price: result.price,
          last_currency_id: currencyId,
          last_scraped_at: new Date().toISOString(),
          product_name: result.name ?? link.product_url,
        } as never)
        .eq('store_printing_link_id', link.store_printing_link_id);

      // If the printing has no image yet and scraping returned one, upload it to Storage
      if (result.image_url) {
        const { data: printing } = await supabase
          .from('card_printings')
          .select('image_url')
          .eq('card_printing_id', link.card_printing_id)
          .single();

        const currentImage = printing?.image_url?.trim() ?? '';
        const shouldUpload = currentImage === '' || !isManagedCardImageUrl(currentImage);
        if (shouldUpload) {
          const uploaded = await uploadCardImageFromUrl(
            supabase,
            result.image_url,
            link.card_printing_id,
            { base_url: link.product_url },
          );
          if (uploaded) {
            await supabase
              .from('card_printings')
              .update({ image_url: uploaded } as never)
              .eq('card_printing_id', link.card_printing_id);
          }
        }
      }

      success++;

      // Polite delay between requests (500ms)
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      errors.push({ url: link.product_url, error: msg });
      failed++;
    }
  }

  // 7. Update job status
  await supabase
    .from('scrape_jobs')
    .update({
      status: failed === allLinks.length ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      items_count: allLinks.length,
      items_success: success,
      items_failed: failed,
      error_message: errors.length > 0
        ? errors.map((e) => `${e.url}: ${e.error}`).join('\n').slice(0, 2000)
        : null,
    } as never)
    .eq('scrape_job_id', jobId);

  // 8. Update store last_polled_at
  await supabase
    .from('stores')
    .update({ last_polled_at: new Date().toISOString() } as never)
    .eq('store_id', job.store_id);

  return {
    job_id: jobId,
    total: allLinks.length,
    success,
    failed,
    errors,
  };
}

/** Get price history for a printing across all stores. */
export async function getPriceHistoryByStore(
  supabase: Client,
  printingId: string,
  options?: { limit?: number; days?: number },
) {
  const limit = options?.limit ?? 200;
  const days = options?.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('card_prices')
    .select(`
      card_price_id, price, currency_id, captured_at,
      price_source:price_sources!inner(
        price_source_id, name,
        store:stores(store_id, name, logo_url)
      )
    `)
    .eq('card_printing_id', printingId)
    .gte('captured_at', since.toISOString())
    .order('captured_at', { ascending: false })
    .limit(limit);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar historial de precios');
  return data ?? [];
}
