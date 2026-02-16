import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { CreateDeck, UpdateDeck, DeckVersionCardInput, DeckCardEntry } from '@myl/shared';

import { AppError } from '../api/errors';

/**
 * Decks service — CRUD decks, versions, version cards.
 * Doc reference: 11_API_CONTRACTS.md, 03_DATA_MODEL_SQL.md
 */

type Client = SupabaseClient<Database>;

/**
 * Get all decks for a user.
 */
export async function getUserDecks(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from('decks')
    .select(`
      deck_id, user_id, format_id, name, description, visibility, created_at, updated_at,
      format:formats!inner(format_id, name, code)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar mazos');
  return data;
}

/**
 * Get a single deck with its latest version.
 */
export async function getDeck(supabase: Client, deckId: string) {
  const { data: deck, error: deckErr } = await supabase
    .from('decks')
    .select(`
      deck_id, user_id, format_id, name, description, visibility, created_at, updated_at,
      format:formats!inner(format_id, name, code)
    `)
    .eq('deck_id', deckId)
    .single();

  if (deckErr || !deck) throw new AppError('NOT_FOUND', 'Mazo no encontrado');

  // Get latest version
  const { data: latestVersion } = await supabase
    .from('deck_versions')
    .select('deck_version_id, deck_id, version_number, notes, created_at')
    .eq('deck_id', deckId)
    .order('version_number', { ascending: false})
    .limit(1)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ...(deck as any), latest_version: latestVersion ?? null };
}

/**
 * Create a new deck.
 */
export async function createDeck(supabase: Client, userId: string, data: CreateDeck) {
  const { data: deck, error } = await supabase
    .from('decks')
    .insert({
      user_id: userId,
      format_id: data.format_id,
      name: data.name,
      description: data.description ?? null,
      visibility: data.visibility ?? 'PRIVATE',
    } as never)
    .select('deck_id, user_id, format_id, name, description, visibility, created_at, updated_at')
    .single();

  if (error || !deck) throw new AppError('INTERNAL_ERROR', 'Error al crear mazo');
  return deck;
}

/**
 * Update deck metadata.
 */
export async function updateDeck(supabase: Client, deckId: string, data: UpdateDeck) {
  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.format_id !== undefined) updatePayload.format_id = data.format_id;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.visibility !== undefined) updatePayload.visibility = data.visibility;

  const { data: deck, error } = await supabase
    .from('decks')
    .update(updatePayload)
    .eq('deck_id', deckId)
    .select('deck_id, user_id, format_id, name, description, visibility, created_at, updated_at')
    .single();

  if (error || !deck) throw new AppError('INTERNAL_ERROR', 'Error al actualizar mazo');
  return deck;
}

/**
 * Delete a deck.
 */
export async function deleteDeck(supabase: Client, deckId: string) {
  const { error } = await supabase.from('decks').delete().eq('deck_id', deckId);
  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar mazo');
}

/**
 * Create a new deck version with cards.
 */
export async function createDeckVersion(
  supabase: Client,
  deckId: string,
  cards: DeckVersionCardInput[],
  notes?: string,
) {
  // Get next version number
  const { data: lastVersion } = await supabase
    .from('deck_versions')
    .select('version_number')
    .eq('deck_id', deckId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (lastVersion?.version_number ?? 0) + 1;

  // Insert version
  const { data: version, error: vErr } = await supabase
    .from('deck_versions')
    .insert({
      deck_id: deckId,
      version_number: nextVersion,
      notes: notes ?? null,
    })
    .select('deck_version_id, deck_id, version_number, notes, created_at')
    .single();

  if (vErr || !version) throw new AppError('INTERNAL_ERROR', 'Error al crear version del mazo');

  // Insert cards
  if (cards.length > 0) {
    const cardRows = cards.map((c) => ({
      deck_version_id: version.deck_version_id,
      card_printing_id: c.card_printing_id,
      qty: c.qty,
      is_starting_gold: c.is_starting_gold ?? false,
    }));

    const { error: cardsErr } = await supabase.from('deck_version_cards').insert(cardRows);
    if (cardsErr) throw new AppError('INTERNAL_ERROR', 'Error al guardar cartas del mazo');
  }

  // Update deck's updated_at
  await supabase.from('decks').update({ updated_at: new Date().toISOString() } as never).eq('deck_id', deckId);

  return version;
}

/**
 * Get versions of a deck.
 */
export async function getDeckVersions(supabase: Client, deckId: string) {
  const { data, error } = await supabase
    .from('deck_versions')
    .select('deck_version_id, deck_id, version_number, notes, created_at')
    .eq('deck_id', deckId)
    .order('version_number', { ascending: false });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar versiones');
  return data;
}

/**
 * Get a deck version with expanded card data.
 */
export async function getDeckVersion(supabase: Client, versionId: string) {
  const { data: version, error: vErr } = await supabase
    .from('deck_versions')
    .select('deck_version_id, deck_id, version_number, notes, created_at')
    .eq('deck_version_id', versionId)
    .single();

  if (vErr || !version) throw new AppError('NOT_FOUND', 'Version no encontrada');

  // Get cards with relations
  const { data: cards, error: cErr } = await supabase
    .from('deck_version_cards')
    .select(`
      deck_version_card_id, deck_version_id, card_printing_id, qty, is_starting_gold,
      card_printing:card_printings!inner(
        card_printing_id, card_id, edition_id, rarity_tier_id, image_url, illustrator,
        collector_number, legal_status, printing_variant,
        edition:editions!inner(edition_id, block_id, name, code, sort_order),
        rarity_tier:rarity_tiers(rarity_tier_id, name, code, sort_order),
        card:cards!inner(
          card_id, name, name_normalized, card_type_id, race_id,
          ally_strength, cost, is_unique, has_ability, can_be_starting_gold, text,
          card_type:card_types!inner(card_type_id, name, code, sort_order),
          race:races(race_id, name, code, sort_order)
        )
      )
    `)
    .eq('deck_version_id', versionId);

  if (cErr) throw new AppError('INTERNAL_ERROR', 'Error al cargar cartas de la version');

  return { ...version, cards: cards ?? [] };
}

/**
 * Resolve deck version cards into DeckCardEntry[] for the validation engine.
 */
export async function getDeckVersionCardsForValidation(
  supabase: Client,
  versionId: string,
): Promise<DeckCardEntry[]> {
  const versionData = await getDeckVersion(supabase, versionId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return versionData.cards.map((row: any) => {
    const cp = row.card_printing;
    const card = cp.card;
    const edition = cp.edition;
    return {
      card_printing_id: cp.card_printing_id as string,
      qty: row.qty as number,
      is_starting_gold: row.is_starting_gold as boolean,
      card_id: card.card_id as string,
      card_type_code: card.card_type.code as string,
      card_type_name: card.card_type.name as string,
      race_id: card.race_id as string | null,
      race_name: card.race?.name as string | null ?? null,
      is_unique: card.is_unique as boolean,
      has_ability: card.has_ability as boolean,
      can_be_starting_gold: card.can_be_starting_gold as boolean,
      legal_status: cp.legal_status,
      edition_id: edition.edition_id as string,
      block_id: edition.block_id as string,
      cost: card.cost as number | null,
      card_name: card.name as string,
      rarity_tier_id: cp.rarity_tier_id as string | null,
      rarity_name: cp.rarity_tier?.name as string | null ?? null,
    };
  });
}

/**
 * Resolve an array of card_printing_ids into DeckCardEntry[] for live validation.
 */
export async function resolveCardsForValidation(
  supabase: Client,
  cards: DeckVersionCardInput[],
): Promise<DeckCardEntry[]> {
  const printingIds = cards.map((c) => c.card_printing_id);

  const { data: printings, error } = await supabase
    .from('card_printings')
    .select(`
      card_printing_id, card_id, edition_id, rarity_tier_id, legal_status,
      edition:editions!inner(edition_id, block_id),
      rarity_tier:rarity_tiers(rarity_tier_id, name),
      card:cards!inner(
        card_id, name, cost, is_unique, has_ability, can_be_starting_gold, race_id,
        card_type:card_types!inner(code, name),
        race:races(race_id, name)
      )
    `)
    .in('card_printing_id', printingIds);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al resolver cartas para validacion');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const printingMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (printings ?? []) as any[]) {
    printingMap.set(p.card_printing_id, p);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cards.map((c) => {
    const p = printingMap.get(c.card_printing_id);
    if (!p) {
      return {
        card_printing_id: c.card_printing_id,
        qty: c.qty,
        is_starting_gold: c.is_starting_gold,
        card_id: '',
        card_type_code: 'UNKNOWN',
        card_type_name: 'Desconocido',
        race_id: null,
        race_name: null,
        is_unique: false,
        has_ability: false,
        can_be_starting_gold: false,
        legal_status: 'LEGAL' as const,
        edition_id: '',
        block_id: '',
        cost: null,
        card_name: 'Carta no encontrada',
        rarity_tier_id: null,
        rarity_name: null,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const card = p.card as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edition = p.edition as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rarity = p.rarity_tier as any;
    return {
      card_printing_id: p.card_printing_id,
      qty: c.qty,
      is_starting_gold: c.is_starting_gold,
      card_id: card.card_id as string,
      card_type_code: card.card_type.code as string,
      card_type_name: card.card_type.name as string,
      race_id: card.race_id as string | null,
      race_name: card.race?.name as string | null ?? null,
      is_unique: card.is_unique as boolean,
      has_ability: card.has_ability as boolean,
      can_be_starting_gold: card.can_be_starting_gold as boolean,
      legal_status: p.legal_status,
      edition_id: edition.edition_id as string,
      block_id: edition.block_id as string,
      cost: card.cost as number | null,
      card_name: card.name as string,
      rarity_tier_id: p.rarity_tier_id,
      rarity_name: rarity?.name as string | null ?? null,
    };
  });
}
