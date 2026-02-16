import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';

type Client = SupabaseClient<Database>;

/**
 * Storage service — upload/delete card images via Supabase Storage.
 * Bucket: card-images (public read, admin write).
 * Doc reference: 03_DATA_MODEL_SQL.md
 */

const BUCKET = 'card-images';

/**
 * Upload a card image to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadCardImage(
  supabase: Client,
  file: File,
  cardPrintingId: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'webp';
  const path = `printings/${cardPrintingId}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a card image from Supabase Storage.
 */
export async function deleteCardImage(supabase: Client, cardPrintingId: string) {
  // Try common extensions
  const extensions = ['webp', 'png', 'jpg', 'jpeg'];
  const paths = extensions.map((ext) => `printings/${cardPrintingId}.${ext}`);

  await supabase.storage.from(BUCKET).remove(paths);
}

/**
 * Build the public URL for a card image.
 * Useful for constructing URLs without a Supabase query.
 */
export function getCardImageUrl(cardPrintingId: string, ext = 'webp'): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/printings/${cardPrintingId}.${ext}`;
}
