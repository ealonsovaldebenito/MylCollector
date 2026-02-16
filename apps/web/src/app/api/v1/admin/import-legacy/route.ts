import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { importLegacyCards } from '@/lib/services/import-legacy-cards.service';
import { AppError } from '@/lib/api/errors';

/**
 * POST /api/v1/admin/import-legacy
 * Import cards from legacy JSON format
 * Requires admin role
 */
export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Solo administradores pueden importar cartas');
  }

  // Parse request body
  const body = await request.json();

  if (!body.cards || !Array.isArray(body.cards)) {
    throw new AppError('VALIDATION_ERROR', 'Se requiere un array de cartas');
  }

  // Import cards
  const result = await importLegacyCards(supabase, body.cards);

  return createSuccess({
    ...result,
    message: `Importación completa: ${result.imported} cartas importadas, ${result.skipped} omitidas`,
  });
});
