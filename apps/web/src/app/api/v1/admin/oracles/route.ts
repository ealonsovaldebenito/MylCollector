/**
 * Admin oracles API — list source documents or oracles by source, create oracle entries.
 * GET  /api/v1/admin/oracles           — List distinct source documents
 * GET  /api/v1/admin/oracles?source=X  — List oracles for a specific source document
 * POST /api/v1/admin/oracles           — Create a new oracle entry
 *
 * Changelog:
 *   2026-02-16 — Initial creation, added ?source filter
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import {
  getOracleSourceDocuments,
  getOraclesBySource,
  createCardOracle,
} from '@/lib/services/oracles.service';
import { createCardOracleSchema } from '@myl/shared';

export const GET = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const url = new URL(request.url);
  const source = url.searchParams.get('source');

  if (source) {
    const oracles = await getOraclesBySource(supabase, source);
    return createSuccess({ items: oracles });
  }

  const docs = await getOracleSourceDocuments(supabase);
  return createSuccess({ items: docs });
});

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const body = await request.json();
  const parsed = createCardOracleSchema.safeParse(body);
  if (!parsed.success) {
    return createError('VALIDATION_ERROR', 'Datos inválidos', requestId, parsed.error.flatten());
  }

  const oracle = await createCardOracle(supabase, user.id, parsed.data);
  return createSuccess(oracle, 201);
});
