/**
 * Ban list schemas — revision tracking and format card limits management.
 * Doc reference: 04_DECK_VALIDATION_ENGINE.md
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { z } from 'zod';

// ============================================================================
// Change type enum
// ============================================================================

export const banListChangeTypeSchema = z.enum(['BANNED', 'RESTRICTED', 'RELEASED', 'MODIFIED']);
export type BanListChangeType = z.infer<typeof banListChangeTypeSchema>;

// ============================================================================
// Ban list revision schemas
// ============================================================================

export const banListRevisionSchema = z.object({
  revision_id: z.string().uuid(),
  format_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  effective_date: z.string(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
});

export type BanListRevision = z.infer<typeof banListRevisionSchema>;

// ============================================================================
// Ban list entry schemas
// ============================================================================

export const banListEntrySchema = z.object({
  entry_id: z.string().uuid(),
  revision_id: z.string().uuid(),
  card_id: z.string().uuid(),
  max_qty: z.number().int().min(0),
  previous_qty: z.number().int().min(0).nullable(),
  change_type: banListChangeTypeSchema,
  notes: z.string().nullable(),
  created_at: z.string(),
});

export type BanListEntry = z.infer<typeof banListEntrySchema>;

// ============================================================================
// Input schemas for creating revisions
// ============================================================================

export const banListEntryInputSchema = z.object({
  card_id: z.string().uuid(),
  max_qty: z.number().int().min(0).max(10),
  change_type: banListChangeTypeSchema,
  notes: z.string().max(1000).optional().nullable(),
});

export type BanListEntryInput = z.infer<typeof banListEntryInputSchema>;

export const createBanListRevisionSchema = z.object({
  format_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z.array(banListEntryInputSchema).min(1),
});

export type CreateBanListRevision = z.infer<typeof createBanListRevisionSchema>;

// ============================================================================
// Format card limit management (individual upsert)
// ============================================================================

export const upsertFormatCardLimitSchema = z.object({
  card_id: z.string().uuid(),
  max_qty: z.number().int().min(0).max(10),
  notes: z.string().max(1000).optional().nullable(),
});

export type UpsertFormatCardLimit = z.infer<typeof upsertFormatCardLimitSchema>;

// ============================================================================
// Format card limit response
// ============================================================================

export const formatCardLimitSchema = z.object({
  format_card_limit_id: z.string().uuid(),
  format_id: z.string().uuid(),
  card_id: z.string().uuid(),
  max_qty: z.number().int().min(0),
  notes: z.string().nullable(),
  revision_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FormatCardLimit = z.infer<typeof formatCardLimitSchema>;
