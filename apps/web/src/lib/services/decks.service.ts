import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { CreateDeck, UpdateDeck, DeckVersionCardInput, DeckCardEntry, Visibility } from '@myl/shared';

import { AppError } from '../api/errors';
import { logger } from '../logger';

/**
 * Decks service — CRUD decks, versions, version cards.
 * Doc reference: 11_API_CONTRACTS.md, 03_DATA_MODEL_SQL.md
 */

type Client = SupabaseClient<Database>;

function isPostgrestMissingIdentifier(error: unknown, identifier: string): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { message?: unknown; details?: unknown; code?: unknown; hint?: unknown };
  const message = typeof e.message === 'string' ? e.message : '';
  const details = typeof e.details === 'string' ? e.details : '';
  const hint = typeof e.hint === 'string' ? e.hint : '';
  const code = typeof e.code === 'string' ? e.code : '';
  const haystack = `${message}\n${details}\n${hint}`.toLowerCase();
  const id = identifier.toLowerCase();
  // PostgREST can throw "Could not find the '<id>' in the schema cache"
  return (
    (haystack.includes(id) &&
      (haystack.includes('schema cache') || haystack.includes('does not exist') || haystack.includes('could not find'))) ||
    // relation/table missing
    (code === '42P01' && haystack.includes(id))
  );
}

function isSchemaMismatchError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { message?: unknown; details?: unknown; code?: unknown; hint?: unknown };
  const message = typeof e.message === 'string' ? e.message : '';
  const details = typeof e.details === 'string' ? e.details : '';
  const hint = typeof e.hint === 'string' ? e.hint : '';
  const code = typeof e.code === 'string' ? e.code : '';
  const haystack = `${message}\n${details}\n${hint}`.toLowerCase();

  // Postgres: undefined table / column
  if (code === '42P01' || code === '42703') return true;

  // PostgREST: schema cache / missing relationship / missing resource (varies by version)
  if (haystack.includes('schema cache')) return true;
  if (haystack.includes('could not find') && (haystack.includes('relationship') || haystack.includes('table') || haystack.includes('column'))) {
    return true;
  }

  return false;
}

export interface DeckFormatRef {
  format_id: string;
  name: string;
  code: string;
}

export interface DeckListItem {
  deck_id: string;
  user_id: string;
  format_id: string;
  edition_id: string | null;
  race_id: string | null;
  name: string;
  description: string | null;
  strategy: string | null;
  cover_image_url: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  format: DeckFormatRef;
  tag_ids: string[];
}

export interface DeckLatestVersionRef {
  deck_version_id: string;
  deck_id: string;
  version_number: number;
  notes: string | null;
  created_at: string;
}

export interface DeckDetail extends DeckListItem {
  latest_version: DeckLatestVersionRef | null;
}

/**
 * Get all decks for a user.
 */
