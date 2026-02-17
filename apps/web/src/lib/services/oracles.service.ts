/**
 * Oracles & Strategy service — manages card oracles (rulings/errata)
 * and deck strategy content sections with card references.
 *
 * Doc reference: 03_DATA_MODEL_SQL.md
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { CreateCardOracle, UpdateCardOracle, CreateDeckStrategySection, UpdateDeckStrategySection } from '@myl/shared';

import { AppError } from '../api/errors';

type Client = SupabaseClient<Database>;

// ============================================================================
// Card Oracles CRUD
// ============================================================================

/** Get all oracles for a card, ordered by sort_order. */
export async function getCardOracles(supabase: Client, cardId: string) {
  const { data, error } = await supabase
    .from('card_oracles')
    .select('*')
    .eq('card_id', cardId)
    .order('sort_order', { ascending: true });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar oráculos');
  return data ?? [];
}

/** Get all oracles grouped by source document. */
export async function getOraclesBySource(supabase: Client, sourceDocument: string) {
  const { data, error } = await supabase
    .from('card_oracles')
    .select(`
      *,
      card:cards!inner(card_id, name,
        card_type:card_types!inner(name, code)
      )
    `)
    .eq('source_document', sourceDocument)
    .order('sort_order', { ascending: true });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar oráculos por fuente');
  return data ?? [];
}

/** List distinct source documents. */
export async function getOracleSourceDocuments(supabase: Client) {
  const { data, error } = await supabase
    .from('card_oracles')
    .select('source_document')
    .order('source_document', { ascending: true });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar documentos fuente');

  // Deduplicate (Supabase doesn't support DISTINCT in select)
  const seen = new Set<string>();
  const docs: string[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.source_document)) {
      seen.add(row.source_document);
      docs.push(row.source_document);
    }
  }
  return docs;
}

/** Create a new oracle entry. */
export async function createCardOracle(
  supabase: Client,
  userId: string,
  data: CreateCardOracle,
) {
  const { data: created, error } = await supabase
    .from('card_oracles')
    .insert({
      card_id: data.card_id,
      source_document: data.source_document,
      ruling_text: data.ruling_text,
      ability_type: data.ability_type ?? null,
      sort_order: data.sort_order ?? 0,
      created_by: userId,
    } as never)
    .select('*')
    .single();

  if (error || !created) throw new AppError('INTERNAL_ERROR', 'Error al crear oráculo');
  return created;
}

/** Update an oracle entry. */
export async function updateCardOracle(
  supabase: Client,
  oracleId: string,
  data: UpdateCardOracle,
) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.source_document !== undefined) updateData.source_document = data.source_document;
  if (data.ruling_text !== undefined) updateData.ruling_text = data.ruling_text;
  if (data.ability_type !== undefined) updateData.ability_type = data.ability_type;
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

  const { data: updated, error } = await supabase
    .from('card_oracles')
    .update(updateData as never)
    .eq('oracle_id', oracleId)
    .select('*')
    .single();

  if (error || !updated) throw new AppError('INTERNAL_ERROR', 'Error al actualizar oráculo');
  return updated;
}

/** Delete an oracle entry. */
export async function deleteCardOracle(supabase: Client, oracleId: string) {
  const { error } = await supabase
    .from('card_oracles')
    .delete()
    .eq('oracle_id', oracleId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar oráculo');
}

// ============================================================================
// Deck Strategy Sections CRUD
// ============================================================================

/** Get all strategy sections for a deck, with card refs. */
export async function getDeckStrategySections(supabase: Client, deckId: string) {
  const { data: sections, error: secErr } = await supabase
    .from('deck_strategy_sections')
    .select('*')
    .eq('deck_id', deckId)
    .order('sort_order', { ascending: true });

  if (secErr) throw new AppError('INTERNAL_ERROR', 'Error al cargar secciones de estrategia');

  if (!sections || sections.length === 0) return [];

  // Load card refs for all sections
  const sectionIds = sections.map((s) => (s as { section_id: string }).section_id);
  const { data: refs, error: refErr } = await supabase
    .from('deck_strategy_card_refs')
    .select(`
      *,
      card:cards!inner(card_id, name)
    `)
    .in('section_id', sectionIds);

  if (refErr) throw new AppError('INTERNAL_ERROR', 'Error al cargar referencias de cartas');

  interface RefRow {
    ref_id: string;
    section_id: string;
    card_id: string;
    role_label: string | null;
    card: { card_id: string; name: string };
  }
  const typedRefs = (refs ?? []) as unknown as RefRow[];

  // Group refs by section_id
  const refsBySection = new Map<string, RefRow[]>();
  for (const ref of typedRefs) {
    const existing = refsBySection.get(ref.section_id);
    if (existing) {
      existing.push(ref);
    } else {
      refsBySection.set(ref.section_id, [ref]);
    }
  }

  return sections.map((s) => ({
    ...s,
    card_refs: refsBySection.get((s as { section_id: string }).section_id) ?? [],
  }));
}

/** Create a strategy section with optional card refs. */
export async function createDeckStrategySection(
  supabase: Client,
  deckId: string,
  userId: string,
  data: CreateDeckStrategySection,
) {
  const { data: created, error } = await supabase
    .from('deck_strategy_sections')
    .insert({
      deck_id: deckId,
      section_type: data.section_type,
      title: data.title,
      content: data.content,
      sort_order: data.sort_order ?? 0,
      created_by: userId,
    } as never)
    .select('*')
    .single();

  if (error || !created) throw new AppError('INTERNAL_ERROR', 'Error al crear sección de estrategia');

  const sectionId = (created as { section_id: string }).section_id;

  // Insert card refs if provided
  if (data.card_refs && data.card_refs.length > 0) {
    const refsToInsert = data.card_refs.map((ref) => ({
      section_id: sectionId,
      card_id: ref.card_id,
      role_label: ref.role_label ?? null,
    }));

    const { error: refErr } = await supabase
      .from('deck_strategy_card_refs')
      .insert(refsToInsert as never[]);

    if (refErr) throw new AppError('INTERNAL_ERROR', 'Error al crear referencias de cartas');
  }

  return created;
}

/** Update a strategy section, replacing card refs if provided. */
export async function updateDeckStrategySection(
  supabase: Client,
  sectionId: string,
  data: UpdateDeckStrategySection,
) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.section_type !== undefined) updateData.section_type = data.section_type;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

  const { data: updated, error } = await supabase
    .from('deck_strategy_sections')
    .update(updateData as never)
    .eq('section_id', sectionId)
    .select('*')
    .single();

  if (error || !updated) throw new AppError('INTERNAL_ERROR', 'Error al actualizar sección');

  // Replace card refs if provided
  if (data.card_refs !== undefined) {
    // Delete existing refs
    await supabase
      .from('deck_strategy_card_refs')
      .delete()
      .eq('section_id', sectionId);

    // Insert new refs
    if (data.card_refs.length > 0) {
      const refsToInsert = data.card_refs.map((ref) => ({
        section_id: sectionId,
        card_id: ref.card_id,
        role_label: ref.role_label ?? null,
      }));

      const { error: refErr } = await supabase
        .from('deck_strategy_card_refs')
        .insert(refsToInsert as never[]);

      if (refErr) throw new AppError('INTERNAL_ERROR', 'Error al actualizar referencias de cartas');
    }
  }

  return updated;
}

/** Delete a strategy section (cascade deletes card refs). */
export async function deleteDeckStrategySection(supabase: Client, sectionId: string) {
  const { error } = await supabase
    .from('deck_strategy_sections')
    .delete()
    .eq('section_id', sectionId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar sección de estrategia');
}
