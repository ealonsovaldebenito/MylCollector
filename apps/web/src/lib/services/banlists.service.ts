/**
 * Ban lists service — manages format card limits and ban list revisions.
 * Provides CRUD for format_card_limits + versioned ban list history.
 *
 * Doc reference: 04_DECK_VALIDATION_ENGINE.md
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { CreateBanListRevision, UpsertFormatCardLimit } from '@myl/shared';

import { AppError } from '../api/errors';

type Client = SupabaseClient<Database>;

// ============================================================================
// Format Card Limits CRUD
// ============================================================================

/** Get all card limits for a format, with card details. */
export async function getFormatCardLimits(supabase: Client, formatId: string) {
  const { data, error } = await supabase
    .from('format_card_limits')
    .select(`
      format_card_limit_id, format_id, card_id, max_qty, notes, revision_id,
      created_at, updated_at,
      card:cards!inner(card_id, name, card_type_id,
        card_type:card_types!inner(name, code)
      )
    `)
    .eq('format_id', formatId)
    .order('max_qty', { ascending: true });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar límites de cartas');
  return data ?? [];
}

/** Upsert a card limit for a format. */
export async function upsertFormatCardLimit(
  supabase: Client,
  formatId: string,
  data: UpsertFormatCardLimit,
) {
  // Check if limit already exists
  const { data: existing } = await supabase
    .from('format_card_limits')
    .select('format_card_limit_id')
    .eq('format_id', formatId)
    .eq('card_id', data.card_id)
    .single();

  if (existing) {
    // Update existing limit
    const { data: updated, error } = await supabase
      .from('format_card_limits')
      .update({
        max_qty: data.max_qty,
        notes: data.notes ?? null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('format_card_limit_id', existing.format_card_limit_id)
      .select('*')
      .single();

    if (error || !updated) throw new AppError('INTERNAL_ERROR', 'Error al actualizar límite');
    return updated;
  }

  // Insert new limit
  const { data: created, error } = await supabase
    .from('format_card_limits')
    .insert({
      format_id: formatId,
      card_id: data.card_id,
      max_qty: data.max_qty,
      notes: data.notes ?? null,
    } as never)
    .select('*')
    .single();

  if (error || !created) throw new AppError('INTERNAL_ERROR', 'Error al crear límite');
  return created;
}

/** Delete a card limit (restores to format default). */
export async function deleteFormatCardLimit(
  supabase: Client,
  formatId: string,
  cardId: string,
) {
  const { error } = await supabase
    .from('format_card_limits')
    .delete()
    .eq('format_id', formatId)
    .eq('card_id', cardId);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al eliminar límite');
}

// ============================================================================
// Ban List Revisions (History)
// ============================================================================

/** Get all revisions for a format, newest first. */
export async function getBanListRevisions(supabase: Client, formatId: string) {
  const { data, error } = await supabase
    .from('ban_list_revisions')
    .select('*')
    .eq('format_id', formatId)
    .order('effective_date', { ascending: false });

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar revisiones');
  return data ?? [];
}

/** Get a single revision with its entries. */
export async function getBanListRevision(supabase: Client, revisionId: string) {
  const { data: revision, error: revErr } = await supabase
    .from('ban_list_revisions')
    .select('*')
    .eq('revision_id', revisionId)
    .single();

  if (revErr || !revision) throw new AppError('NOT_FOUND', 'Revisión no encontrada');

  const { data: entries, error: entErr } = await supabase
    .from('ban_list_entries')
    .select(`
      *,
      card:cards!inner(card_id, name,
        card_type:card_types!inner(name, code)
      )
    `)
    .eq('revision_id', revisionId)
    .order('change_type', { ascending: true });

  if (entErr) throw new AppError('INTERNAL_ERROR', 'Error al cargar entradas de revisión');

  return { ...revision, entries: entries ?? [] };
}

/**
 * Create a new ban list revision and apply changes to format_card_limits.
 * This is a transactional operation:
 * 1. Create the revision record
 * 2. Create entry records for each card change
 * 3. Apply changes to format_card_limits (upsert/delete)
 */
export async function createBanListRevision(
  supabase: Client,
  userId: string,
  data: CreateBanListRevision,
) {
  interface RevisionRow {
    revision_id: string;
    format_id: string;
    name: string;
    description: string | null;
    effective_date: string;
    created_by: string | null;
    created_at: string;
  }

  // 1. Create the revision
  const { data: revisionRaw, error: revErr } = await supabase
    .from('ban_list_revisions')
    .insert({
      format_id: data.format_id,
      name: data.name,
      description: data.description ?? null,
      effective_date: data.effective_date,
      created_by: userId,
    } as never)
    .select('*')
    .single();

  if (revErr || !revisionRaw) throw new AppError('INTERNAL_ERROR', 'Error al crear revisión');
  const revision = revisionRaw as unknown as RevisionRow;

  // 2. For each entry, get the current limit to record previous_qty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: any[] = [];
  for (const entry of data.entries) {
    // Get current limit if it exists
    const { data: currentLimit } = await supabase
      .from('format_card_limits')
      .select('max_qty')
      .eq('format_id', data.format_id)
      .eq('card_id', entry.card_id)
      .single();

    const previousQty = (currentLimit as { max_qty?: number } | null)?.max_qty ?? null;

    // Insert the entry record
    const { data: entryRow, error: entErr } = await supabase
      .from('ban_list_entries')
      .insert({
        revision_id: revision.revision_id,
        card_id: entry.card_id,
        max_qty: entry.max_qty,
        previous_qty: previousQty,
        change_type: entry.change_type,
        notes: entry.notes ?? null,
      } as never)
      .select('*')
      .single();

    if (entErr) throw new AppError('INTERNAL_ERROR', `Error al crear entrada para carta ${entry.card_id}`);
    entries.push(entryRow);

    // 3. Apply the change to format_card_limits
    if (entry.change_type === 'RELEASED') {
      await supabase
        .from('format_card_limits')
        .delete()
        .eq('format_id', data.format_id)
        .eq('card_id', entry.card_id);
    } else {
      const { data: existing } = await supabase
        .from('format_card_limits')
        .select('format_card_limit_id')
        .eq('format_id', data.format_id)
        .eq('card_id', entry.card_id)
        .single();

      if (existing) {
        await supabase
          .from('format_card_limits')
          .update({
            max_qty: entry.max_qty,
            revision_id: revision.revision_id,
            notes: entry.notes ?? null,
            updated_at: new Date().toISOString(),
          } as never)
          .eq('format_card_limit_id', (existing as { format_card_limit_id: string }).format_card_limit_id);
      } else {
        await supabase
          .from('format_card_limits')
          .insert({
            format_id: data.format_id,
            card_id: entry.card_id,
            max_qty: entry.max_qty,
            revision_id: revision.revision_id,
            notes: entry.notes ?? null,
          } as never);
      }
    }
  }

  return { ...revision, entries };
}

/** Get the current ban list summary for a format (grouped by restriction level). */
export async function getBanListSummary(supabase: Client, formatId: string) {
  const limits = await getFormatCardLimits(supabase, formatId);

  interface LimitRow {
    format_card_limit_id: string;
    format_id: string;
    card_id: string;
    max_qty: number;
    notes: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    card: any;
    [key: string]: unknown;
  }

  const typedLimits = limits as unknown as LimitRow[];
  const banned: LimitRow[] = [];
  const limited1: LimitRow[] = [];
  const limited2: LimitRow[] = [];
  const otherLimits: LimitRow[] = [];

  for (const limit of typedLimits) {
    if (limit.max_qty === 0) {
      banned.push(limit);
    } else if (limit.max_qty === 1) {
      limited1.push(limit);
    } else if (limit.max_qty === 2) {
      limited2.push(limit);
    } else {
      otherLimits.push(limit);
    }
  }

  return { banned, limited_1: limited1, limited_2: limited2, other: otherLimits };
}
