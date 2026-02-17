/**
 * Store schemas — CRUD for stores and store-printing links.
 * Doc reference: 03_DATA_MODEL_SQL.md
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { z } from 'zod';

// ============================================================================
// Scraper type enum
// ============================================================================

export const scraperTypeSchema = z.enum(['manual', 'api', 'web_scrape', 'rss']);
export type ScraperType = z.infer<typeof scraperTypeSchema>;

// ============================================================================
// Store schemas
// ============================================================================

export const storeSchema = z.object({
  store_id: z.string().uuid(),
  name: z.string(),
  url: z.string().nullable(),
  currency_id: z.string().uuid().nullable(),
  logo_url: z.string().nullable(),
  scraper_type: scraperTypeSchema,
  scraper_config: z.record(z.unknown()),
  polling_interval_hours: z.number().int().positive().nullable(),
  last_polled_at: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Store = z.infer<typeof storeSchema>;

export const createStoreSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().optional().nullable(),
  currency_id: z.string().uuid().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  scraper_type: scraperTypeSchema.default('manual'),
  scraper_config: z.record(z.unknown()).default({}),
  polling_interval_hours: z.number().int().positive().optional().nullable(),
});

export type CreateStore = z.infer<typeof createStoreSchema>;

export const updateStoreSchema = createStoreSchema.partial();
export type UpdateStore = z.infer<typeof updateStoreSchema>;

// ============================================================================
// Store-Printing Link schemas
// ============================================================================

export const storePrintingLinkSchema = z.object({
  store_printing_link_id: z.string().uuid(),
  store_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  product_url: z.string(),
  product_name: z.string().nullable(),
  last_price: z.number().nullable(),
  last_currency_id: z.string().uuid().nullable(),
  last_scraped_at: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type StorePrintingLink = z.infer<typeof storePrintingLinkSchema>;

export const createStorePrintingLinkSchema = z.object({
  card_printing_id: z.string().uuid(),
  product_url: z.string().url().min(1),
  product_name: z.string().max(500).optional().nullable(),
});

export type CreateStorePrintingLink = z.infer<typeof createStorePrintingLinkSchema>;

export const updateStorePrintingLinkSchema = z.object({
  product_url: z.string().url().optional(),
  product_name: z.string().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

export type UpdateStorePrintingLink = z.infer<typeof updateStorePrintingLinkSchema>;
