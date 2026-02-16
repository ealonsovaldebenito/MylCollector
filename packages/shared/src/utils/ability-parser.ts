/**
 * Parses card ability text into structured sections.
 * Recognizes ability type labels: ACTIVADA, PASIVA, ESPECIAL, CONTINUA.
 * Doc reference: 08_UX_UI_SYSTEM — card detail ability formatting.
 */

export type AbilityType = 'ACTIVADA' | 'PASIVA' | 'ESPECIAL' | 'CONTINUA' | 'GENERICA';

export interface AbilitySection {
  type: AbilityType;
  text: string;
}

const ABILITY_PATTERN = /\b(ACTIVADA|PASIVA|ESPECIAL|CONTINUA)\b[:\s]*/gi;

const ABILITY_TYPE_MAP: Record<string, AbilityType> = {
  ACTIVADA: 'ACTIVADA',
  PASIVA: 'PASIVA',
  ESPECIAL: 'ESPECIAL',
  CONTINUA: 'CONTINUA',
};

export function parseAbilityText(text: string): AbilitySection[] {
  if (!text || !text.trim()) return [];

  const sections: AbilitySection[] = [];
  const matches = [...text.matchAll(ABILITY_PATTERN)];

  if (matches.length === 0) {
    return [{ type: 'GENERICA', text: text.trim() }];
  }

  // Text before first match
  const firstMatch = matches[0]!;
  const beforeFirst = text.slice(0, firstMatch.index).trim();
  if (beforeFirst) {
    sections.push({ type: 'GENERICA', text: beforeFirst });
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const type = ABILITY_TYPE_MAP[match[1]!.toUpperCase()] ?? 'GENERICA';
    const startAfterLabel = (match.index ?? 0) + match[0]!.length;
    const nextMatch = matches[i + 1];
    const endOfSection = nextMatch ? nextMatch.index : text.length;
    const sectionText = text.slice(startAfterLabel, endOfSection).trim();

    if (sectionText) {
      sections.push({ type, text: sectionText });
    }
  }

  return sections;
}

/** Color mapping for ability types — used in UI rendering */
export const ABILITY_TYPE_COLORS: Record<AbilityType, string> = {
  ACTIVADA: 'text-red-600 dark:text-red-400',
  PASIVA: 'text-blue-600 dark:text-blue-400',
  ESPECIAL: 'text-purple-600 dark:text-purple-400',
  CONTINUA: 'text-green-600 dark:text-green-400',
  GENERICA: 'text-foreground',
};
