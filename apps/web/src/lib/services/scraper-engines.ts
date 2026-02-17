/**
 * Scraper engines — platform-specific HTML parsers for extracting card prices.
 *
 * Supported platforms:
 *   - woocommerce: WordPress + WooCommerce (ArkanoGames, etc.) — JSON-LD + OG meta
 *   - tiendanube:  TiendaNube/Nuvemshop (MercaderesStore, etc.) — tiendanube:* meta + LS.variants
 *   - jumpseller:  Jumpseller (PandoraStore, etc.) — OG product:* meta
 *   - generic_og:  Fallback using standard OG product meta tags
 *
 * Each engine receives raw HTML and returns a ScrapedProduct.
 *
 * Changelog:
 *   2026-02-16 — Initial creation with 3 store platforms + generic fallback
 */

// ============================================================================
// Types
// ============================================================================

export interface ScrapedProduct {
  name: string | null;
  price: number | null;
  currency: string;
  stock: number | null;
  available: boolean;
  image_url: string | null;
  sku: string | null;
  category: string | null;
  original_price: number | null;
  raw_data: Record<string, unknown>;
}

export type ScraperPlatform = 'woocommerce' | 'tiendanube' | 'jumpseller' | 'generic_og';

export interface ScraperConfig {
  platform: ScraperPlatform;
  /** Custom headers to include in fetch (e.g. User-Agent) */
  headers?: Record<string, string>;
  /** Price multiplier if the platform returns cents (e.g. TiendaNube) */
  price_divisor?: number;
  /** Override currency code if the platform doesn't provide it */
  default_currency?: string;
}

// ============================================================================
// Helpers: HTML meta/content extraction (regex-based, no DOM parser needed)
// ============================================================================

function getMetaContent(html: string, property: string): string | null {
  // Match <meta property="X" content="Y"> or <meta name="X" content="Y">
  // Also handles content before property (content="Y" property="X")
  const patterns = [
    new RegExp(`<meta\\s+(?:[^>]*?\\s)?property=["']${escapeRegex(property)}["']\\s+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta\\s+(?:[^>]*?\\s)?content=["']([^"']*)["']\\s+property=["']${escapeRegex(property)}["']`, 'i'),
    new RegExp(`<meta\\s+(?:[^>]*?\\s)?name=["']${escapeRegex(property)}["']\\s+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta\\s+(?:[^>]*?\\s)?content=["']([^"']*)["']\\s+name=["']${escapeRegex(property)}["']`, 'i'),
  ];

  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]!);
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return results;
}

function findProductInJsonLd(jsonLdItems: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const item of jsonLdItems) {
    if (item['@type'] === 'Product') return item;
    // Check @graph array (RankMath, Yoast patterns)
    const graph = item['@graph'];
    if (Array.isArray(graph)) {
      for (const node of graph) {
        if (typeof node === 'object' && node !== null && (node as Record<string, unknown>)['@type'] === 'Product') {
          return node as Record<string, unknown>;
        }
      }
    }
  }
  return null;
}

