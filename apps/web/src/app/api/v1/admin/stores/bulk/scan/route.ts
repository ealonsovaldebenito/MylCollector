/**
 * POST /api/v1/admin/stores/bulk/scan
 *
 * Scans multiple store seed URLs and returns only URLs that are not yet linked
 * in DB (existing URLs are ignored server-side).
 *
 * Context:
 * - Powers the new "Scrapping Masivo" admin tab.
 * - Uses polite crawling with throttling to avoid aggressive request bursts.
 *
 * Changelog:
 * - 2026-02-18 - Initial endpoint for bulk scan queue generation.
 * - 2026-02-18 - Added existing-link filter by normalized URL.
 * - 2026-02-18 - Added max_new_products cap (default 100 new URLs) with early stop.
 */

import { z } from 'zod';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createError, createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  scanStoresForBulkLinks,
  normalizeStoreProductUrl,
} from '@/lib/services/stores-bulk-scrape.service';

const seedSchema = z.object({
  url: z.string().url(),
  label: z.string().min(1).max(120),
  pagination_mode: z.enum(['woo_path', 'query_page']).optional(),
  extract_mode: z.enum(['anchor_hint', 'generic_cards']).optional(),
  href_hint: z.string().max(120).optional().nullable(),
  max_pages: z.number().int().positive().max(120).optional(),
});

const storeSchema = z.object({
  store_id: z.string().uuid().nullable(),
  store_name: z.string().min(1).max(200),
  seeds: z.array(seedSchema).min(1),
});

const payloadSchema = z.object({
  stores: z.array(storeSchema).min(1).max(40),
  request_delay_ms: z.number().int().min(250).max(5000).optional(),
  max_new_products: z.number().int().positive().max(1000).optional(),
});

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden ejecutar scraping masivo', requestId);
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return createError('VALIDATION_ERROR', 'Payload invalido para scraping masivo', requestId, {
      issues: parsed.error.issues,
    });
  }

  const { data: existingRows } = await adminClient
    .from('store_printing_links')
    .select('product_url')
    .eq('is_active', true);

  const existingNormalized = new Set<string>();
  for (const row of existingRows ?? []) {
    const raw = row.product_url?.trim();
    if (!raw) continue;
    existingNormalized.add(normalizeStoreProductUrl(raw));
  }

  const maxNewProducts = parsed.data.max_new_products ?? 100;
  const scan = await scanStoresForBulkLinks(parsed.data, {
    existing_normalized_urls: existingNormalized,
    max_new_products: maxNewProducts,
  });

  return createSuccess({
    summary: {
      scanned_total: scan.scanned_total,
      pending_total: scan.candidates.length,
      ignored_existing: scan.ignored_existing,
      duplicates_ignored: scan.duplicates_ignored,
      max_new_products: maxNewProducts,
      limit_reached: scan.limit_reached,
    },
    stores: scan.summaries,
    items: scan.candidates,
  });
});

