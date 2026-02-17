import { z } from 'zod';

// ============================================================================
// Validation schemas — messages, results, computed stats
// Doc reference: 04_DECK_VALIDATION_ENGINE.md
// ============================================================================

export const validationSeveritySchema = z.enum(['BLOCK', 'WARN', 'INFO']);

export const validationMessageSchema = z.object({
  rule_id: z.string(),
  rule_version: z.number().int().default(1),
  severity: validationSeveritySchema,
  message: z.string(),
  hint: z.string().nullable().optional(),
  entity_ref: z.object({
    card_id: z.string().uuid().optional(),
    card_printing_id: z.string().uuid().optional(),
    edition_id: z.string().uuid().optional(),
    block_id: z.string().uuid().optional(),
  }).nullable().optional(),
  context_json: z.record(z.unknown()).default({}),
});

export const deckComputedStatsSchema = z.object({
  total_cards: z.number().int(),

  // Curva de coste (excluye cartas de tipo Oro)
  cost_histogram: z.record(z.number().int()),

  // Curva de oro (usa el campo cost como "valor de oro" si existe)
  gold_histogram: z.record(z.number().int()).optional(),

  // Promedios ponderados por cantidad
  avg_cost: z.number().nullable().optional(),
  avg_gold_value: z.number().nullable().optional(),
  avg_cost_by_type: z
    .record(
      z.object({
        qty: z.number().int(),
        costed_qty: z.number().int(),
        avg: z.number().nullable(),
      }),
    )
    .optional(),

  type_distribution: z.record(z.number().int()),

  // Nota: razas solo aplican a Aliados
  race_distribution: z.record(z.number().int()),
  rarity_distribution: z.record(z.number().int()),
});

export const validationResultSchema = z.object({
  is_valid: z.boolean(),
  messages: z.array(validationMessageSchema),
  computed_stats: deckComputedStatsSchema,
  timing: z.object({
    duration_ms: z.number(),
  }),
});

// Inferred types
export type ValidationSeverity = z.infer<typeof validationSeveritySchema>;
export type ValidationMessage = z.infer<typeof validationMessageSchema>;
export type DeckComputedStats = z.infer<typeof deckComputedStatsSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
