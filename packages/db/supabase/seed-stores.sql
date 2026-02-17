-- Seed: Insert the 3 Chilean MYL card stores
-- Run this AFTER applying migration 20260216100000_stores_improvements.sql
--
-- Stores:
--   1. MercaderesStore (TiendaNube)
--   2. PandoraStore (Jumpseller)
--   3. ArkanoGames (WooCommerce)
--
-- Changelog:
--   2026-02-16 — Initial creation

-- ============================================================================
-- Ensure CLP currency exists
-- ============================================================================
INSERT INTO currencies (code, name, symbol)
VALUES ('CLP', 'Peso Chileno', '$')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Insert stores
-- ============================================================================

-- MercaderesStore (TiendaNube / Nuvemshop)
INSERT INTO stores (name, url, scraper_type, scraper_config, polling_interval_hours, is_active)
VALUES (
  'MercaderesStore',
  'https://mercaderesstore.cl',
  'web_scrape',
  '{
    "platform": "tiendanube",
    "default_currency": "CLP",
    "base_url": "https://mercaderesstore.cl/productos/"
  }'::jsonb,
  24,
  true
)
ON CONFLICT DO NOTHING;

-- PandoraStore (Jumpseller)
INSERT INTO stores (name, url, scraper_type, scraper_config, polling_interval_hours, is_active)
VALUES (
  'PandoraStore',
  'https://www.pandorastore.cl',
  'web_scrape',
  '{
    "platform": "jumpseller",
    "default_currency": "CLP",
    "base_url": "https://www.pandorastore.cl/"
  }'::jsonb,
  24,
  true
)
ON CONFLICT DO NOTHING;

-- ArkanoGames (WooCommerce)
INSERT INTO stores (name, url, scraper_type, scraper_config, polling_interval_hours, is_active)
VALUES (
  'ArkanoGames',
  'http://arkanogames.cl',
  'web_scrape',
  '{
    "platform": "woocommerce",
    "default_currency": "CLP",
    "base_url": "http://arkanogames.cl/producto/"
  }'::jsonb,
  24,
  true
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create price_sources for each store
-- ============================================================================
INSERT INTO price_sources (store_id, name, source_type, is_active)
SELECT s.store_id, 'Scraper - ' || s.name, 'scrape', true
FROM stores s
WHERE s.name IN ('MercaderesStore', 'PandoraStore', 'ArkanoGames')
  AND NOT EXISTS (
    SELECT 1 FROM price_sources ps WHERE ps.store_id = s.store_id
  );
