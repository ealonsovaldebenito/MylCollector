import { z } from 'zod';

// ============================================================================
// Card CSV schemas — import/export validation
// Doc reference: 00_GLOSSARY_AND_IDS.md (canon de export)
// ============================================================================

const booleanPreprocess = z.preprocess(
  (v) => v === 'true' || v === '1' || v === true || v === 'TRUE' || v === 'si' || v === 'SI',
  z.boolean(),
);

export const cardCsvRowSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  card_type_code: z.string().min(1, 'Tipo es requerido'),
  race_code: z.string().optional(),
  cost: z.coerce.number().int().min(0).optional(),
  ally_strength: z.coerce.number().int().positive().optional(),
  is_unique: booleanPreprocess.default(false),
  has_ability: booleanPreprocess.default(false),
  can_be_starting_gold: booleanPreprocess.default(false),
  text: z.string().optional(),
  flavor_text: z.string().optional(),
  tags: z.string().optional(), // comma-separated tag slugs
  // Printing fields (optional — for import with printing data)
  edition_code: z.string().optional(),
  rarity_code: z.string().optional(),
  collector_number: z.string().optional(),
  illustrator: z.string().optional(),
  legal_status: z.string().optional(),
});

export type CardCsvRow = z.infer<typeof cardCsvRowSchema>;

export const csvImportErrorSchema = z.object({
  row: z.number(),
  field: z.string().optional(),
  message: z.string(),
});

export const csvImportResultSchema = z.object({
  total_rows: z.number(),
  created: z.number(),
  skipped: z.number(),
  errors: z.array(csvImportErrorSchema),
});

export type CsvImportError = z.infer<typeof csvImportErrorSchema>;
export type CsvImportResult = z.infer<typeof csvImportResultSchema>;

/** CSV headers for card export */
export const CARD_CSV_HEADERS = [
  'name',
  'card_type_code',
  'race_code',
  'cost',
  'ally_strength',
  'is_unique',
  'has_ability',
  'can_be_starting_gold',
  'text',
  'flavor_text',
  'tags',
  'edition_code',
  'rarity_code',
  'collector_number',
  'illustrator',
  'legal_status',
] as const;
