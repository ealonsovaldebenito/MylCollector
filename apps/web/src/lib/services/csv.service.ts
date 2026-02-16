import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { CardFilters, CsvImportResult, CsvImportError } from '@myl/shared';
import { cardCsvRowSchema, CARD_CSV_HEADERS } from '@myl/shared';

type Client = SupabaseClient<Database>;

// ============================================================================
// CSV parsing / generation (RFC 4180 compliant)
// ============================================================================

/**
 * Parse CSV content into rows of key-value records.
 * Handles quoted fields, embedded commas, and newlines within quotes.
 */
export function parseCSV(content: string): Array<Record<string, string>> {
  const lines = splitCSVLines(content);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]!).map((h) => h.trim().toLowerCase());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function splitCSVLines(content: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

/**
 * Generate CSV string from headers and rows.
 */
export function generateCSV(headers: readonly string[], rows: string[][]): string {
  const escapeField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const headerLine = headers.map(escapeField).join(',');
  const dataLines = rows.map((row) => row.map(escapeField).join(','));
  return [headerLine, ...dataLines].join('\n');
}

// ============================================================================
// Export cards to CSV
// ============================================================================

export async function exportCardsToCSV(
  supabase: Client,
  filters: Partial<CardFilters>,
): Promise<string> {
  // Fetch all card printings (no limit for export)
  let query = supabase
    .from('card_printings')
    .select(
      `
      card_printing_id,
      edition_id,
      rarity_tier_id,
      collector_number,
      illustrator,
      legal_status,
      edition:editions!inner(code),
      rarity_tier:rarity_tiers(code),
      card:cards!inner(
        card_id,
        name,
        cost,
        ally_strength,
        is_unique,
        has_ability,
        can_be_starting_gold,
        text,
        flavor_text,
        card_type:card_types!inner(code),
        race:races(code)
      )
    `,
    )
    .order('card_printing_id')
    .limit(10000);

  if (filters.q) {
    query = query.ilike('card.name' as string, `%${filters.q}%`);
  }
  if (filters.card_type_id) {
    query = query.eq('card.card_type_id' as string, filters.card_type_id);
  }
  if (filters.race_id) {
    query = query.eq('card.race_id' as string, filters.race_id);
  }
  if (filters.block_id) {
    query = query.eq('edition.block_id' as string, filters.block_id);
  }
  if (filters.edition_id) {
    query = query.eq('edition_id', filters.edition_id);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Fetch tags for all cards
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data ?? []) as any[];
  const cardIds = [...new Set(items.map((i) => i.card.card_id as string))];

  const tagsMap = new Map<string, string[]>();
  if (cardIds.length > 0) {
    const { data: cardTags } = await supabase
      .from('card_tags')
      .select('card_id, tag:tags!inner(slug)')
      .in('card_id', cardIds);

    if (cardTags) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const ct of cardTags as any[]) {
        const cid = ct.card_id as string;
        const slug = ct.tag.slug as string;
        if (!tagsMap.has(cid)) tagsMap.set(cid, []);
        tagsMap.get(cid)!.push(slug);
      }
    }
  }

  const rows = items.map((item) => [
    item.card.name ?? '',
    item.card.card_type?.code ?? '',
    item.card.race?.code ?? '',
    String(item.card.cost ?? ''),
    String(item.card.ally_strength ?? ''),
    item.card.is_unique ? 'true' : 'false',
    item.card.has_ability ? 'true' : 'false',
    item.card.can_be_starting_gold ? 'true' : 'false',
    item.card.text ?? '',
    item.card.flavor_text ?? '',
    (tagsMap.get(item.card.card_id as string) ?? []).join(','),
    item.edition?.code ?? '',
    item.rarity_tier?.code ?? '',
    item.collector_number ?? '',
    item.illustrator ?? '',
    item.legal_status ?? 'LEGAL',
  ]);

  return generateCSV(CARD_CSV_HEADERS, rows);
}

// ============================================================================
// Import cards from CSV
// ============================================================================

interface CatalogMaps {
  cardTypesByCode: Map<string, string>; // code -> id
  racesByCode: Map<string, string>; // code -> id
  editionsByCode: Map<string, string>; // code -> id
  raritiesByCode: Map<string, string>; // code -> id
  tagsBySlug: Map<string, string>; // slug -> id
}

