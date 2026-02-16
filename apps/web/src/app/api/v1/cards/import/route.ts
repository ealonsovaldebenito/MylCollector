import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { importCardsFromCSV } from '@/lib/services/csv.service';

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return createError('VALIDATION_ERROR', 'Se requiere un archivo CSV', requestId);
  }

  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    return createError('VALIDATION_ERROR', 'El archivo debe ser CSV', requestId);
  }

  const content = await file.text();

  if (!content.trim()) {
    return createError('VALIDATION_ERROR', 'El archivo CSV esta vacio', requestId);
  }

  const result = await importCardsFromCSV(supabase, content);
  return createSuccess(result);
});
