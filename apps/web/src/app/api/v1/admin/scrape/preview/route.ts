/**
 * POST /api/v1/admin/scrape/preview
 * Realiza un scraping rápido de una URL (sin persistir) y devuelve la data detectada.
 *
 * Changelog:
 *   2026-02-19 — Creación inicial
 */

import { z } from 'zod';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAndScrape, type ScraperPlatform, detectPlatform as detectPlatformFromHtml } from '@/lib/services/scraper-engines';

const schema = z.object({
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
});

function detectPlatformFromUrl(host: string): ScraperPlatform {
  const h = host.toLowerCase();
  if (h.includes('tiendanube') || h.includes('nuvemshop')) return 'tiendanube';
  if (h.includes('jumpseller') || h.includes('pandora') || h.includes('jumpsellerstore')) return 'jumpseller';
  if (h.includes('woocommerce') || h.includes('wp') || h.includes('woostore')) return 'woocommerce';
  if (h.includes('oneupstore')) return 'woocommerce';
  if (h.includes('mylserena')) return 'woocommerce';
  if (h.includes('minimarketcg')) return 'woocommerce';
  if (h.includes('gorilatcg')) return 'woocommerce';
  if (h.includes('laira')) return 'generic_og';
  if (h.includes('camelotcg')) return 'woocommerce';
  if (h.includes('elreinodelosduelos')) return 'woocommerce';
  return 'generic_og';
}

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  // Admin check
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden probar scraping', requestId);
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return createError('VALIDATION_ERROR', 'URL inválida', requestId);
  }

  // Detect store by hostname
  const urlObj = new URL(parsed.data.url);
  const host = urlObj.hostname.toLowerCase();

  const { data: stores } = await adminClient
    .from('stores')
    .select('store_id, name, url, scraper_config, scraper_type')
    .eq('is_active', true);

  const match = (stores ?? []).find((s) => {
    if (!s.url) return false;
    try {
      const storeHost = new URL(s.url).hostname.toLowerCase();
      return host.includes(storeHost) || storeHost.includes(host);
    } catch {
      return false;
    }
  });

  const inferredPlatform: ScraperPlatform =
    (match?.scraper_config?.platform as ScraperPlatform | undefined)
    ?? detectPlatformFromUrl(host);

  const fetchHeaders = parsed.data.headers;

  // First fetch using inferred platform; if result lacks price+name, try HTML detection
  const result = await fetchAndScrape(parsed.data.url, {
    platform: inferredPlatform,
    headers: fetchHeaders,
    default_currency: 'CLP',
  });

  let platformUsed: ScraperPlatform = inferredPlatform;

  if (!result.price && !result.name) {
    // Fallback: re-fetch and detect platform from HTML contents
    const response = await fetch(parsed.data.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (scraper-preview)',
        ...fetchHeaders,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });
    const html = await response.text();
    platformUsed = detectPlatformFromHtml(html);
    const retried = await fetchAndScrape(parsed.data.url, {
      platform: platformUsed,
      headers: fetchHeaders,
      default_currency: 'CLP',
    });
    result.name = retried.name ?? result.name;
    result.price = retried.price ?? result.price;
    result.available = retried.available ?? result.available;
    result.image_url = retried.image_url ?? result.image_url;
    result.raw_data = retried.raw_data;
  } else {
    platformUsed = inferredPlatform;
  }

  const suggestedStore = match
    ? null
    : {
        name: host.split('.').slice(-2).join('.'),
        url: `${urlObj.protocol}//${urlObj.host}`,
        platform: platformUsed,
      };

  return createSuccess({
    result: {
      ...result,
      store_id: match?.store_id ?? null,
      store_name: match?.name ?? null,
      platform: platformUsed,
    },
    store: match ?? null,
    suggested_store: suggestedStore,
    platform: platformUsed,
  });
});
