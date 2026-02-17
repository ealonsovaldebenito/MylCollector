import type { ValidationResult } from '../schemas/validation.js';

export interface DeckExportCard {
  qty: number;
  card_id: string;
  card_printing_id: string;
  card_name: string;
  edition_name: string;
  edition_code: string | null;
  rarity_tier_name: string | null;
  legal_status: string | null;
  is_starting_gold: boolean;
  card_type_name: string;
  card_type_code: string | null;
  cost: number | null;
  race_name: string | null;
  has_ability: boolean;
  ability_text: string | null;
  is_unique: boolean;
  tags: string[];
}

export interface DeckExportData {
  deck_name: string;
  format_name: string;
  total_cards: number;
  validation: ValidationResult | null;
  cards: DeckExportCard[];
  exported_at: Date;
}

/**
 * Format deck as TXT (plain text list)
 * Format: "Qx Card Name [Edition]" per line
 * Grouped by type, includes validation status
 */
export function formatDeckAsTxt(data: DeckExportData): string {
  const lines: string[] = [];

  // Header
  lines.push(`=== ${data.deck_name} ===`);
  lines.push(`Formato: ${data.format_name}`);
  lines.push(`Cartas: ${data.total_cards}`);

  // Validation status
  if (data.validation) {
    const status = data.validation.is_valid ? 'VÁLIDO ✓' : 'INVÁLIDO ✗';
    lines.push(`Estado: ${status}`);

    if (!data.validation.is_valid) {
      lines.push('');
      lines.push('ERRORES DE VALIDACIÓN:');
      data.validation.messages
        .filter((m) => m.severity === 'BLOCK')
        .forEach((m) => {
          lines.push(`  - ${m.message}`);
        });
    }

    const warnings = data.validation.messages.filter((m) => m.severity === 'WARN');
    if (warnings.length > 0) {
      lines.push('');
      lines.push('ADVERTENCIAS:');
      warnings.forEach((m) => {
        lines.push(`  - ${m.message}`);
      });
    }
  }

  lines.push('');
  lines.push(`Exportado: ${data.exported_at.toISOString()}`);
  lines.push('');
  lines.push('='.repeat(50));
  lines.push('');

  // Group cards by type
  const grouped = new Map<string, DeckExportCard[]>();
  for (const card of data.cards) {
    const type = card.card_type_name;
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(card);
  }

  // Sort groups by type name
  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Output each group
  for (const [typeName, cards] of sortedGroups) {
    lines.push(`${typeName}:`);

    // Sort cards by cost (null last), then by name
    const sortedCards = cards.sort((a, b) => {
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
      const goldMarker = card.is_starting_gold ? ' [ORO INICIAL]' : '';
      const costMarker = card.cost !== null ? ` C:${card.cost}` : '';
      const uniqueMarker = card.is_unique ? ' ÚNICA' : '';
      const abilityMarker = card.has_ability ? ' HABILIDAD' : '';
      const raceMarker = card.race_name ? ` · ${card.race_name}` : '';
      const tagsMarker = card.tags.length > 0 ? ` {${card.tags.slice(0, 6).join(', ')}}` : '';
      lines.push(
        `  ${card.qty}x ${card.card_name} [${card.edition_name}]${costMarker}${raceMarker}${uniqueMarker}${abilityMarker}${goldMarker}${tagsMarker}`,
      );

      const abilityText = (card.ability_text ?? '').trim();
      if (abilityText) {
        const normalized = abilityText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const abilityLines = normalized
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        if (abilityLines.length > 0) {
          lines.push(`  - Habilidad:`);
          for (const l of abilityLines) lines.push(`    - ${l}`);
        }
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}
