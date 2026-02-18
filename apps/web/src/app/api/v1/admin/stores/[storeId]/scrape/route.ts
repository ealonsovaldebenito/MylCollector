/**
 * Store scraping API — trigger manual scrape and view job history.
 * POST /api/v1/admin/stores/:storeId/scrape — trigger + execute scrape
 * GET  /api/v1/admin/stores/:storeId/scrape — get job history
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 *   2026-02-16 — POST now triggers AND executes the scrape job
 */

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess, createError } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { triggerScrape, executeScrapeJob, getScrapeJobs } from '@/lib/services/scraping.service';
import { triggerScrapeSchema } from '@myl/shared';

export const POST = withApiHandler(async (request, { params, requestId }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return createError('NOT_AUTHENTICATED', 'Autenticación requerida', requestId);

  // Require admin role
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return createError('FORBIDDEN', 'Solo administradores pueden lanzar scrapes', requestId);
  }

  const body = await request.json();
  const parsed = triggerScrapeSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos inválidos', { issues: parsed.error.issues });
  }

  // 1. Create the scrape job
  const triggerResult = await triggerScrape(adminClient, params.storeId!, parsed.data);

  // 2. Execute the scrape job (fetch pages + extract prices)
  const execResult = await executeScrapeJob(adminClient, triggerResult.job.scrape_job_id);

  return createSuccess({
    job: triggerResult.job,
    execution: execResult,
  });
});

export const GET = withApiHandler(async (_request, { params, requestId }) => {
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
    return createError('FORBIDDEN', 'Solo administradores pueden ver scrapes', requestId);
  }

  const jobs = await getScrapeJobs(adminClient, params.storeId!);
  return createSuccess({ items: jobs });
});
