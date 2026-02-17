/**
 * Oracle & Strategy schemas — Zod schemas for card oracles (rulings/errata)
 * and deck strategy content sections.
 *
 * Doc reference: 03_DATA_MODEL_SQL.md
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { z } from 'zod';

// ============================================================================
// Ability type enum
// ============================================================================

export const abilityTypeSchema = z.enum([
  'ACTIVADA',
  'PASIVA',
  'ESPECIAL',
  'CONTINUA',
  'DISPARADA',
]);
export type OracleAbilityType = z.infer<typeof abilityTypeSchema>;

// ============================================================================
// Strategy section type enum
// ============================================================================

export const strategySectionTypeSchema = z.enum([
  'game_plan',
  'resources',
  'synergies',
  'combos',
  'card_analysis',
  'matchups',
  'mulligan',
  'tips',
  'custom',
]);
export type StrategySectionType = z.infer<typeof strategySectionTypeSchema>;

// ============================================================================
// Card Oracle
// ============================================================================

export const cardOracleSchema = z.object({
  oracle_id: z.string().uuid(),
  card_id: z.string().uuid(),
  source_document: z.string(),
  ruling_text: z.string(),
  ability_type: abilityTypeSchema.nullable(),
  sort_order: z.number().int(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CardOracle = z.infer<typeof cardOracleSchema>;

export const createCardOracleSchema = z.object({
  card_id: z.string().uuid(),
  source_document: z.string().min(1, 'El documento fuente es requerido'),
  ruling_text: z.string().min(1, 'El texto del ruling es requerido'),
  ability_type: abilityTypeSchema.nullable().optional(),
  sort_order: z.number().int().optional(),
});
export type CreateCardOracle = z.infer<typeof createCardOracleSchema>;

export const updateCardOracleSchema = z.object({
  source_document: z.string().min(1).optional(),
  ruling_text: z.string().min(1).optional(),
  ability_type: abilityTypeSchema.nullable().optional(),
  sort_order: z.number().int().optional(),
});
export type UpdateCardOracle = z.infer<typeof updateCardOracleSchema>;

// ============================================================================
// Deck Strategy Section
// ============================================================================

export const deckStrategySectionSchema = z.object({
  section_id: z.string().uuid(),
  deck_id: z.string().uuid(),
  section_type: strategySectionTypeSchema,
  title: z.string(),
  content: z.string(),
  sort_order: z.number().int(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DeckStrategySection = z.infer<typeof deckStrategySectionSchema>;

export const createDeckStrategySectionSchema = z.object({
  section_type: strategySectionTypeSchema,
  title: z.string().min(1, 'El título es requerido'),
  content: z.string().min(1, 'El contenido es requerido'),
  sort_order: z.number().int().optional(),
  card_refs: z
    .array(
      z.object({
        card_id: z.string().uuid(),
        role_label: z.string().nullable().optional(),
      }),
    )
    .optional(),
});
export type CreateDeckStrategySection = z.infer<typeof createDeckStrategySectionSchema>;

export const updateDeckStrategySectionSchema = z.object({
  section_type: strategySectionTypeSchema.optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
  card_refs: z
    .array(
      z.object({
        card_id: z.string().uuid(),
        role_label: z.string().nullable().optional(),
      }),
    )
    .optional(),
});
export type UpdateDeckStrategySection = z.infer<typeof updateDeckStrategySectionSchema>;

// ============================================================================
// Deck Strategy Card Ref
// ============================================================================

export const deckStrategyCardRefSchema = z.object({
  ref_id: z.string().uuid(),
  section_id: z.string().uuid(),
  card_id: z.string().uuid(),
  role_label: z.string().nullable(),
});
export type DeckStrategyCardRef = z.infer<typeof deckStrategyCardRefSchema>;
