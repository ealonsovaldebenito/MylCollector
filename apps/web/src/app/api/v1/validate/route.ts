import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { liveValidateSchema, validateDeck } from '@myl/shared';
import { getFormatConfig } from '@/lib/services/formats.service';
import { resolveCardsForValidation } from '@/lib/services/decks.service';

/**
 * Live validation endpoint — validates in memory without persisting.
 * Used by the builder for real-time feedback.
 */
export const POST = withApiHandler(async (request, { requestId: _requestId }) => {
  const supabase = await createClient();

  const body = await request.json();
  const parsed = liveValidateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', { issues: parsed.error.issues });
  }

  const { format_id, cards } = parsed.data;

  // If no cards, return quick empty validation
  if (cards.length === 0) {
    const config = await getFormatConfig(supabase, format_id);
    const result = validateDeck(config, []);
    return createSuccess(result);
  }

  // Resolve card data and validate
  const [config, entries] = await Promise.all([
    getFormatConfig(supabase, format_id),
    resolveCardsForValidation(supabase, cards),
  ]);

  const result = validateDeck(config, entries);
  return createSuccess(result);
});
