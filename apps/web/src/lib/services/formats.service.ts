import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { FormatConfig } from '@myl/shared';

import { AppError } from '../api/errors';

/**
 * Formats service — load formats and build config for validation engine.
 * Doc reference: 04_DECK_VALIDATION_ENGINE.md
 */

type Client = SupabaseClient<Database>;

/**
 * List all active formats.
 */
export async function getActiveFormats(supabase: Client) {
  const { data, error } = await supabase
    .from('formats')
    .select('format_id, name, code, description, is_active, params_json')
    .eq('is_active', true)
    .order('name');

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar formatos');
  return data;
}

/**
 * Build a FormatConfig for the validation engine from DB data.
 */
export async function getFormatConfig(supabase: Client, formatId: string): Promise<FormatConfig> {
  // Load format
  const { data: format, error: fmtErr } = await supabase
    .from('formats')
    .select('format_id, name, code, params_json')
    .eq('format_id', formatId)
    .single();

  if (fmtErr || !format) throw new AppError('NOT_FOUND', 'Formato no encontrado');

  const paramsRaw = format.params_json as Record<string, unknown>;
  const params = {
    deck_size: typeof paramsRaw.deck_size === 'number' ? paramsRaw.deck_size : 50,
    default_card_limit: typeof paramsRaw.default_card_limit === 'number' ? paramsRaw.default_card_limit : 3,
    discontinued_severity: (paramsRaw.discontinued_severity === 'BLOCK' ? 'BLOCK' : 'WARN') as 'WARN' | 'BLOCK',
  };

  // Load allowed blocks, editions, card_types, races in parallel
  const [blocksRes, editionsRes, typesRes, racesRes, limitsRes] = await Promise.all([
    supabase.from('format_allowed_blocks').select('block_id').eq('format_id', formatId),
    supabase.from('format_allowed_editions').select('edition_id').eq('format_id', formatId),
    supabase.from('format_allowed_card_types').select('card_type_id').eq('format_id', formatId),
    supabase.from('format_allowed_races').select('race_id').eq('format_id', formatId),
    supabase.from('format_card_limits').select('card_id, max_qty').eq('format_id', formatId),
  ]);

  const allowed_block_ids = new Set((blocksRes.data ?? []).map((r) => r.block_id));
  const allowed_edition_ids = new Set((editionsRes.data ?? []).map((r) => r.edition_id));
  const allowed_card_type_ids = new Set((typesRes.data ?? []).map((r) => r.card_type_id));
  const allowed_race_ids = new Set((racesRes.data ?? []).map((r) => r.race_id));

  const card_limits = new Map<string, number>();
  for (const row of limitsRes.data ?? []) {
    card_limits.set(row.card_id, row.max_qty);
  }

  return {
    format_id: formatId,
    params,
    allowed_block_ids,
    allowed_edition_ids,
    allowed_card_type_ids,
    allowed_race_ids,
    card_limits,
  };
}
