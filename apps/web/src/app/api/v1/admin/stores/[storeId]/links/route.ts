/**
 * Store printing links API — manage which printings are linked to a store.
 * GET  /api/v1/admin/stores/:storeId/links
 * POST /api/v1/admin/stores/:storeId/links
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStorePrintingLinks, createStorePrintingLink } from '@/lib/services/stores.service';
import { createStorePrintingLinkSchema } from '@myl/shared';
import { z } from 'zod';

const createStorePrintingLinkAdminSchema = createStorePrintingLinkSchema.extend({
  scraped_image_url: z.string().url().optional().nullable(),
});

export const GET = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden gestionar tiendas', requestId);
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  const result = await getStorePrintingLinks(adminClient, params.storeId!, { limit, offset });
  return createSuccess(result);
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden gestionar tiendas', requestId);
  }

  const body = await request.json();
  const parsed = createStorePrintingLinkAdminSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  const link = await createStorePrintingLink(
    adminClient,
    params.storeId!,
    {
      card_printing_id: parsed.data.card_printing_id,
      product_url: parsed.data.product_url,
      product_name: parsed.data.product_name ?? null,
    },
    { scraped_image_url: parsed.data.scraped_image_url ?? null },
  );
  return createSuccess(link);
});

