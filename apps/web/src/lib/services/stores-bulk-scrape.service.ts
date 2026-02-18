/**
 * File: apps/web/src/lib/services/stores-bulk-scrape.service.ts
 *
 * Stores Bulk Scrape Service
 * -------------------------
 * Scans catalog/listing pages for many stores, extracts product URLs/names,
 * and prepares a queue for bulk link association in admin.
 *
 * Context:
 * - Used by /api/v1/admin/stores/bulk/scan.
 * - Designed for polite crawling (domain throttling + retry + sequential pages)
 *   to reduce the risk of store-side blocking.
 *
 * Changelog:
 * - 2026-02-18 - Initial implementation for "Scrapping Masivo" admin tab.
 * - 2026-02-18 - Added normalized URL dedupe and existing-link filtering helpers.
 * - 2026-02-18 - Added pagination heuristics for Woo path/query-page catalogs.
 * - 2026-02-18 - Added early stop by max_new_products (cuts scan as soon as limit is reached).
 *
 * Bugfix notes:
 * - Keeps crawling conservative (no high concurrency) to avoid accidental DDoS-like bursts.
 * - Normalizes URLs before comparisons so tracking params do not create false negatives.
 */

import { randomUUID } from 'node:crypto';

export type BulkPaginationMode = 'woo_path' | 'query_page';
export type BulkExtractMode = 'anchor_hint' | 'generic_cards';

export interface BulkSeedInput {
  url: string;
  label: string;
  pagination_mode?: BulkPaginationMode;
  extract_mode?: BulkExtractMode;
  href_hint?: string | null;
  max_pages?: number;
}

export interface BulkStoreInput {
  store_id: string | null;
  store_name: string;
  seeds: BulkSeedInput[];
}

export interface BulkScanInput {
  stores: BulkStoreInput[];
  request_delay_ms?: number;
  max_new_products?: number;
}

export interface BulkScanOptions {
  existing_normalized_urls?: Set<string>;
  max_new_products?: number;
}

export interface BulkScanCandidate {
  candidate_id: string;
  store_id: string | null;
  store_name: string;
  seed_label: string;
  seed_url: string;
  product_url: string;
  product_name: string | null;
  image_url: string | null;
  normalized_url: string;
}

export interface BulkScanStoreSummary {
  store_id: string | null;
  store_name: string;
  seeds_total: number;
  candidates_found: number;
}

export interface BulkScanResult {
  candidates: BulkScanCandidate[];
  summaries: BulkScanStoreSummary[];
  duplicates_ignored: number;
  ignored_existing: number;
  scanned_total: number;
  limit_reached: boolean;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MYL-BulkScraper/1.0';
const REQUEST_TIMEOUT_MS = 16_000;
const REQUEST_RETRIES = 3;
const REQUEST_BACKOFF_MS = 450;
const DEFAULT_REQUEST_DELAY_MS = 700;
const UNKNOWN_CAP_PAGES = 120;
const EMPTY_STREAK_STOP = 6;

const TRACKING_QUERY_PARAM_PREFIXES = ['utm_'];
const TRACKING_QUERY_PARAMS = new Set([
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'ref',
  'ref_src',
  'source',
]);

const RE_TOTAL_PRODUCTS = /(\d{1,7})\s*productos\b/i;
const RE_PAGE_LINK = /\/page\/(\d+)\//gi;

const RE_STRIP_TAGS = /<[^>]*>/g;
const RE_SPACES = /\s+/g;
const RE_TRAILING_SLASHES = /\/+$/;
const RE_PAGINATION_PATH = /\/page\/\d+\/?$/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function cleanText(value: string): string {
  return decodeHtmlText(value.replace(RE_STRIP_TAGS, ' ')).replace(RE_SPACES, ' ').trim();
}

function normalizeProductUrl(value: string): string {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';

    const normalized = new URLSearchParams();
    const keys = [...parsed.searchParams.keys()].sort((a, b) => a.localeCompare(b));
    for (const key of keys) {
      const lower = key.toLowerCase();
      if (TRACKING_QUERY_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix))) continue;
      if (TRACKING_QUERY_PARAMS.has(lower)) continue;
      for (const raw of parsed.searchParams.getAll(key)) {
        normalized.append(key, raw.trim());
      }
    }
    parsed.search = normalized.toString();

    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(RE_TRAILING_SLASHES, '');
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
}

function buildPageUrl(base: string, page: number, mode: BulkPaginationMode): string {
  if (mode === 'woo_path') {
    const clean = base.trim().replace(RE_TRAILING_SLASHES, '') + '/';
    return page === 1 ? clean : `${clean}page/${page}/`;
  }

  const parsed = new URL(base.trim());
  parsed.searchParams.set('page', String(page));
  return parsed.toString();
}

function inferMaxPagesByLinks(html: string): number {
  let max = 0;
  let match: RegExpExecArray | null = RE_PAGE_LINK.exec(html);
  while (match) {
    const value = Number.parseInt(match[1] ?? '0', 10);
    if (Number.isFinite(value)) max = Math.max(max, value);
    match = RE_PAGE_LINK.exec(html);
  }
  RE_PAGE_LINK.lastIndex = 0;
  return max;
}