function parsePrice(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).replace(/[^0-9.,]/g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseAvailability(value: string | null | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.includes('instock') || lower.includes('in_stock') || lower === 'true';
}

// ============================================================================
// WooCommerce scraper (ArkanoGames, etc.)
// Extracts from JSON-LD Product > offers, with OG meta fallback
// ============================================================================

function scrapeWooCommerce(html: string, _config: ScraperConfig): ScrapedProduct {
  const jsonLdItems = extractJsonLd(html);
  const product = findProductInJsonLd(jsonLdItems);

  let name: string | null = null;
  let price: number | null = null;
  let currency = 'CLP';
  let available = false;
  let image_url: string | null = null;
  let sku: string | null = null;
  let category: string | null = null;
  let stock: number | null = null;
  const original_price: number | null = null;

  if (product) {
    // Clean name: remove " - sitename" suffix
    const rawName = String(product.name ?? '');
    name = rawName.replace(/\s*-\s*www\.\w+\.\w+$/i, '').trim() || null;
    sku = product.sku ? String(product.sku) : null;
    category = product.category ? String(product.category) : null;

    // Image
    const images = product.image;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0] as Record<string, unknown>;
      image_url = first?.url ? String(first.url) : null;
    } else if (typeof images === 'object' && images !== null) {
      image_url = (images as Record<string, unknown>).url ? String((images as Record<string, unknown>).url) : null;
    }

    // Offers
    const offers = product.offers as Record<string, unknown> | undefined;
    if (offers) {
      price = parsePrice(offers.price as string | undefined);
      currency = String(offers.priceCurrency ?? 'CLP');
      available = parseAvailability(offers.availability as string | undefined);
    }
  }

  // Fallback to OG meta
  if (!name) name = getMetaContent(html, 'og:title');
  if (price === null) price = parsePrice(getMetaContent(html, 'product:price:amount'));
  if (!image_url) image_url = getMetaContent(html, 'og:image');
  currency = getMetaContent(html, 'product:price:currency') ?? currency;
  if (!available) available = parseAvailability(getMetaContent(html, 'product:availability'));

  // Twitter stock info (ArkanoGames provides stock in twitter:data2)
  const twitterData2 = getMetaContent(html, 'twitter:data2');
  if (twitterData2) {
    const stockMatch = twitterData2.match(/(\d+)/);
    if (stockMatch) stock = parseInt(stockMatch[1]!, 10);
  }

  return {
    name, price, currency, stock, available, image_url,
    sku, category, original_price,
    raw_data: { platform: 'woocommerce', json_ld: product ?? null },
  };
}

// ============================================================================
// TiendaNube scraper (MercaderesStore, etc.)
// Extracts from tiendanube:* meta tags + LS.variants JS object
// ============================================================================

function scrapeTiendaNube(html: string, config: ScraperConfig): ScrapedProduct {
  const name = getMetaContent(html, 'og:title');
  const image_url = getMetaContent(html, 'og:image') ?? getMetaContent(html, 'og:image:secure_url');

  // TiendaNube-specific meta
  let price = parsePrice(getMetaContent(html, 'tiendanube:price'));
  const stockMeta = getMetaContent(html, 'tiendanube:stock');
  let stock = stockMeta ? parseInt(stockMeta, 10) : null;
  let available = stock !== null && stock > 0;
  let original_price: number | null = null;

  // Try LS.variants for more reliable data
  const variantsMatch = html.match(/LS\.variants\s*=\s*(\[[\s\S]*?\]);/);
  if (variantsMatch?.[1]) {
    try {
      const variants = JSON.parse(variantsMatch[1]) as Array<Record<string, unknown>>;
      if (variants.length > 0) {
        const v = variants[0]!;
        // price_number is the actual sale price
        const variantPrice = parsePrice(v.price_number as number | undefined);
        if (variantPrice !== null) price = variantPrice;

        // compare_at_price_number is the original/list price
        const comparePrice = parsePrice(v.compare_at_price_number as number | undefined);
        if (comparePrice !== null && comparePrice !== price) original_price = comparePrice;

        if (typeof v.stock === 'number') stock = v.stock;
        if (typeof v.available === 'boolean') available = v.available;
      }
    } catch {
      // Invalid JSON, use meta fallback
    }
  }

  // TiendaNube sometimes returns price in cents (price_number_raw)
  // but price_number is usually correct in CLP
  const divisor = config.price_divisor ?? 1;
  if (price !== null && divisor > 1) price = price / divisor;
  if (original_price !== null && divisor > 1) original_price = original_price / divisor;

  return {
    name, price,
    currency: config.default_currency ?? 'CLP',
    stock, available, image_url,
    sku: null, category: null, original_price,
    raw_data: { platform: 'tiendanube' },
  };
}

// ============================================================================
// Jumpseller scraper (PandoraStore, etc.)
// Extracts from OG product:* meta tags + JSON-LD
// ============================================================================