export async function getUserDecks(supabase: Client, userId: string) {
  const selectFull = `
    deck_id, user_id, format_id, edition_id, race_id, name, description, strategy, cover_image_url, visibility, created_at, updated_at,
    deck_tags(tag_id),
    format:formats!inner(format_id, name, code)
  `;

  const selectNoTags = `
    deck_id, user_id, format_id, edition_id, race_id, name, description, strategy, cover_image_url, visibility, created_at, updated_at,
    format:formats!inner(format_id, name, code)
  `;

  const selectNoExtras = `
    deck_id, user_id, format_id, edition_id, race_id, name, description, visibility, created_at, updated_at,
    format:formats!inner(format_id, name, code)
  `;

  const selectLegacy = `
    deck_id, user_id, format_id, name, description, visibility, created_at, updated_at,
    format:formats!inner(format_id, name, code)
  `;

  const attempts = [selectFull, selectNoTags, selectNoExtras, selectLegacy];

  let lastError: unknown = null;
  for (const sel of attempts) {
    const { data, error } = await supabase
      .from('decks')
      .select(sel)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      lastError = error;
      const missingDeckTags = isPostgrestMissingIdentifier(error, 'deck_tags');
      const missingStrategy = isPostgrestMissingIdentifier(error, 'strategy');
      const missingCover = isPostgrestMissingIdentifier(error, 'cover_image_url');
      const missingEdition = isPostgrestMissingIdentifier(error, 'edition_id');
      const missingRace = isPostgrestMissingIdentifier(error, 'race_id');

      if (missingDeckTags || missingStrategy || missingCover || missingEdition || missingRace || isSchemaMismatchError(error)) {
        logger.warn({
          scope: 'decks.getUserDecks',
          fallback: true,
          user_id: userId,
          select: sel.replace(/\s+/g, ' ').trim().slice(0, 240),
          supabase_error: error,
        });
        continue;
      }

      logger.error({
        scope: 'decks.getUserDecks',
        user_id: userId,
        select: sel.replace(/\s+/g, ' ').trim().slice(0, 240),
        supabase_error: error,
      });
      throw new AppError('INTERNAL_ERROR', 'Error al cargar mazos');
    }

    type DeckTagsRef = { tag_id: string };
    return (data ?? []).map((row) => {
      const deckTags = (row as unknown as { deck_tags?: DeckTagsRef[] | null }).deck_tags ?? [];
      return {
        ...(row as unknown as Omit<DeckListItem, 'tag_ids'>),
        tag_ids: deckTags.map((t) => t.tag_id),
      } satisfies DeckListItem;
    }) as DeckListItem[];
  }

  logger.error({
    scope: 'decks.getUserDecks',
    user_id: userId,
    supabase_error: lastError,
    message: 'All select fallbacks failed',
  });
  throw new AppError('INTERNAL_ERROR', 'Error al cargar mazos');
}

/**
 * Get a single deck with its latest version.
 */
export async function getDeck(supabase: Client, deckId: string): Promise<DeckDetail> {
  const selectFull = `
    deck_id, user_id, format_id, edition_id, race_id, name, description, strategy, cover_image_url, visibility, created_at, updated_at,
    deck_tags(tag_id),
    format:formats!inner(format_id, name, code)
  `;

  const selectNoTags = `
    deck_id, user_id, format_id, edition_id, race_id, name, description, strategy, cover_image_url, visibility, created_at, updated_at,
    format:formats!inner(format_id, name, code)
  `;

  const selectNoExtras = `
    deck_id, user_id, format_id, edition_id, race_id, name, description, visibility, created_at, updated_at,
    format:formats!inner(format_id, name, code)
  `;

  const selectLegacy = `
    deck_id, user_id, format_id, name, description, visibility, created_at, updated_at,
    format:formats!inner(format_id, name, code)
  `;

  const attempts = [selectFull, selectNoTags, selectNoExtras, selectLegacy];

  let deck: unknown = null;
  for (const sel of attempts) {
    const { data, error } = await supabase.from('decks').select(sel).eq('deck_id', deckId).single();
    if (error) {
      const missingDeckTags = isPostgrestMissingIdentifier(error, 'deck_tags');
      const missingStrategy = isPostgrestMissingIdentifier(error, 'strategy');
      const missingCover = isPostgrestMissingIdentifier(error, 'cover_image_url');
      const missingEdition = isPostgrestMissingIdentifier(error, 'edition_id');
      const missingRace = isPostgrestMissingIdentifier(error, 'race_id');
      if (missingDeckTags || missingStrategy || missingCover || missingEdition || missingRace) continue;
      throw new AppError('NOT_FOUND', 'Mazo no encontrado');
    }
    deck = data;
    break;
  }

  if (!deck) throw new AppError('NOT_FOUND', 'Mazo no encontrado');

  // Get latest version
  const { data: latestVersion } = await supabase
    .from('deck_versions')
    .select('deck_version_id, deck_id, version_number, notes, created_at')
    .eq('deck_id', deckId)
    .order('version_number', { ascending: false})
    .limit(1)
    .single();

  type DeckTagsRef = { tag_id: string };
  const row = deck as unknown as Omit<DeckDetail, 'tag_ids' | 'latest_version'> & { deck_tags?: DeckTagsRef[] | null };
  return {
    ...(row as unknown as Omit<DeckDetail, 'tag_ids' | 'latest_version'>),
    tag_ids: (row.deck_tags ?? []).map((t) => t.tag_id),
    latest_version: (latestVersion ?? null) as DeckLatestVersionRef | null,
  };
}

