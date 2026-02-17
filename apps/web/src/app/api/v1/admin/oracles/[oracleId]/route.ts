/**
 * Admin oracle detail API — update/delete individual oracle entries.
 * PUT    /api/v1/admin/oracles/:oracleId — Update oracle
 * DELETE /api/v1/admin/oracles/:oracleId — Delete oracle
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { updateCardOracle, deleteCardOracle } from '@/lib/services/oracles.service';
import { updateCardOracleSchema } from '@myl/shared';

export const PUT = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const oracleId = params.oracleId!;

  const body = await request.json();
  const parsed = updateCardOracleSchema.safeParse(body);
  if (!parsed.success) {
    return createError('VALIDATION_ERROR', 'Datos inválidos', requestId, parsed.error.flatten());
  }

  const updated = await updateCardOracle(supabase, oracleId, parsed.data);
  return createSuccess(updated);
});

export const DELETE = withApiHandler(async (_request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  const oracleId = params.oracleId!;

  await deleteCardOracle(supabase, oracleId);
  return createSuccess({ deleted: true });
});
