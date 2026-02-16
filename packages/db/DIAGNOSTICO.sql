-- ============================================
-- DIAGNÓSTICO - Base de datos MYL en Supabase
-- ============================================
-- Ejecuta este script PRIMERO para ver qué ya existe
-- en tu base de datos antes de ejecutar SETUP_COMPLETO.sql
-- ============================================

-- 1. TABLAS EXISTENTES
SELECT
  'TABLAS' as tipo,
  schemaname as schema,
  tablename as nombre
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'blocks', 'editions', 'card_types', 'races', 'rarity_tiers', 'rarity_eras',
    'cards', 'card_printings', 'tags', 'card_tags', 'currencies', 'stores',
    'languages', 'finishes', 'card_conditions', 'users', 'roles', 'user_roles',
    'audit_log', 'user_cards', 'formats', 'format_rules', 'format_allowed_blocks',
    'format_allowed_editions', 'format_allowed_card_types', 'format_allowed_races',
    'format_card_limits', 'decks', 'deck_versions', 'deck_version_cards',
    'deck_validation_runs', 'deck_validation_messages', 'deck_stats_snapshots',
    'deck_shares', 'public_decks', 'public_deck_cards', 'price_sources',
    'scrape_jobs', 'scrape_job_items', 'card_prices', 'community_price_submissions',
    'community_price_votes', 'card_price_consensus', 'card_pair_stats',
    'recommendation_serves', 'recommendation_feedback', 'link_suggestions',
    'reports', 'moderation_actions'
  )
ORDER BY tablename;

-- 2. ÍNDICES EXISTENTES
SELECT
  'INDICES' as tipo,
  schemaname as schema,
  indexname as nombre,
  tablename as tabla
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- 3. TIPOS ENUM EXISTENTES
SELECT
  'ENUMS' as tipo,
  n.nspname as schema,
  t.typname as nombre,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN (
    'visibility_level', 'validation_severity', 'legal_status_type',
    'submission_status', 'moderation_action_type', 'audit_action'
  )
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- 4. POLÍTICAS RLS EXISTENTES
SELECT
  'POLITICAS_RLS' as tipo,
  schemaname as schema,
  tablename as tabla,
  policyname as nombre_politica,
  cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'user_cards', 'decks', 'deck_versions', 'deck_version_cards',
    'deck_shares', 'community_price_submissions', 'community_price_votes', 'audit_log'
  )
ORDER BY tablename, policyname;

-- 5. STORAGE BUCKETS EXISTENTES
SELECT
  'STORAGE_BUCKETS' as tipo,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'card-images';

-- 6. POLÍTICAS STORAGE EXISTENTES
SELECT
  'STORAGE_POLITICAS' as tipo,
  schemaname as schema,
  tablename as tabla,
  policyname as nombre_politica
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%card images%'
ORDER BY policyname;

-- 7. TRIGGERS EXISTENTES
SELECT
  'TRIGGERS' as tipo,
  event_object_schema as schema,
  event_object_table as tabla,
  trigger_name as nombre_trigger,
  action_statement as accion
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND trigger_name LIKE 'trg_%'
ORDER BY event_object_table, trigger_name;

-- 8. FUNCIONES EXISTENTES
SELECT
  'FUNCIONES' as tipo,
  n.nspname as schema,
  p.proname as nombre_funcion,
  pg_get_function_result(p.oid) as retorno
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('trg_validate_ally_strength', 'set_updated_at')
ORDER BY p.proname;

-- 9. EXTENSIONES INSTALADAS
SELECT
  'EXTENSIONES' as tipo,
  extname as nombre,
  extversion as version
FROM pg_extension
WHERE extname IN ('pg_trgm', 'pgcrypto')
ORDER BY extname;

-- 10. CONTEO DE DATOS SEED (solo si las tablas existen)
DO $$
DECLARE
  v_blocks_count int := 0;
  v_editions_count int := 0;
  v_card_types_count int := 0;
  v_races_count int := 0;
  v_rarity_tiers_count int := 0;
  v_tags_count int := 0;
  v_currencies_count int := 0;
  v_formats_count int := 0;
  v_cards_count int := 0;
  v_card_printings_count int := 0;
BEGIN
  -- Contar solo si las tablas existen
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blocks') THEN
    SELECT COUNT(*) INTO v_blocks_count FROM blocks;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'editions') THEN
    SELECT COUNT(*) INTO v_editions_count FROM editions;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'card_types') THEN
    SELECT COUNT(*) INTO v_card_types_count FROM card_types;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'races') THEN
    SELECT COUNT(*) INTO v_races_count FROM races;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rarity_tiers') THEN
    SELECT COUNT(*) INTO v_rarity_tiers_count FROM rarity_tiers;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
    SELECT COUNT(*) INTO v_tags_count FROM tags;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'currencies') THEN
    SELECT COUNT(*) INTO v_currencies_count FROM currencies;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'formats') THEN
    SELECT COUNT(*) INTO v_formats_count FROM formats;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cards') THEN
    SELECT COUNT(*) INTO v_cards_count FROM cards;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'card_printings') THEN
    SELECT COUNT(*) INTO v_card_printings_count FROM card_printings;
  END IF;

  -- Mostrar resultados
  RAISE NOTICE '=== CONTEO DE DATOS SEED ===';
  RAISE NOTICE 'blocks: %', v_blocks_count;
  RAISE NOTICE 'editions: %', v_editions_count;
  RAISE NOTICE 'card_types: %', v_card_types_count;
  RAISE NOTICE 'races: %', v_races_count;
  RAISE NOTICE 'rarity_tiers: %', v_rarity_tiers_count;
  RAISE NOTICE 'tags: %', v_tags_count;
  RAISE NOTICE 'currencies: %', v_currencies_count;
  RAISE NOTICE 'formats: %', v_formats_count;
  RAISE NOTICE 'cards: %', v_cards_count;
  RAISE NOTICE 'card_printings: %', v_card_printings_count;
  RAISE NOTICE '============================';
END $$;