function scrapeJumpseller(html: string, _config: ScraperConfig): ScrapedProduct {
  const name = getMetaContent(html, 'og:title');
  const image_url = getMetaContent(html, 'og:image');
  const price = parsePrice(getMetaContent(html, 'product:price:amount'));
  const original_price = parsePrice(getMetaContent(html, 'product:original_price:amount'));
  const currency = getMetaContent(html, 'product:price:currency') ?? 'CLP';
  const available = parseAvailability(getMetaContent(html, 'product:availability'));

  // Try JSON-LD for extra data
  const jsonLdItems = extractJsonLd(html);
  let sku: string | null = null;
  for (const item of jsonLdItems) {
    if (item['@type'] === 'Product') {
      sku = item.sku ? String(item.sku) : null;
      break;
    }
  }

  return {
    name, price, currency, stock: null, available, image_url,
    sku, category: null,
    original_price: original_price !== price ? original_price : null,
    raw_data: { platform: 'jumpseller' },
  };
}

// ============================================================================
// Generic OG fallback
// Works with any site that has standard product:* or og:* meta tags
// ============================================================================

function scrapeGenericOG(html: string, config: ScraperConfig): ScrapedProduct {
  const name = getMetaContent(html, 'og:title');
  const image_url = getMetaContent(html, 'og:image');
  const price = parsePrice(
    getMetaContent(html, 'product:price:amount')
    ?? getMetaContent(html, 'og:price:amount'),
  );
  const currency = getMetaContent(html, 'product:price:currency')
    ?? getMetaContent(html, 'og:price:currency')
    ?? config.default_currency ?? 'CLP';
  const available = parseAvailability(getMetaContent(html, 'product:availability'));

  // Try JSON-LD as supplement
  const jsonLdItems = extractJsonLd(html);
  const product = findProductInJsonLd(jsonLdItems);
  let sku: string | null = null;
  if (product?.sku) sku = String(product.sku);

  return {
    name, price, currency, stock: null, available, image_url,
    sku, category: null, original_price: null,
    raw_data: { platform: 'generic_og', json_ld: product ?? null },
  };
}

// ============================================================================
// Engine dispatcher
// ============================================================================

const ENGINES: Record<ScraperPlatform, (html: string, config: ScraperConfig) => ScrapedProduct> = {
  woocommerce: scrapeWooCommerce,
  tiendanube: scrapeTiendaNube,
  jumpseller: scrapeJumpseller,
  generic_og: scrapeGenericOG,
};

/**
 * Parse a product page HTML using the appropriate platform engine.
 * Returns a normalized ScrapedProduct.
 */
export function scrapeProductPage(html: string, config: ScraperConfig): ScrapedProduct {
  const engine = ENGINES[config.platform] ?? scrapeGenericOG;
  return engine(html, config);
}

/**
 * Fetch a product page and scrape it.
 * Uses server-side fetch with a browser-like User-Agent.
 */
export async function fetchAndScrape(url: string, config: ScraperConfig): Promise<ScrapedProduct> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-CL,es;q=0.9',
    ...config.headers,
  };

  const response = await fetch(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al obtener ${url}`);
  }

  const html = await response.text();
  const result = scrapeProductPage(html, config);

  // Enrich raw_data with fetch metadata
  result.raw_data.fetched_url = url;
  result.raw_data.response_status = response.status;
  result.raw_data.fetched_at = new Date().toISOString();

  return result;
}

/**
 * Detect platform from a store URL (best-effort heuristic).
 */
export function detectPlatform(html: string): ScraperPlatform {
  if (html.includes('mitiendanube.com') || html.includes('tiendanube:')) return 'tiendanube';
  if (html.includes('jumpseller.com') || html.includes('cdnx.jumpseller.com')) return 'jumpseller';
  if (html.includes('woocommerce') || html.includes('WooCommerce') || html.includes('wc-block')) return 'woocommerce';
  return 'generic_og';
}
