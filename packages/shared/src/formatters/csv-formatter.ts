import type { DeckExportData } from './txt-formatter.js';

/**
 * Format deck as CSV (structured data)
 * Columns: Qty, Card Name, Edition, Type, Cost, Starting Gold, Legal Status
 */
export function formatDeckAsCsv(data: DeckExportData): string {
  const lines: string[] = [];

  // Header row
  lines.push('Qty,Card Name,Edition,Type,Cost,Starting Gold,Legal Status');

  // Sort cards by type, then by cost, then by name
  const sortedCards = [...data.cards].sort((a, b) => {
    if (a.card_type_name !== b.card_type_name) {
      return a.card_type_name.localeCompare(b.card_type_name);
    }
    if (a.cost !== null && b.cost !== null) {
      if (a.cost !== b.cost) return a.cost - b.cost;
    } else if (a.cost === null && b.cost !== null) {
      return 1;
    } else if (a.cost !== null && b.cost === null) {
      return -1;
    }
    return a.card_name.localeCompare(b.card_name);
  });

  // Data rows
  for (const card of sortedCards) {
    const qty = card.qty;
    const name = escapeCsvField(card.card_name);
    const edition = escapeCsvField(card.edition_name);
    const type = escapeCsvField(card.card_type_name);
    const cost = card.cost !== null ? card.cost : '';
    const startingGold = card.is_starting_gold ? 'Sí' : 'No';
    const legalStatus = 'STANDARD'; // We'll need to add this to DeckExportCard if needed

    lines.push(`${qty},${name},${edition},${type},${cost},${startingGold},${legalStatus}`);
  }

  return lines.join('\n');
}

/**
 * Escape CSV field (quote if contains comma, quote, or newline)
 */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
