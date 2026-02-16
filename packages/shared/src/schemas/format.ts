import { z } from 'zod';

// ============================================================================
// Format schemas — game formats and rules
// Doc reference: 03_DATA_MODEL_SQL.md, 04_DECK_VALIDATION_ENGINE.md
// ============================================================================

export const formatParamsSchema = z.object({
  deck_size: z.number().int().positive().default(50),
  default_card_limit: z.number().int().positive().default(3),
  discontinued_severity: z.enum(['WARN', 'BLOCK']).default('WARN'),
});

export const formatSchema = z.object({
  format_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  params_json: formatParamsSchema.partial().default({}),
});

export const formatRuleSchema = z.object({
  format_rule_id: z.string().uuid(),
  format_id: z.string().uuid(),
  rule_id: z.string(),
  params_json: z.record(z.unknown()).default({}),
  is_active: z.boolean(),
});

// Inferred types
export type FormatParams = z.infer<typeof formatParamsSchema>;
export type Format = z.infer<typeof formatSchema>;
export type FormatRule = z.infer<typeof formatRuleSchema>;
