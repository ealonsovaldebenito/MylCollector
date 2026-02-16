-- Migration: Extensions and Enums
-- Description: Enable required extensions and create enum types
-- Doc reference: 03_DATA_MODEL_SQL.md

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- pg_trgm for fuzzy search on card names
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- pgcrypto for UUID generation and hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Visibility levels for decks and shares
CREATE TYPE visibility_level AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- Validation message severity
CREATE TYPE validation_severity AS ENUM ('BLOCK', 'WARN', 'INFO');

-- Legal status for cards/printings
CREATE TYPE legal_status_type AS ENUM ('LEGAL', 'RESTRICTED', 'BANNED', 'DISCONTINUED');

-- Price submission status
CREATE TYPE submission_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Moderation action types
CREATE TYPE moderation_action_type AS ENUM ('APPROVE', 'REJECT', 'WARN', 'BAN', 'UNBAN');

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'SHARE',
  'EXPORT',
  'IMPORT',
  'VALIDATE',
  'SUBMIT_PRICE',
  'VOTE',
  'REPORT'
);
