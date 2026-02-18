/**
 * Printing store links API — reverse lookup for /admin/stores.
 * GET  /api/v1/admin/printings/:printingId/store-links
 * POST /api/v1/admin/printings/:printingId/store-links
 *
 * Persists to store_printing_links (same table as /admin/stores).
 */

import { z } from 'zod';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createStorePrintingLink, getStoresForPrinting } from '@/lib/services/stores.service';

const createPrintingStoreLinkSchema = z.object({
  store_id: z.string().uuid(),
  product_url: z.string().url().min(1),
  product_name: z.string().max(500).optional().nullable(),
});

export const GET = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  // Admin check (user_profiles.role) and use service role to bypass RLS
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden gestionar tiendas', requestId);
  }

  const printingId = params.printingId!;
  const items = await getStoresForPrinting(adminClient, printingId);
  return createSuccess({ items });
});

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const printingId = params.printingId!;
  const body = await request.json();
  const parsed = createPrintingStoreLinkSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  const link = await createStorePrintingLink(adminClient, parsed.data.store_id, {
    card_printing_id: printingId,
    product_url: parsed.data.product_url,
    product_name: parsed.data.product_name ?? null,
  });

  return createSuccess(link);
});
