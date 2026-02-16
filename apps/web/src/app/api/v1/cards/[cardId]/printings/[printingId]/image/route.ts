import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { uploadCardImage } from '@/lib/services/storage.service';
import { updateCardPrinting } from '@/lib/services/cards.service';

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const printingId = params.printingId!;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    throw new AppError('VALIDATION_ERROR', 'Se requiere un archivo de imagen');
  }

  // Validate file type
  const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new AppError('VALIDATION_ERROR', 'Tipo de archivo no soportado. Usa WebP, PNG o JPEG.');
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new AppError('VALIDATION_ERROR', 'El archivo excede el limite de 5MB');
  }

  const imageUrl = await uploadCardImage(supabase, file, printingId);

  // Update the printing's image_url
  await updateCardPrinting(supabase, printingId, { image_url: imageUrl });

  return createSuccess({ image_url: imageUrl });
});
