import type { DeckExportData } from './txt-formatter.js';

/**
 * Format deck as CSV (structured data)
 * Columns: Qty, Card Name, Edition, Edition Code, Type, Type Code, Cost, Race, Unique, Has Ability, Ability Text, Tags, Starting Gold, Legal Status
 */
export function formatDeckAsCsv(data: DeckExportData): string {
  const lines: string[] = [];

  lines.push(
    'Qty,Card Name,Edition,Edition Code,Type,Type Code,Cost,Race,Unique,Has Ability,Ability Text,Tags,Starting Gold,Legal Status',
  );

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

  for (const card of sortedCards) {
    const qty = card.qty;
    const name = escapeCsvField(card.card_name);
    const edition = escapeCsvField(card.edition_name);
    const editionCode = escapeCsvField(card.edition_code ?? '');
    const type = escapeCsvField(card.card_type_name);
    const typeCode = escapeCsvField(card.card_type_code ?? '');
    const cost = card.cost !== null ? String(card.cost) : '';
    const race = escapeCsvField(card.race_name ?? '');
    const unique = card.is_unique ? 'Si' : 'No';
    const hasAbility = card.has_ability ? 'Si' : 'No';
    const abilityText = escapeCsvField((card.ability_text ?? '').trim());
    const tags = escapeCsvField(card.tags.join(';'));
    const startingGold = card.is_starting_gold ? 'Si' : 'No';
    const legalStatus = escapeCsvField(card.legal_status ?? '');

    lines.push(
      `${qty},${name},${edition},${editionCode},${type},${typeCode},${cost},${race},${unique},${hasAbility},${abilityText},${tags},${startingGold},${legalStatus}`,
    );
  }

  return lines.join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
