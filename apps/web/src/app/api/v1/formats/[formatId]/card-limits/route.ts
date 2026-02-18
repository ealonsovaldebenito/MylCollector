/**
 * Format card limits API - public builder rules for copy limits and deck size.
 * GET /api/v1/formats/:formatId/card-limits
 *
 * Changelog:
 * - 2026-02-18: Initial creation for hard client-side deck constraints.
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const formatId = params.formatId;
  if (!formatId) {
    return createError('VALIDATION_ERROR', 'formatId requerido', requestId);
  }

  const { data: format, error: formatErr } = await supabase
    .from('formats')
    .select('params_json')
    .eq('format_id', formatId)
    .single();

  if (formatErr || !format) {
    return createError('NOT_FOUND', 'Formato no encontrado', requestId);
  }

  const paramsJson = (format.params_json ?? {}) as Record<string, unknown>;
  const deckSizeRaw = paramsJson.deck_size;
  const defaultLimitRaw = paramsJson.default_card_limit;

  const deckSize =
    typeof deckSizeRaw === 'number' && deckSizeRaw > 0 ? Math.floor(deckSizeRaw) : 50;
  const defaultCardLimit =
    typeof defaultLimitRaw === 'number' && defaultLimitRaw > 0
      ? Math.floor(defaultLimitRaw)
      : 3;

  const { data: limits, error: limitsErr } = await supabase
    .from('format_card_limits')
    .select('card_id, max_qty')
    .eq('format_id', formatId);

  if (limitsErr) {
    return createError('INTERNAL_ERROR', 'Error al cargar limites del formato', requestId);
  }

  return createSuccess({
    format_id: formatId,
    deck_size: deckSize,
    default_card_limit: defaultCardLimit,
    items: limits ?? [],
  });
});
