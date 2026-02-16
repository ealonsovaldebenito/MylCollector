import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import type { ValidationResult } from '@myl/shared';
import { validateDeck } from '@myl/shared';

import { AppError } from '../api/errors';
import { getFormatConfig } from './formats.service';
import { getDeckVersionCardsForValidation } from './decks.service';

/**
 * Validation service — orchestrates validation engine with DB data.
 * Doc reference: 04_DECK_VALIDATION_ENGINE.md
 */

type Client = SupabaseClient<Database>;

/**
 * Validate a persisted deck version and store the result.
 */
export async function validateDeckVersion(
  supabase: Client,
  versionId: string,
  formatId: string,
  requestId?: string,
): Promise<ValidationResult> {
  // Load format config and cards in parallel
  const [config, entries] = await Promise.all([
    getFormatConfig(supabase, formatId),
    getDeckVersionCardsForValidation(supabase, versionId),
  ]);

  // Run pure validation
  const result = validateDeck(config, entries);

  // Persist validation run
  const { data: run, error: runErr } = await supabase
    .from('deck_validation_runs')
    .insert({
      deck_version_id: versionId,
      format_id: formatId,
      is_valid: result.is_valid,
      duration_ms: result.timing.duration_ms,
      computed_stats: result.computed_stats as unknown as Record<string, unknown>,
      request_id: requestId ?? null,
    })
    .select('validation_run_id')
    .single();

  if (runErr || !run) throw new AppError('INTERNAL_ERROR', 'Error al guardar resultado de validacion');

  // Persist messages
  if (result.messages.length > 0) {
    const messageRows = result.messages.map((m, i) => ({
      validation_run_id: run.validation_run_id,
      rule_id: m.rule_id,
      rule_version: m.rule_version,
      severity: m.severity,
      message: m.message,
      hint: m.hint ?? null,
      entity_ref: (m.entity_ref as Record<string, unknown> | null) ?? null,
      context_json: (m.context_json as Record<string, unknown> | null) ?? null,
      sort_order: i,
    }));

    const { error: msgErr } = await supabase.from('deck_validation_messages').insert(messageRows);
    if (msgErr) throw new AppError('INTERNAL_ERROR', 'Error al guardar mensajes de validacion');
  }

  return result;
}

/**
 * Get the latest validation run for a deck version.
 */
export async function getLatestValidation(
  supabase: Client,
  versionId: string,
): Promise<ValidationResult | null> {
  const { data: run } = await supabase
    .from('deck_validation_runs')
    .select('validation_run_id, is_valid, duration_ms, computed_stats')
    .eq('deck_version_id', versionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!run) return null;

  const { data: messages } = await supabase
    .from('deck_validation_messages')
    .select('rule_id, rule_version, severity, message, hint, entity_ref, context_json')
    .eq('validation_run_id', run.validation_run_id)
    .order('sort_order');

  return {
    is_valid: run.is_valid,
    messages: (messages ?? []).map((m) => ({
      rule_id: m.rule_id,
      rule_version: m.rule_version,
      severity: m.severity as 'BLOCK' | 'WARN' | 'INFO',
      message: m.message,
      hint: m.hint,
      entity_ref: m.entity_ref as ValidationResult['messages'][number]['entity_ref'],
      context_json: (m.context_json ?? {}) as Record<string, unknown>,
    })),
    computed_stats: (run.computed_stats ?? {
      total_cards: 0,
      cost_histogram: {},
      type_distribution: {},
      race_distribution: {},
      rarity_distribution: {},
    }) as ValidationResult['computed_stats'],
    timing: { duration_ms: run.duration_ms ?? 0 },
  };
}
