import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import { v7 as uuidv7 } from 'uuid';

type Client = SupabaseClient<Database>;

interface LegacyCard {
  id: number;
  nombre: string;
  tipo: string;
  coste_oro: number;
  imagen_url: string | null;
  habilidad_texto_descriptivo: string | null;
  descripcion: string | null;
  expansion: string;
  rareza: string;
  fecha_creacion: string | null;
  fuerza: number | null;
  raza: string | null;
  leyenda: string | null;
  danio: number | null;
  durabilidad: number | null;
  cantidad_generada: number | null;
  salud: number | null;
  habilidades: unknown[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

type ProgressCallback = (current: number, total: number, cardName: string) => void;

/**
 * Import legacy cards from JSON format
 */
export async function importLegacyCards(
  supabase: Client,
  cards: LegacyCard[],
  onProgress?: ProgressCallback,
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  // Fetch reference data
  const cardTypes = await fetchCardTypes(supabase);
  const races = await fetchRaces(supabase);
  const editions = await fetchEditions(supabase);
  const rarities = await fetchRarities(supabase);

  for (let i = 0; i < cards.length; i++) {
    const legacyCard = cards[i]!;

    // Report progress
    if (onProgress) {
      onProgress(i + 1, cards.length, legacyCard.nombre);
    }
    try {
      // Map card type
      const cardTypeId = mapCardType(legacyCard.tipo, cardTypes);
      if (!cardTypeId) {
        result.errors.push(`Card ${legacyCard.nombre}: Unknown card type "${legacyCard.tipo}"`);
        result.skipped++;
        continue;
      }

      // Map race (optional) — "Sin Raza" or empty means no race
      let raceId: string | null = null;
      const rawRaza = legacyCard.raza?.trim();
      if (rawRaza && rawRaza.toLowerCase() !== 'sin raza') {
        raceId = mapRace(rawRaza, races);
        if (!raceId) {
          result.errors.push(`Card ${legacyCard.nombre}: Unknown race "${rawRaza}"`);
        }
      }

      // Map edition
      const editionId = mapEdition(legacyCard.expansion, editions);
      if (!editionId) {
        result.errors.push(`Card ${legacyCard.nombre}: Unknown edition "${legacyCard.expansion}"`);
        result.skipped++;
        continue;
      }

      // Map rarity — dirty data defaults to Común
      const rawRareza = String(legacyCard.rareza ?? '').trim();
      let rarityId: string | null = null;
      const defaultRarityId = rarities[0]?.rarity_tier_id ?? null;

      if (!rawRareza || rawRareza === 'false' || rawRareza === 'true') {
        rarityId = defaultRarityId;
      } else {
        rarityId = mapRarity(rawRareza, rarities);
        if (!rarityId) {
          // Unknown rarity (Vasallo, Real, Cortesano, Rework, etc.) → default to Común
          rarityId = defaultRarityId;
        }
      }
      if (!rarityId) {
        result.errors.push(`Card ${legacyCard.nombre}: No default rarity available`);
        result.skipped++;
        continue;
      }

      // Check if card already exists
      const { data: existingCard } = await supabase
        .from('cards')
        .select('card_id')
        .eq('name', legacyCard.nombre)
        .single();

      if (existingCard) {
        result.skipped++;
        continue;
      }

      // Determine card properties
      const isUnique = legacyCard.habilidad_texto_descriptivo?.toLowerCase().includes('única') ?? false;
      const hasAbility = legacyCard.habilidad_texto_descriptivo !== null && legacyCard.habilidad_texto_descriptivo.length > 0;
      const canBeStartingGold = legacyCard.tipo === 'Oro' && !hasAbility;

      // ally_strength must be positive (>0) or null per DB constraint
      // ALIADO cards require ally_strength, so default to 1 if missing/zero
      const isAlly = legacyCard.tipo === 'Aliado';
      const allyStrength =
        legacyCard.fuerza && legacyCard.fuerza > 0
          ? legacyCard.fuerza
          : isAlly
            ? 1
            : null;

      // Create card
      const cardId = uuidv7();
      const { error: cardError } = await supabase.from('cards').insert({
        card_id: cardId,
        card_type_id: cardTypeId,
        race_id: raceId,
        name: legacyCard.nombre,
        name_normalized: normalizeName(legacyCard.nombre),
        cost: legacyCard.coste_oro,
        ally_strength: allyStrength,
        is_unique: isUnique,
        has_ability: hasAbility,
        can_be_starting_gold: canBeStartingGold,
        text: legacyCard.habilidad_texto_descriptivo,
        flavor_text: legacyCard.leyenda || legacyCard.descripcion,
      });

      if (cardError) {
        result.errors.push(`Card ${legacyCard.nombre}: ${cardError.message}`);
        result.skipped++;
        continue;
      }

      // Create printing
      const printingId = uuidv7();
      const { error: printingError } = await supabase.from('card_printings').insert({
        card_printing_id: printingId,
        card_id: cardId,
        edition_id: editionId,
        rarity_tier_id: rarityId,
        image_url: legacyCard.imagen_url,
        legal_status: 'LEGAL',
        printing_variant: 'standard',
      });

      if (printingError) {
        result.errors.push(`Printing for ${legacyCard.nombre}: ${printingError.message}`);
        // Card was created but printing failed - not ideal but continue
      }

      result.imported++;
    } catch (error) {
      result.errors.push(`Card ${legacyCard.nombre}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.skipped++;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

async function fetchCardTypes(supabase: Client) {
  const { data } = await supabase.from('card_types').select('card_type_id, name, code');
  return data ?? [];
}

async function fetchRaces(supabase: Client) {
  const { data } = await supabase.from('races').select('race_id, name, code');
  return data ?? [];
}

async function fetchEditions(supabase: Client) {
  const { data } = await supabase.from('editions').select('edition_id, name, code');
  return data ?? [];
}

async function fetchRarities(supabase: Client) {
  const { data } = await supabase.from('rarity_tiers').select('rarity_tier_id, name, code');
  return data ?? [];
}

function mapCardType(tipo: string, cardTypes: { card_type_id: string; name: string; code: string }[]): string | null {
  const typeMap: Record<string, string> = {
    'Aliado': 'ALIADO',
    'Oro': 'ORO',
    'Arma': 'ARMA',
    'Totem': 'TOTEM',
    'Talisman': 'TALISMAN',
  };

  const code = typeMap[tipo];
  if (!code) return null;

  const found = cardTypes.find((t) => t.code === code);
  return found?.card_type_id ?? null;
}

function mapRace(raza: string, races: { race_id: string; name: string; code: string }[]): string | null {
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

  const normalizedRaza = normalizeText(raza);

  // Try normalized exact match
  let found = races.find((r) => normalizeText(r.name) === normalizedRaza);
  if (found) return found.race_id;

  // Try code match
  const codeRaza = raza.toUpperCase().replace(/\s+/g, '_');
  found = races.find((r) => r.code === codeRaza);
  if (found) return found.race_id;

  return null;
}

function mapEdition(expansion: string, editions: { edition_id: string; name: string; code: string }[]): string | null {
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

  const normalizedExpansion = normalizeText(expansion);

  // Try normalized exact match
  let found = editions.find((e) => normalizeText(e.name) === normalizedExpansion);
  if (found) return found.edition_id;

  // Try normalized partial match
  found = editions.find((e) => normalizeText(e.name).includes(normalizedExpansion));
  if (found) return found.edition_id;

  // Try code match
  found = editions.find((e) => e.code.toLowerCase() === normalizedExpansion);
  if (found) return found.edition_id;

  return null;
}

function mapRarity(rareza: string, rarities: { rarity_tier_id: string; name: string; code: string }[]): string | null {
  const rarityMap: Record<string, string> = {
    'Común': 'COMUN',
    'Rara': 'RARA',
    'Épica': 'EPICA',
    'Legendaria': 'LEGENDARIA',
  };

  const code = rarityMap[rareza];
  if (!code) {
    // Try exact match
    const found = rarities.find((r) => r.name.toLowerCase() === rareza.toLowerCase());
    return found?.rarity_tier_id ?? null;
  }

  const found = rarities.find((r) => r.code === code);
  return found?.rarity_tier_id ?? null;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .trim();
}
