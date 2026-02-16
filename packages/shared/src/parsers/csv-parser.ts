import type { ParsedDeckLine } from './txt-parser.js';

/**
 * Result of parsing CSV deck import
 */
export interface CsvParseResult {
  lines: ParsedDeckLine[];
  errors: Array<{
    line_number: number;
    error: string;
  }>;
}

/**
 * Parse CSV deck format
 * Expected columns: Qty, Card Name, Edition, Type, Cost, Starting Gold, Legal Status
 * First row is header (skipped)
 *
 * Example:
 *   Qty,Card Name,Edition,Type,Cost,Starting Gold,Legal Status
 *   1,Oro Básico,Mundo Gótico,ORO,,Sí,STANDARD
 *   3,Sombra Nocturna,Mundo Gótico,ALIADO,2,No,STANDARD
 */
export function parseCsvDeck(payload: string): CsvParseResult {
  const lines: ParsedDeckLine[] = [];
  const errors: Array<{ line_number: number; error: string }> = [];

  const rawLines = payload.split('\n');

  // Skip header row
  for (let i = 1; i < rawLines.length; i++) {
    const lineNumber = i + 1; // Account for header
    const rawLine = rawLines[i]!.trim();

    // Skip empty lines
    if (!rawLine) {
      continue;
    }

    try {
      const parsed = parseCsvLine(rawLine, lineNumber);
      lines.push(parsed);
    } catch (error) {
      errors.push({
        line_number: lineNumber,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return { lines, errors };
}

/**
 * Parse a single CSV line
 * Columns: Qty, Card Name, Edition, Type, Cost, Starting Gold, Legal Status
 */
function parseCsvLine(line: string, lineNumber: number): ParsedDeckLine {
  const fields = parseCsvFields(line);

  if (fields.length < 6) {
    throw new Error(`Formato inválido: se esperan al menos 6 columnas`);
  }

  const [qtyStr, cardName, editionHint, , , startingGoldStr] = fields;

  const qty = parseInt(qtyStr!, 10);
  if (isNaN(qty) || qty <= 0) {
    throw new Error(`Cantidad inválida: ${qtyStr}`);
  }

  if (!cardName || cardName.trim().length === 0) {
    throw new Error('Nombre de carta vacío');
  }

  const isStartingGold = startingGoldStr?.toLowerCase() === 'sí' || startingGoldStr?.toLowerCase() === 'si';

  return {
    line_number: lineNumber,
    original_line: line,
    qty,
    card_name: cardName.trim(),
    edition_hint: editionHint && editionHint.trim().length > 0 ? editionHint.trim() : null,
    is_starting_gold: isStartingGold,
  };
}

/**
 * Parse CSV fields respecting quoted fields
 */
function parseCsvFields(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    const nextChar = i + 1 < line.length ? line[i + 1] : null;

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push last field
  fields.push(currentField);

  return fields;
}