async function buildCatalogMaps(supabase: Client): Promise<CatalogMaps> {
  const [ctRes, rRes, eRes, rtRes, tRes] = await Promise.all([
    supabase.from('card_types').select('card_type_id, code'),
    supabase.from('races').select('race_id, code'),
    supabase.from('editions').select('edition_id, code'),
    supabase.from('rarity_tiers').select('rarity_tier_id, code'),
    supabase.from('tags').select('tag_id, slug'),
  ]);

  const mapFrom = <T extends Record<string, unknown>>(
    data: T[] | null,
    keyField: string,
    valueField: string,
  ) => {
    const m = new Map<string, string>();
    for (const row of data ?? []) {
      m.set(String(row[keyField]), String(row[valueField]));
    }
    return m;
  };

  return {
    cardTypesByCode: mapFrom(ctRes.data, 'code', 'card_type_id'),
    racesByCode: mapFrom(rRes.data, 'code', 'race_id'),
    editionsByCode: mapFrom(eRes.data, 'code', 'edition_id'),
    raritiesByCode: mapFrom(rtRes.data, 'code', 'rarity_tier_id'),
    tagsBySlug: mapFrom(tRes.data, 'slug', 'tag_id'),
  };
}

function normalizeCardName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function importCardsFromCSV(
  supabase: Client,
  content: string,
): Promise<CsvImportResult> {
  const rows = parseCSV(content);
  const errors: CsvImportError[] = [];
  let created = 0;
  let skipped = 0;

  if (rows.length === 0) {
    return { total_rows: 0, created: 0, skipped: 0, errors: [] };
  }

  const maps = await buildCatalogMaps(supabase);

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +2 because row 1 is header, data starts at 2
    const raw = rows[i];

    // Validate row
    const parsed = cardCsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          row: rowNum,
          field: issue.path.join('.'),
          message: issue.message,
        });
      }
      skipped++;
      continue;
    }

    const row = parsed.data;

    // Resolve card_type_code -> card_type_id
    const cardTypeId = maps.cardTypesByCode.get(row.card_type_code.toUpperCase());
    if (!cardTypeId) {
      errors.push({
        row: rowNum,
        field: 'card_type_code',
        message: `Tipo desconocido: "${row.card_type_code}"`,
      });
      skipped++;
      continue;
    }

    // Resolve race_code -> race_id (optional)
    let raceId: string | undefined;
    if (row.race_code) {
      raceId = maps.racesByCode.get(row.race_code.toUpperCase());
      if (!raceId) {
        errors.push({
          row: rowNum,
          field: 'race_code',
          message: `Raza desconocida: "${row.race_code}"`,
        });
        skipped++;
        continue;
      }
    }

    // Create card
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert({
        name: row.name,
        name_normalized: normalizeCardName(row.name),
        card_type_id: cardTypeId,
        race_id: raceId ?? null,
        cost: row.cost ?? null,
        ally_strength: row.ally_strength ?? null,
        is_unique: row.is_unique,
        has_ability: row.has_ability,
        can_be_starting_gold: row.can_be_starting_gold,
        text: row.text ?? null,
        flavor_text: row.flavor_text ?? null,
      })
      .select('card_id')
      .single();

    if (cardError) {
      errors.push({
        row: rowNum,
        message: `Error al crear carta: ${cardError.message}`,
      });
      skipped++;
      continue;
    }

    // Insert tags
    if (row.tags) {
      const tagSlugs = row.tags.split(',').map((s) => s.trim()).filter(Boolean);
      const tagRows = tagSlugs
        .map((slug) => maps.tagsBySlug.get(slug))
        .filter((id): id is string => !!id)
        .map((tagId) => ({ card_id: card.card_id, tag_id: tagId }));

      if (tagRows.length > 0) {
        await supabase.from('card_tags').insert(tagRows);
      }
    }

    // Create printing if edition_code is provided
    if (row.edition_code) {
      const editionId = maps.editionsByCode.get(row.edition_code.toUpperCase());
      if (editionId) {
        const printingPayload = {
          card_id: card.card_id as string,
          edition_id: editionId,
          legal_status: (row.legal_status || 'LEGAL') as 'LEGAL' | 'RESTRICTED' | 'BANNED' | 'DISCONTINUED',
          printing_variant: 'standard',
          rarity_tier_id: null as string | null,
          collector_number: null as string | null,
          illustrator: null as string | null,
        };

        if (row.rarity_code) {
          const rarityId = maps.raritiesByCode.get(row.rarity_code.toUpperCase());
          if (rarityId) printingPayload.rarity_tier_id = rarityId;
        }
        if (row.collector_number) printingPayload.collector_number = row.collector_number;
        if (row.illustrator) printingPayload.illustrator = row.illustrator;

        const { error: printError } = await supabase.from('card_printings').insert(printingPayload);
        if (printError) {
          errors.push({
            row: rowNum,
            message: `Carta creada pero fallo la impresion: ${printError.message}`,
          });
        }
      } else {
        errors.push({
          row: rowNum,
          field: 'edition_code',
          message: `Edicion desconocida: "${row.edition_code}" (carta creada sin impresion)`,
        });
      }
    }

    created++;
  }

  return { total_rows: rows.length, created, skipped, errors };
}
