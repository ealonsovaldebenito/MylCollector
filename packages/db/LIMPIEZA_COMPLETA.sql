-- ============================================
-- LIMPIEZA COMPLETA - Base de datos MYL
-- ============================================
-- ⚠️ ADVERTENCIA: Este script ELIMINA TODO
-- Solo ejecuta esto si quieres empezar desde cero
-- ============================================

-- 1. DESACTIVAR RLS en todas las tablas
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS decks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deck_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deck_version_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS deck_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS community_price_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS community_price_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_log DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS STORAGE
DROP POLICY IF EXISTS "Public read access for card images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload card images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update card images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete card images" ON storage.objects;

-- 3. ELIMINAR BUCKET STORAGE
DELETE FROM storage.buckets WHERE id = 'card-images';

-- 4. ELIMINAR POLÍTICAS RLS (por tabla)
-- users
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- user_cards
DROP POLICY IF EXISTS user_cards_select_own ON user_cards;
DROP POLICY IF EXISTS user_cards_insert_own ON user_cards;
DROP POLICY IF EXISTS user_cards_update_own ON user_cards;
DROP POLICY IF EXISTS user_cards_delete_own ON user_cards;

-- decks
DROP POLICY IF EXISTS decks_select ON decks;
DROP POLICY IF EXISTS decks_insert_own ON decks;
DROP POLICY IF EXISTS decks_update_own ON decks;
DROP POLICY IF EXISTS decks_delete_own ON decks;

-- deck_versions
DROP POLICY IF EXISTS deck_versions_select ON deck_versions;
DROP POLICY IF EXISTS deck_versions_insert_own ON deck_versions;

-- deck_version_cards
DROP POLICY IF EXISTS deck_version_cards_select ON deck_version_cards;
DROP POLICY IF EXISTS deck_version_cards_insert_own ON deck_version_cards;

-- deck_shares
DROP POLICY IF EXISTS deck_shares_select ON deck_shares;
DROP POLICY IF EXISTS deck_shares_insert_own ON deck_shares;
DROP POLICY IF EXISTS deck_shares_update_own ON deck_shares;

-- community_price_submissions
DROP POLICY IF EXISTS submissions_select_all ON community_price_submissions;
DROP POLICY IF EXISTS submissions_insert_auth ON community_price_submissions;

-- community_price_votes
DROP POLICY IF EXISTS votes_select_all ON community_price_votes;
DROP POLICY IF EXISTS votes_insert_auth ON community_price_votes;
DROP POLICY IF EXISTS votes_delete_own ON community_price_votes;

-- audit_log
DROP POLICY IF EXISTS audit_log_select_own ON audit_log;

-- 5. ELIMINAR TRIGGERS
DROP TRIGGER IF EXISTS trg_cards_ally_strength ON cards;
DROP TRIGGER IF EXISTS trg_updated_at_blocks ON blocks;
DROP TRIGGER IF EXISTS trg_updated_at_editions ON editions;
DROP TRIGGER IF EXISTS trg_updated_at_stores ON stores;
DROP TRIGGER IF EXISTS trg_updated_at_cards ON cards;
DROP TRIGGER IF EXISTS trg_updated_at_card_printings ON card_printings;
DROP TRIGGER IF EXISTS trg_updated_at_users ON users;
DROP TRIGGER IF EXISTS trg_updated_at_user_cards ON user_cards;
DROP TRIGGER IF EXISTS trg_updated_at_formats ON formats;
DROP TRIGGER IF EXISTS trg_updated_at_decks ON decks;
DROP TRIGGER IF EXISTS trg_updated_at_public_decks ON public_decks;