/**
 * Create a new deck.
 */
export async function createDeck(supabase: Client, userId: string, data: CreateDeck) {
  const { tag_ids, ...deckData } = data;
  const { data: deck, error } = await supabase
    .from('decks')
    .insert({
      user_id: userId,
      format_id: deckData.format_id,
      edition_id: deckData.edition_id ?? null,
      race_id: deckData.race_id ?? null,
      name: deckData.name,
      description: deckData.description ?? null,
      strategy: deckData.strategy ?? null,
      cover_image_url: deckData.cover_image_url ?? null,
      visibility: deckData.visibility ?? 'PRIVATE',
    } as never)
    .select('deck_id, user_id, format_id, edition_id, race_id, name, description, strategy, cover_image_url, visibility, created_at, updated_at')
    .single();

  if (error || !deck) throw new AppError('INTERNAL_ERROR', 'Error al crear mazo');

  if (tag_ids && tag_ids.length > 0) {
    const rows = tag_ids.map((tag_id) => ({ deck_id: deck.deck_id, tag_id }));
    const { error: tagErr } = await supabase.from('deck_tags').insert(rows as never);
    if (tagErr && !isPostgrestMissingIdentifier(tagErr, 'deck_tags')) {
      throw new AppError('INTERNAL_ERROR', 'Error al asignar tags al mazo');
    }
  }

  return { ...deck, tag_ids: tag_ids ?? [] };
}

/**
 * Update deck metadata.
 */
export async function updateDeck(supabase: Client, deckId: string, data: UpdateDeck) {
  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.format_id !== undefined) updatePayload.format_id = data.format_id;
  if (data.edition_id !== undefined) updatePayload.edition_id = data.edition_id;
  if (data.race_id !== undefined) updatePayload.race_id = data.race_id;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.strategy !== undefined) updatePayload.strategy = data.strategy;
  if (data.cover_image_url !== undefined) updatePayload.cover_image_url = data.cover_image_url;
  if (data.visibility !== undefined) updatePayload.visibility = data.visibility;

  const { data: deck, error } = await supabase
    .from('decks')
    .update(updatePayload)
    .eq('deck_id', deckId)
    .select('deck_id, user_id, format_id, edition_id, race_id, name, description, strategy, cover_image_url, visibility, created_at, updated_at')
    .single();

  if (error || !deck) throw new AppError('INTERNAL_ERROR', 'Error al actualizar mazo');

  const tag_ids = data.tag_ids;
  if (tag_ids !== undefined) {
    const { error: delErr } = await supabase.from('deck_tags').delete().eq('deck_id', deckId);
    if (delErr && !isPostgrestMissingIdentifier(delErr, 'deck_tags')) {
      throw new AppError('INTERNAL_ERROR', 'Error al actualizar tags del mazo');
    }

    if (tag_ids.length > 0) {
      const rows = tag_ids.map((tag_id) => ({ deck_id: deckId, tag_id }));
      const { error: tagErr } = await supabase.from('deck_tags').insert(rows as never);
      if (tagErr && !isPostgrestMissingIdentifier(tagErr, 'deck_tags')) {
        throw new AppError('INTERNAL_ERROR', 'Error al actualizar tags del mazo');
      }
    }
  }

  return { ...deck, tag_ids: tag_ids ?? [] };
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

  // Keep only the latest 3 versions to avoid data bloat
  const { data: versionsToDelete } = await supabase
    .from('deck_versions')
    .select('deck_version_id')
    .eq('deck_id', deckId)
    .order('version_number', { ascending: false })
    .range(3, 200);

  if (versionsToDelete && versionsToDelete.length > 0) {
    const ids = versionsToDelete.map((v) => v.deck_version_id);
    await supabase.from('deck_versions').delete().in('deck_version_id', ids);
  }

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
