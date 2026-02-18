/**
 * Scraping schemas — job management and scrape results.
 * Doc reference: 03_DATA_MODEL_SQL.md
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { z } from 'zod';

// ============================================================================
// Scrape job schemas
// ============================================================================

export const scrapeJobStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);
export type ScrapeJobStatus = z.infer<typeof scrapeJobStatusSchema>;

export const scrapeTriggeredBySchema = z.enum(['manual', 'cron', 'api']);
export type ScrapeTriggeredBy = z.infer<typeof scrapeTriggeredBySchema>;

export const scrapeJobSchema = z.object({
  scrape_job_id: z.string().uuid(),
  price_source_id: z.string().uuid(),
  store_id: z.string().uuid().nullable(),
  status: scrapeJobStatusSchema,
  triggered_by: scrapeTriggeredBySchema,
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  items_count: z.number().int(),
  items_success: z.number().int(),
  items_failed: z.number().int(),
  error_message: z.string().nullable(),
});

export type ScrapeJob = z.infer<typeof scrapeJobSchema>;

export const scrapeJobItemSchema = z.object({
  scrape_job_item_id: z.string().uuid(),
  scrape_job_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  raw_price: z.number(),
  currency_id: z.string().uuid(),
  raw_data: z.record(z.unknown()).nullable(),
  created_at: z.string(),
});

export type ScrapeJobItem = z.infer<typeof scrapeJobItemSchema>;

// ============================================================================
// Trigger scrape input
// ============================================================================

export const triggerScrapeSchema = z.object({
  scope: z.enum(['all', 'single']).default('all'),
  card_printing_id: z.string().uuid().optional(),
  store_printing_link_id: z.string().uuid().optional(),
});

export type TriggerScrape = z.infer<typeof triggerScrapeSchema>;
