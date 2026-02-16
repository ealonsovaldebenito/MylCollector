import { z } from 'zod';

/**
 * Export format types
 */
export const exportFormatSchema = z.enum(['txt', 'csv', 'json', 'pdf']);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

/**
 * Export request
 */
export const exportRequestSchema = z.object({
  format: exportFormatSchema,
});
export type ExportRequest = z.infer<typeof exportRequestSchema>;

/**
 * Import format types (currently supports txt and csv)
 */
export const importFormatSchema = z.enum(['txt', 'csv']);
export type ImportFormat = z.infer<typeof importFormatSchema>;

/**
 * Import request
 */
export const importRequestSchema = z.object({
  format: importFormatSchema,
  payload: z.string().min(1, 'El payload no puede estar vacío'),
});
export type ImportRequest = z.infer<typeof importRequestSchema>;

/**
 * Resolved card from import (no ambiguity)
 */
export const importResolvedCardSchema = z.object({
  card_printing_id: z.string().uuid(),
  qty: z.number().int().positive(),
  is_starting_gold: z.boolean().default(false),
  line_number: z.number().int().positive(),
});
export type ImportResolvedCard = z.infer<typeof importResolvedCardSchema>;

/**
 * Ambiguous card option (multiple printings match)
 */
export const importCardOptionSchema = z.object({
  card_printing_id: z.string().uuid(),
  card_name: z.string(),
  edition_name: z.string(),
  edition_code: z.string(),
  rarity_tier_name: z.string().nullable(),
  image_url: z.string().nullable(),
  legal_status: z.enum(['STANDARD', 'DISCONTINUED']),
});
export type ImportCardOption = z.infer<typeof importCardOptionSchema>;

/**
 * Ambiguous line (multiple options to choose from)
 */
export const importAmbiguousLineSchema = z.object({
  line_number: z.number().int().positive(),
  original_line: z.string(),
  qty: z.number().int().positive(),
  card_name: z.string(),
  edition_hint: z.string().nullable(),
  options: z.array(importCardOptionSchema).min(1),
});
export type ImportAmbiguousLine = z.infer<typeof importAmbiguousLineSchema>;

/**
 * Import result - RESOLVED (success)
 */
export const importResolvedResultSchema = z.object({
  status: z.literal('RESOLVED'),
  deck_version_id: z.string().uuid(),
  imported_count: z.number().int().nonnegative(),
});
export type ImportResolvedResult = z.infer<typeof importResolvedResultSchema>;

/**
 * Import result - AMBIGUOUS (needs user resolution)
 */
export const importAmbiguousResultSchema = z.object({
  status: z.literal('AMBIGUOUS'),
  resolved_cards: z.array(importResolvedCardSchema),
  ambiguous_lines: z.array(importAmbiguousLineSchema).min(1),
});
export type ImportAmbiguousResult = z.infer<typeof importAmbiguousResultSchema>;

/**
 * Import result union
 */
export const importResultSchema = z.discriminatedUnion('status', [
  importResolvedResultSchema,
  importAmbiguousResultSchema,
]);
export type ImportResult = z.infer<typeof importResultSchema>;

/**
 * Import resolution (after user selects from ambiguous options)
 */
export const importResolutionSchema = z.object({
  resolved_cards: z.array(importResolvedCardSchema),
  selections: z.array(
    z.object({
      line_number: z.number().int().positive(),
      card_printing_id: z.string().uuid(),
    }),
  ),
});
export type ImportResolution = z.infer<typeof importResolutionSchema>;
