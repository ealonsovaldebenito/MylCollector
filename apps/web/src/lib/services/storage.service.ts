import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';

type Client = SupabaseClient<Database>;

/**
 * Storage service — upload/delete card images via Supabase Storage.
 * Bucket: card-images (public read, admin write).
 * Doc reference: 03_DATA_MODEL_SQL.md
 */

const BUCKET = 'card-images';

function resolveAbsoluteUrl(value: string, baseUrl?: string): string | null {
  try {
    if (baseUrl) return new URL(value, baseUrl).toString();
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function detectFileExt(contentType: string | null, imageUrl: string): string {
  const fromType = (contentType ?? '')
    .toLowerCase()
    .split(';')[0] ?? ''
    .replace('image/', '')
    .trim();

  const fromPath = (() => {
    try {
      const pathname = new URL(imageUrl).pathname;
      const ext = pathname.split('.').pop()?.toLowerCase() ?? '';
      return ext;
    } catch {
      return '';
    }
  })();

  const valid = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
  if (valid.has(fromType)) return fromType;
  if (valid.has(fromPath)) return fromPath;
  return 'jpg';
}

/**
 * Returns true when the URL points to our Supabase public bucket for card images.
 */
export function isManagedCardImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/card-images/');
}

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

/**
 * Convenience: fetch an external image URL and upload it to Storage for a printing.
 * Returns the public URL or null if fetch/upload fails (non-fatal for callers).
 */
export async function uploadCardImageFromUrl(
  supabase: Client,
  imageUrl: string,
  cardPrintingId: string,
  options?: { base_url?: string | null },
): Promise<string | null> {
  try {
    const resolvedUrl = resolveAbsoluteUrl(imageUrl, options?.base_url ?? undefined);
    if (!resolvedUrl) return null;

    const parsed = new URL(resolvedUrl);
    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (scraper-image-fetch)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: `${parsed.protocol}//${parsed.host}/`,
        Origin: `${parsed.protocol}//${parsed.host}`,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.toLowerCase().startsWith('image/')) return null;

    const ext = detectFileExt(contentType, resolvedUrl);
    const path = `printings/${cardPrintingId}.${ext}`;

    const buffer = await response.arrayBuffer();
    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType,
    });
    if (error) return null;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
