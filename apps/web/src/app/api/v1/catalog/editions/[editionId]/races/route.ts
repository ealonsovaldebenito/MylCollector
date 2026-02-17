/**
 * GET /api/v1/catalog/editions/[editionId]/races
 * Returns the list of race_id that appear in cards printed in the edition.
 *
 * Note: races are only present on Ally cards; other cards have race_id null.
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

export const GET = withApiHandler(async (_request, { params }) => {
  const { editionId } = await params;
  if (!editionId) throw new AppError('VALIDATION_ERROR', 'editionId es requerido');

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('card_printings')
    .select('card:cards(race_id)')
    .eq('edition_id', editionId)
    .limit(5000);

  if (error) throw new AppError('INTERNAL_ERROR', 'Error al cargar razas disponibles');

  const set = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ card: { race_id: string | null } | null }>) {
    const rid = row.card?.race_id ?? null;
    if (rid) set.add(rid);
  }

  return createSuccess({ items: Array.from(set) });
});

