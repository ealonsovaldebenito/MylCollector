/**
 * Parsed line from TXT import
 */
export interface ParsedDeckLine {
  line_number: number;
  original_line: string;
  qty: number;
  card_name: string;
  edition_hint: string | null;
  is_starting_gold: boolean;
}

/**
 * Result of parsing TXT deck import
 */
export interface TxtParseResult {
  lines: ParsedDeckLine[];
  errors: Array<{
    line_number: number;
    error: string;
  }>;
}

/**
 * Parse TXT deck format
 * Expected format per line: "Qx Card Name [Edition]" or "Qx Card Name [Edition] ⭐"
 * Lines starting with = or empty lines are ignored
 *
 * Examples:
 *   "1x Oro Básico [Mundo Gótico]"
 *   "3x Sombra Nocturna [Mundo Gótico] ⭐"
 *   "2x Espada de Fuego"
 */
export function parseTxtDeck(payload: string): TxtParseResult {
  const lines: ParsedDeckLine[] = [];
  const errors: Array<{ line_number: number; error: string }> = [];

  const rawLines = payload.split('\n');

  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    const rawLine = rawLines[i]!.trim();

    // Skip empty lines, header lines, section markers
    if (
      !rawLine ||
      rawLine.startsWith('=') ||
      rawLine.startsWith('#') ||
      rawLine.endsWith(':') ||
      rawLine.startsWith('Formato:') ||
      rawLine.startsWith('Cartas:') ||
      rawLine.startsWith('Estado:') ||
      rawLine.startsWith('Exportado:') ||
      rawLine.startsWith('ERRORES') ||
      rawLine.startsWith('ADVERTENCIAS') ||
      rawLine.startsWith('-') ||
      rawLine.startsWith('  -')
    ) {
      continue;
    }

    try {
      const parsed = parseDeckLine(rawLine, lineNumber);
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
 * Parse a single deck line
 * Format: "Qx Card Name [Edition] ⭐?"
 */
function parseDeckLine(line: string, lineNumber: number): ParsedDeckLine {
  // Check for starting gold marker
  const isStartingGold = line.includes('⭐');
  const cleanLine = line.replace('⭐', '').trim();

  // Match pattern: "Qx Card Name [Edition]" or "Qx Card Name"
  const match = cleanLine.match(/^(\d+)x\s+(.+?)(?:\s+\[([^\]]+)\])?$/);

  if (!match) {
    throw new Error(`Formato inválido: debe ser "Qx Nombre [Edición]"`);
  }

  const [, qtyStr, cardName, editionHint] = match;

  const qty = parseInt(qtyStr!, 10);
  if (isNaN(qty) || qty <= 0) {
    throw new Error(`Cantidad inválida: ${qtyStr}`);
  }

  if (!cardName || cardName.trim().length === 0) {
    throw new Error('Nombre de carta vacío');
  }

  return {
    line_number: lineNumber,
    original_line: line,
    qty,
    card_name: cardName.trim(),
    edition_hint: editionHint?.trim() || null,
    is_starting_gold: isStartingGold,
  };
}
