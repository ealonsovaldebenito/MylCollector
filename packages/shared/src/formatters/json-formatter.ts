import type { DeckExportData } from './txt-formatter.js';

export interface DeckJsonExport {
  version: string;
  deck_name: string;
  format_name: string;
  total_cards: number;
  is_valid: boolean | null;
  validation_messages: Array<{
    severity: string;
    message: string;
    hint?: string;
  }> | null;
  computed_stats: {
    total_cards: number;
    cost_histogram: Record<string, number>;
    type_distribution: Record<string, number>;
    race_distribution: Record<string, number>;
    rarity_distribution: Record<string, number>;
  } | null;
  cards: Array<{
    qty: number;
    card_id: string;
    card_printing_id: string;
    card_name: string;
    edition_name: string;
    edition_code: string | null;
    card_type_name: string;
    card_type_code: string | null;
    cost: number | null;
    race_name: string | null;
    has_ability: boolean;
    ability_text: string | null;
    is_unique: boolean;
    tags: string[];
    is_starting_gold: boolean;
    legal_status: string | null;
  }>;
  exported_at: string;
}

/**
 * Format deck as JSON (full data structure)
 * Includes validation, stats, and full card list
 */
export function formatDeckAsJson(data: DeckExportData): string {
  const exportData: DeckJsonExport = {
    version: '1.1',
    deck_name: data.deck_name,
    format_name: data.format_name,
    total_cards: data.total_cards,
    is_valid: data.validation?.is_valid ?? null,
    validation_messages: data.validation
      ? data.validation.messages.map((m) => ({
          severity: m.severity,
          message: m.message,
          hint: m.hint || undefined,
        }))
      : null,
    computed_stats: data.validation?.computed_stats || null,
    cards: data.cards.map((c) => ({
      qty: c.qty,
      card_id: c.card_id,
      card_printing_id: c.card_printing_id,
      card_name: c.card_name,
      edition_name: c.edition_name,
      edition_code: c.edition_code,
      card_type_name: c.card_type_name,
      card_type_code: c.card_type_code,
      cost: c.cost,
      race_name: c.race_name,
      has_ability: c.has_ability,
      ability_text: c.ability_text ?? null,
      is_unique: c.is_unique,
      tags: c.tags,
      is_starting_gold: c.is_starting_gold,
      legal_status: c.legal_status,
    })),
    exported_at: data.exported_at.toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
}
