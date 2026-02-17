/**
 * Card ban status API — public endpoint to get format restrictions for a card.
 * GET /api/v1/cards/:cardId/ban-status — List format limits for a card
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const cardId = params.cardId;

  if (!cardId) return createError('VALIDATION_ERROR', 'cardId requerido', requestId);

  const { data, error } = await supabase
    .from('format_card_limits')
    .select(`
      format_card_limit_id, format_id, card_id, max_qty, notes,
      format:formats!inner(format_id, name, code)
    `)
    .eq('card_id', cardId);

  if (error) {
    return createError('INTERNAL_ERROR', 'Error al cargar restricciones', requestId);
  }

  interface LimitRow {
    format_id: string;
    max_qty: number;
    notes: string | null;
    format: { format_id: string; name: string; code: string };
  }

  const items = ((data ?? []) as unknown as LimitRow[]).map((row) => ({
    format_id: row.format_id,
    format_name: row.format.name,
    max_qty: row.max_qty,
    notes: row.notes,
  }));

  return createSuccess({ items });
});