-- 6. ELIMINAR FUNCIONES
DROP FUNCTION IF EXISTS trg_validate_ally_strength() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- 7. ELIMINAR ÍNDICES
DROP INDEX IF EXISTS idx_editions_block_id;
DROP INDEX IF EXISTS idx_cards_name_trgm;
DROP INDEX IF EXISTS idx_cards_name_normalized;
DROP INDEX IF EXISTS idx_card_printings_edition_rarity;
DROP INDEX IF EXISTS idx_card_printings_card_edition;
DROP INDEX IF EXISTS idx_card_tags_tag;
DROP INDEX IF EXISTS idx_audit_log_actor_time;
DROP INDEX IF EXISTS idx_audit_log_entity;
DROP INDEX IF EXISTS idx_audit_log_request_id;
DROP INDEX IF EXISTS idx_user_cards_user_id;
DROP INDEX IF EXISTS idx_format_rules_format;
DROP INDEX IF EXISTS idx_format_card_limits_lookup;
DROP INDEX IF EXISTS idx_decks_user_id;
DROP INDEX IF EXISTS idx_deck_versions_deck_id;
DROP INDEX IF EXISTS idx_deck_version_cards_version;
DROP INDEX IF EXISTS idx_validation_runs_version;
DROP INDEX IF EXISTS idx_validation_messages_run;
DROP INDEX IF EXISTS idx_validation_messages_rule;
DROP INDEX IF EXISTS idx_deck_shares_share_code;
DROP INDEX IF EXISTS idx_deck_shares_version;
DROP INDEX IF EXISTS idx_public_deck_cards_deck;
DROP INDEX IF EXISTS idx_card_prices_printing_time;
DROP INDEX IF EXISTS idx_reports_status;

-- 8. ELIMINAR TABLAS (en orden inverso de dependencias)
DROP TABLE IF EXISTS moderation_actions CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS link_suggestions CASCADE;
DROP TABLE IF EXISTS recommendation_feedback CASCADE;
DROP TABLE IF EXISTS recommendation_serves CASCADE;
DROP TABLE IF EXISTS card_pair_stats CASCADE;
DROP TABLE IF EXISTS card_price_consensus CASCADE;
DROP TABLE IF EXISTS community_price_votes CASCADE;
DROP TABLE IF EXISTS community_price_submissions CASCADE;
DROP TABLE IF EXISTS card_prices CASCADE;
DROP TABLE IF EXISTS scrape_job_items CASCADE;
DROP TABLE IF EXISTS scrape_jobs CASCADE;
DROP TABLE IF EXISTS price_sources CASCADE;
DROP TABLE IF EXISTS public_deck_cards CASCADE;
DROP TABLE IF EXISTS public_decks CASCADE;
DROP TABLE IF EXISTS deck_shares CASCADE;
DROP TABLE IF EXISTS deck_stats_snapshots CASCADE;
DROP TABLE IF EXISTS deck_validation_messages CASCADE;
DROP TABLE IF EXISTS deck_validation_runs CASCADE;
DROP TABLE IF EXISTS deck_version_cards CASCADE;
DROP TABLE IF EXISTS deck_versions CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS format_card_limits CASCADE;
DROP TABLE IF EXISTS format_allowed_races CASCADE;
DROP TABLE IF EXISTS format_allowed_card_types CASCADE;
DROP TABLE IF EXISTS format_allowed_editions CASCADE;
DROP TABLE IF EXISTS format_allowed_blocks CASCADE;
DROP TABLE IF EXISTS format_rules CASCADE;
DROP TABLE IF EXISTS formats CASCADE;
DROP TABLE IF EXISTS user_cards CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS card_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS card_printings CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS card_conditions CASCADE;
DROP TABLE IF EXISTS finishes CASCADE;
DROP TABLE IF EXISTS languages CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS rarity_eras CASCADE;
DROP TABLE IF EXISTS rarity_tiers CASCADE;
DROP TABLE IF EXISTS races CASCADE;
DROP TABLE IF EXISTS card_types CASCADE;
DROP TABLE IF EXISTS editions CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;

-- 9. ELIMINAR TIPOS ENUM
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS moderation_action_type CASCADE;
DROP TYPE IF EXISTS submission_status CASCADE;
DROP TYPE IF EXISTS legal_status_type CASCADE;
DROP TYPE IF EXISTS validation_severity CASCADE;
DROP TYPE IF EXISTS visibility_level CASCADE;

-- 10. ELIMINAR EXTENSIONES (solo si estás seguro que no las usa nada más)
-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;
-- DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== LIMPIEZA COMPLETA EJECUTADA ===';
  RAISE NOTICE 'Tablas restantes: %', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public');
  RAISE NOTICE 'Índices restantes: %', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%');
  RAISE NOTICE 'Tipos enum restantes: %', (SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e');
  RAISE NOTICE 'Base de datos lista para ejecutar SETUP_COMPLETO.sql';
  RAISE NOTICE '====================================';
END $$;