function inferMaxPagesByTotalProducts(html: string, perPageCount: number): number {
  if (perPageCount <= 0) return 0;
  const match = html.match(RE_TOTAL_PRODUCTS);
  if (!match?.[1]) return 0;
  const total = Number.parseInt(match[1], 10);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(1, Math.ceil(total / perPageCount));
}

function isLikelyProductPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p === '/' || p.length < 4) return false;
  if (RE_PAGINATION_PATH.test(p)) return false;
  if (p.includes('/cart') || p.includes('/checkout') || p.includes('/cuenta')) return false;

  return (
    p.includes('/product/')
    || p.includes('/producto/')
    || p.includes('/productos/')
    || p.includes('/single')
    || p.includes('/tienda/')
  );
}

interface ParsedAnchor {
  href: string;
  text: string;
  imageUrl: string | null;
}

function parseAnchors(html: string): ParsedAnchor[] {
  const anchors: ParsedAnchor[] = [];
  const anchorRegex = /<a\b[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null = anchorRegex.exec(html);
  while (match) {
    const href = (match[2] ?? '').trim();
    const body = match[3] ?? '';
    if (!href || href === '#') {
      match = anchorRegex.exec(html);
      continue;
    }

    const text = cleanText(body);
    const imageMatch = body.match(/<img\b[^>]*(?:data-src|src)=(['"])(.*?)\1/i);
    anchors.push({
      href,
      text,
      imageUrl: imageMatch?.[2] ? imageMatch[2].trim() : null,
    });

    match = anchorRegex.exec(html);
  }

  return anchors;
}

interface RawCandidate {
  product_url: string;
  product_name: string | null;
  image_url: string | null;
}

function extractCandidatesFromPage(
  html: string,
  pageUrl: string,
  extractMode: BulkExtractMode,
  hrefHint: string | null,
): RawCandidate[] {
  const pageHost = new URL(pageUrl).hostname;
  const seen = new Set<string>();
  const output: RawCandidate[] = [];

  for (const anchor of parseAnchors(html)) {
    let absolute: URL;
    try {
      absolute = new URL(anchor.href, pageUrl);
    } catch {
      continue;
    }

    if (!['http:', 'https:'].includes(absolute.protocol)) continue;
    if (absolute.hostname !== pageHost) continue;
    if (RE_PAGINATION_PATH.test(absolute.pathname)) continue;

    if (extractMode === 'anchor_hint') {
      if (!hrefHint) continue;
      if (!absolute.pathname.toLowerCase().includes(hrefHint.toLowerCase())) continue;
    } else if (!isLikelyProductPath(absolute.pathname)) {
      continue;
    }

    const normalized = normalizeProductUrl(absolute.toString());
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const cleanName = anchor.text.length > 0 ? anchor.text.split('$', 1)[0]?.trim() ?? '' : '';

    output.push({
      product_url: absolute.toString(),
      product_name: cleanName.length > 0 ? cleanName.slice(0, 500) : null,
      image_url: anchor.imageUrl ? new URL(anchor.imageUrl, pageUrl).toString() : null,
    });
  }

  return output;
}

class HostRateLimiter {
  private readonly latestByHost = new Map<string, number>();

  async wait(url: string, delayMs: number): Promise<void> {
    const host = new URL(url).hostname;
    const now = Date.now();
    const last = this.latestByHost.get(host) ?? 0;
    const next = last + delayMs;
    if (next > now) {
      await sleep(next - now);
    }
    this.latestByHost.set(host, Date.now());
  }
}

async function fetchHtml(url: string, limiter: HostRateLimiter, delayMs: number): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < REQUEST_RETRIES; attempt += 1) {
    try {
      await limiter.wait(url, delayMs);
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-CL,es;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      await sleep(REQUEST_BACKOFF_MS * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudo cargar HTML');
}

interface ScanSeedParams {
  seed: BulkSeedInput;
  store: BulkStoreInput;
  limiter: HostRateLimiter;
  delayMs: number;
  onCandidate: (candidate: BulkScanCandidate) => boolean;
}

async function scanSeed({ seed, store, limiter, delayMs, onCandidate }: ScanSeedParams): Promise<{ limitReached: boolean }> {
  const seedUrl = seed.url.trim();
  const paginationMode = seed.pagination_mode ?? 'woo_path';
  const extractMode = seed.extract_mode ?? 'generic_cards';
  const hrefHint = seed.href_hint ?? null;

  const firstUrl = buildPageUrl(seedUrl, 1, paginationMode);
  const firstHtml = await fetchHtml(firstUrl, limiter, delayMs);

  const firstCandidates = extractCandidatesFromPage(firstHtml, firstUrl, extractMode, hrefHint);

  let maxPages = inferMaxPagesByLinks(firstHtml);
  if (extractMode === 'anchor_hint' && maxPages <= 1) {
    maxPages = inferMaxPagesByTotalProducts(firstHtml, firstCandidates.length);
  }

  const capPages = Math.max(1, Math.min(seed.max_pages ?? UNKNOWN_CAP_PAGES, UNKNOWN_CAP_PAGES));
  const knownMaxPages = maxPages > 1 ? Math.min(maxPages, capPages) : 0;

  const seenSeedUrls = new Set<string>();

  const pushFromRows = (rows: RawCandidate[]): boolean => {
    for (const candidate of rows) {
      const normalized = normalizeProductUrl(candidate.product_url);
      if (!normalized) continue;
      if (seenSeedUrls.has(normalized)) continue;
      seenSeedUrls.add(normalized);

      const shouldContinue = onCandidate({
        candidate_id: randomUUID(),
        store_id: store.store_id,
        store_name: store.store_name,
        seed_label: seed.label,
        seed_url: seedUrl,
        product_url: candidate.product_url,
        product_name: candidate.product_name,
        image_url: candidate.image_url,
        normalized_url: normalized,
      });
      if (!shouldContinue) return false;
    }
    return true;
  };

  if (!pushFromRows(firstCandidates)) {
    return { limitReached: true };
  }

  let emptyStreak = 0;

  if (knownMaxPages > 1) {
    for (let page = 2; page <= knownMaxPages; page += 1) {
      const url = buildPageUrl(seedUrl, page, paginationMode);
      try {
        const html = await fetchHtml(url, limiter, delayMs);
        const rows = extractCandidatesFromPage(html, url, extractMode, hrefHint);
        if (!pushFromRows(rows)) {
          return { limitReached: true };
        }
      } catch {
        // skip isolated page failures to keep scan running
      }
    }
  } else {
    for (let page = 2; page <= capPages; page += 1) {
      const url = buildPageUrl(seedUrl, page, paginationMode);
      let rows: RawCandidate[] = [];
      try {
        const html = await fetchHtml(url, limiter, delayMs);
        rows = extractCandidatesFromPage(html, url, extractMode, hrefHint);
      } catch {
        emptyStreak += 1;
        if (emptyStreak >= EMPTY_STREAK_STOP) break;
        continue;
      }

      if (rows.length === 0) {
        emptyStreak += 1;
      } else {
        emptyStreak = 0;
      }
      if (!pushFromRows(rows)) {
        return { limitReached: true };
      }

      if (emptyStreak >= EMPTY_STREAK_STOP) break;
    }
  }

  return { limitReached: false };
}

export async function scanStoresForBulkLinks(
  input: BulkScanInput,
  options?: BulkScanOptions,
): Promise<BulkScanResult> {
  const limiter = new HostRateLimiter();
  const delayMs = Math.max(250, input.request_delay_ms ?? DEFAULT_REQUEST_DELAY_MS);
  const maxNewProducts = Math.max(1, options?.max_new_products ?? input.max_new_products ?? Number.MAX_SAFE_INTEGER);
  const existingNormalizedUrls = options?.existing_normalized_urls ?? new Set<string>();

  const perStore = new Map<string, BulkScanStoreSummary>();
  const pending: BulkScanCandidate[] = [];
  const seenUrls = new Set<string>();
  let duplicatesIgnored = 0;
  let ignoredExisting = 0;
  let scannedTotal = 0;
  let limitReached = false;

  for (const store of input.stores) {
    if (limitReached) break;

    const key = store.store_id ?? store.store_name;
    perStore.set(key, {
      store_id: store.store_id,
      store_name: store.store_name,
      seeds_total: store.seeds.length,
      candidates_found: 0,
    });

    for (const seed of store.seeds) {
      if (limitReached) break;
      try {
        const seedResult = await scanSeed({
          seed,
          store,
          limiter,
          delayMs,
          onCandidate: (item) => {
            if (seenUrls.has(item.normalized_url)) {
              duplicatesIgnored += 1;
              return true;
            }
            seenUrls.add(item.normalized_url);
            scannedTotal += 1;

            if (existingNormalizedUrls.has(item.normalized_url)) {
              ignoredExisting += 1;
              return true;
            }

            pending.push(item);
            const summary = perStore.get(key);
            if (summary) summary.candidates_found += 1;

            if (pending.length >= maxNewProducts) {
              limitReached = true;
              return false;
            }

            return true;
          },
        });
        if (seedResult.limitReached) {
          limitReached = true;
          break;
        }
      } catch {
        // seed-level failure should not stop remaining stores
      }
    }
  }

  return {
    candidates: pending,
    summaries: [...perStore.values()],
    duplicates_ignored: duplicatesIgnored,
    ignored_existing: ignoredExisting,
    scanned_total: scannedTotal,
    limit_reached: limitReached,
  };
}

export function filterOutExistingCandidates(
  candidates: BulkScanCandidate[],
  existingNormalizedUrls: Set<string>,
): {
  pending: BulkScanCandidate[];
  ignored_existing: number;
} {
  const pending: BulkScanCandidate[] = [];
  let ignoredExisting = 0;

  for (const item of candidates) {
    if (existingNormalizedUrls.has(item.normalized_url)) {
      ignoredExisting += 1;
      continue;
    }
    pending.push(item);
  }

  return {
    pending,
    ignored_existing: ignoredExisting,
  };
}

export function normalizeStoreProductUrl(url: string): string {
  return normalizeProductUrl(url);
}

