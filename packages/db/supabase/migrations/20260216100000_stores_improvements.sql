-- Migration: Stores & Scraping Improvements
-- Description: Enhances stores table with scraper config, adds store_printing_links
--              for per-printing store URLs, improves scrape_jobs tracking.
-- Doc reference: 03_DATA_MODEL_SQL.md
-- Changelog:
--   2026-02-16 — Initial creation
--   2026-02-17 — Idempotent policies + remove dependency on user_profiles (use roles/user_roles).

-- ============================================================================
-- STORES: add scraper configuration fields
-- ============================================================================
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS scraper_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS scraper_config jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS polling_interval_hours int,
  ADD COLUMN IF NOT EXISTS last_polled_at timestamptz;

COMMENT ON COLUMN stores.scraper_type IS 'Type of scraper: manual, api, web_scrape, rss';
COMMENT ON COLUMN stores.scraper_config IS 'JSON config for the scraper: selectors, URL patterns, headers, etc.';
COMMENT ON COLUMN stores.polling_interval_hours IS 'Auto-polling interval in hours. NULL = manual only.';

-- ============================================================================
-- STORE PRINTING LINKS: maps a store to a specific card_printing with product URL
-- This is the core table that allows tracking which stores sell which printings.
-- ============================================================================
CREATE TABLE IF NOT EXISTS store_printing_links (
  store_printing_link_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id               uuid NOT NULL REFERENCES stores(store_id) ON DELETE CASCADE,
  card_printing_id       uuid NOT NULL REFERENCES card_printings(card_printing_id) ON DELETE CASCADE,
  product_url            text NOT NULL,
  product_name           text,
  last_price             numeric(12, 2),
  last_currency_id       uuid REFERENCES currencies(currency_id),
  last_scraped_at        timestamptz,
  is_active              boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_store_printing UNIQUE (store_id, card_printing_id)
);

CREATE INDEX IF NOT EXISTS idx_store_printing_links_store ON store_printing_links(store_id);
CREATE INDEX IF NOT EXISTS idx_store_printing_links_printing ON store_printing_links(card_printing_id);

-- ============================================================================
-- SCRAPE JOBS: add store reference and granular tracking
-- ============================================================================
ALTER TABLE scrape_jobs
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(store_id),
  ADD COLUMN IF NOT EXISTS triggered_by text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS items_success int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_failed int NOT NULL DEFAULT 0;

COMMENT ON COLUMN scrape_jobs.triggered_by IS 'Who triggered: manual, cron, api';

-- ============================================================================
-- Additional indexes for price queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_card_prices_source ON card_prices(price_source_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_store ON scrape_jobs(store_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);

-- ============================================================================
-- RLS for store_printing_links (read-only for all, write for admin)
-- ============================================================================
ALTER TABLE store_printing_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_printing_links_select ON store_printing_links;
CREATE POLICY store_printing_links_select ON store_printing_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS store_printing_links_admin_insert ON store_printing_links;
CREATE POLICY store_printing_links_admin_insert ON store_printing_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS store_printing_links_admin_update ON store_printing_links;
CREATE POLICY store_printing_links_admin_update ON store_printing_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

DROP POLICY IF EXISTS store_printing_links_admin_delete ON store_printing_links;
CREATE POLICY store_printing_links_admin_delete ON store_printing_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );
