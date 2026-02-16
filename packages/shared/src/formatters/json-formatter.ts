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
    card_name: string;
    edition_name: string;
    card_type_name: string;
    cost: number | null;
    is_starting_gold: boolean;
  }>;
  exported_at: string;
}

/**
 * Format deck as JSON (full data structure)
 * Includes validation, stats, and full card list
 */
export function formatDeckAsJson(data: DeckExportData): string {
  const exportData: DeckJsonExport = {
    version: '1.0',
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
      card_name: c.card_name,
      edition_name: c.edition_name,
      card_type_name: c.card_type_name,
      cost: c.cost,
      is_starting_gold: c.is_starting_gold,
    })),
    exported_at: data.exported_at.toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
}
