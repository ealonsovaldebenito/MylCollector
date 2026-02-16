import type { SupabaseClient as Client } from '@supabase/supabase-js';
import {
  formatDeckAsTxt,
  formatDeckAsCsv,
  formatDeckAsJson,
  parseTxtDeck,
  parseCsvDeck,
  type DeckExportData,
  type DeckExportCard,
  type ExportFormat,
  type ImportFormat,
  type ImportResult,
  type ImportCardOption,
  type ImportAmbiguousLine,
} from '@myl/shared';
import { getDeckVersion } from './decks.service';
import { getLatestValidation } from './validation.service';

/**
 * Get deck version data formatted for export
 */
export async function getDeckExportData(
  supabase: Client,
  versionId: string,
): Promise<DeckExportData> {
  const version = await getDeckVersion(supabase, versionId);
  const validation = await getLatestValidation(supabase, versionId);

  // Get deck info
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('deck_id, name, format_id, format:formats(format_id, name)')
    .eq('deck_id', version.deck_id)
    .single();

  if (deckError || !deck) {
    throw new Error('Deck not found');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards: DeckExportCard[] = (version.cards as any[]).map((c: any) => ({
    qty: c.qty,
    card_name: c.card_printing.card.name,
    edition_name: c.card_printing.edition.name,
    is_starting_gold: c.is_starting_gold,
    card_type_name: c.card_printing.card.card_type.name,
    cost: c.card_printing.card.cost,
  }));

  return {
    deck_name: deck.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format_name: (deck.format as any)?.name ?? 'Sin formato',
    total_cards: cards.reduce((sum, c) => sum + c.qty, 0),
    validation: validation,
    cards,
    exported_at: new Date(),
  };
}

/**
 * Export deck version to specified format
 */
export async function exportDeckVersion(
  supabase: Client,
  versionId: string,
  format: ExportFormat,
): Promise<{ content: string; mimeType: string; filename: string }> {
  const data = await getDeckExportData(supabase, versionId);

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'txt':
      content = formatDeckAsTxt(data);
      mimeType = 'text/plain; charset=utf-8';
      extension = 'txt';
      break;

    case 'csv':
      content = formatDeckAsCsv(data);
      mimeType = 'text/csv; charset=utf-8';
      extension = 'csv';
      break;

    case 'json':
      content = formatDeckAsJson(data);
      mimeType = 'application/json; charset=utf-8';
      extension = 'json';
      break;

    case 'pdf':
      // TODO: Implement PDF export
      throw new Error('Exportación a PDF no implementada aún');

    default:
      throw new Error(`Formato de exportación desconocido: ${format}`);
  }

  const filename = `${sanitizeFilename(data.deck_name)}.${extension}`;

  return { content, mimeType, filename };
}

/**
 * Import deck from payload
 */
export async function importDeck(
  supabase: Client,
  payload: string,
  format: ImportFormat,
): Promise<ImportResult> {
  // Parse the payload
  const parseResult = format === 'txt' ? parseTxtDeck(payload) : parseCsvDeck(payload);

  if (parseResult.errors.length > 0) {
    throw new Error(
      `Errores de parseo:\n${parseResult.errors.map((e) => `Línea ${e.line_number}: ${e.error}`).join('\n')}`,
    );
  }

  if (parseResult.lines.length === 0) {
    throw new Error('No se encontraron cartas válidas en el archivo');
  }

  // Resolve each line to card printings
  const resolvedCards: Array<{
    card_printing_id: string;
    qty: number;
    is_starting_gold: boolean;
    line_number: number;
  }> = [];

  const ambiguousLines: ImportAmbiguousLine[] = [];

  for (const line of parseResult.lines) {
    const options = await findCardPrintingOptions(supabase, line.card_name, line.edition_hint);

    if (options.length === 0) {
      throw new Error(
        `Línea ${line.line_number}: No se encontró ninguna carta con el nombre "${line.card_name}"${line.edition_hint ? ` en la edición "${line.edition_hint}"` : ''}`,
      );
    }

    if (options.length === 1) {
      // Resolved - only one option
      resolvedCards.push({
        card_printing_id: options[0]!.card_printing_id,
        qty: line.qty,
        is_starting_gold: line.is_starting_gold,
        line_number: line.line_number,
      });
    } else {
      // Ambiguous - multiple options
      ambiguousLines.push({
        line_number: line.line_number,
        original_line: line.original_line,
        qty: line.qty,
        card_name: line.card_name,
        edition_hint: line.edition_hint,
        options,
      });
    }
  }

  if (ambiguousLines.length > 0) {
    return {
      status: 'AMBIGUOUS',
      resolved_cards: resolvedCards,
      ambiguous_lines: ambiguousLines,
    };
  }

  // Return resolved cards for the API route to use
  return {
    status: 'RESOLVED',
    deck_version_id: '', // Will be filled by the API route after creating the version
    imported_count: resolvedCards.length,
    resolved_cards: resolvedCards,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any; // Type cast needed since the schema doesn't include resolved_cards in RESOLVED
}

/**
 * Find card printing options for a given card name and optional edition hint
 */
async function findCardPrintingOptions(
  supabase: Client,
  cardName: string,
  editionHint: string | null,
): Promise<ImportCardOption[]> {
  let query = supabase
    .from('card_printings')
    .select(
      `
      card_printing_id,
      image_url,
      legal_status,
      card:cards!inner (
        card_id,
        name
      ),
      edition:editions!inner (
        edition_id,
        name,
        code
      ),
      rarity_tier:rarity_tiers (
        rarity_tier_id,
        name,
        code
      )
    `,
    )
    .eq('cards.name', cardName);

  if (editionHint) {
    // Try to match edition by name or code
    query = query.or(`name.eq.${editionHint},code.eq.${editionHint}`, { foreignTable: 'editions' });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Map to ImportCardOption
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((p) => ({
    card_printing_id: p.card_printing_id,
    card_name: p.card.name,
    edition_name: p.edition.name,
    edition_code: p.edition.code,
    rarity_tier_name: p.rarity_tier?.name ?? null,
    image_url: p.image_url,
    legal_status: p.legal_status,
  }));
}

/**
 * Sanitize filename for export
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Audit log an export operation
 */
export async function auditExport(
  supabase: Client,
  userId: string,
  versionId: string,
  format: ExportFormat,
  requestId: string,
): Promise<void> {
  await supabase.from('audit_log').insert({
    user_id: userId,
    action: 'DECK_EXPORT',
    entity_type: 'deck_version',
    entity_id: versionId,
    metadata: { format, request_id: requestId },
  });
}

/**
 * Audit log an import operation
 */
export async function auditImport(
  supabase: Client,
  userId: string,
  deckId: string,
  versionId: string | null,
  format: ImportFormat,
  importedCount: number,
  requestId: string,
): Promise<void> {
  await supabase.from('audit_log').insert({
    user_id: userId,
    action: 'DECK_IMPORT',
    entity_type: 'deck',
    entity_id: deckId,
    metadata: { format, version_id: versionId, imported_count: importedCount, request_id: requestId },
  });
}
