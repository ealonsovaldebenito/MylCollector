/**
 * POST /api/v1/cards/[cardId]/printings/[printingId]/image
 * Uploads/replaces a printing image (admin only).
 *
 * Changelog:
 *   2026-02-18 - Fix: use service-role client for storage + DB update and enforce card ownership.
 */
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadCardImage } from '@/lib/services/storage.service';
import { updateCardPrinting } from '@/lib/services/cards.service';

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const printingId = params.printingId!;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden modificar imagenes', requestId);
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

  const imageUrl = await uploadCardImage(adminClient, file, printingId);

  // Update the printing's image_url
  await updateCardPrinting(adminClient, printingId, { image_url: imageUrl }, { cardId: params.cardId! });

  return createSuccess({ image_url: imageUrl });
});
