/**
 * POST /api/v1/admin/stores/bulk/import
 *
 * Imports validated bulk links into store_printing_links.
 * - Skips duplicates safely.
 * - Never replaces printing image when one already exists.
 *
 * Context:
 * - Used by "Scrapping Masivo" tab for 10-by-10 validation batches.
 *
 * Changelog:
 * - 2026-02-18 - Initial endpoint for bulk association import.
 * - 2026-02-18 - Added safe image policy (do not replace existing printing image).
 * - 2026-02-18 - Duplicate links can still trigger single-link scrape when run_scrape=true.
 */

import { z } from 'zod';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createError, createSuccess } from '@/lib/api/response';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/api/errors';
import { createStorePrintingLink } from '@/lib/services/stores.service';
import { executeScrapeJob, triggerScrape } from '@/lib/services/scraping.service';

const itemSchema = z.object({
  candidate_id: z.string().min(1).max(100).optional(),
  store_id: z.string().uuid(),
  card_printing_id: z.string().uuid(),
  product_url: z.string().url(),
  product_name: z.string().max(500).optional().nullable(),
  scraped_image_url: z.string().url().optional().nullable(),
});

const payloadSchema = z.object({
  items: z.array(itemSchema).min(1).max(150),
  run_scrape: z.boolean().optional().default(false),
});

type ImportStatus = 'created' | 'skipped_duplicate' | 'error';

interface ImportItemResult {
  candidate_id: string | null;
  store_id: string;
  product_url: string;
  status: ImportStatus;
  store_printing_link_id: string | null;
  message: string | null;
}

export const POST = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    return createError('FORBIDDEN', 'Solo administradores pueden importar links masivos', requestId);
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return createError('VALIDATION_ERROR', 'Payload invalido para import masivo', requestId, {
      issues: parsed.error.issues,
    });
  }

  const createdLinks: Array<{ store_id: string; store_printing_link_id: string }> = [];
  const results: ImportItemResult[] = [];

  for (const item of parsed.data.items) {
    try {
      let scrapedImageToUse: string | null = item.scraped_image_url ?? null;

      if (scrapedImageToUse) {
        const { data: printing } = await adminClient
          .from('card_printings')
          .select('image_url')
          .eq('card_printing_id', item.card_printing_id)
          .maybeSingle();

        // User rule: if printing already has image, do not replace.
        if (printing?.image_url && printing.image_url.trim().length > 0) {
          scrapedImageToUse = null;
        }
      }

      const created = await createStorePrintingLink(
        adminClient,
        item.store_id,
        {
          card_printing_id: item.card_printing_id,
          product_url: item.product_url,
          product_name: item.product_name ?? null,
        },
        {
          scraped_image_url: scrapedImageToUse,
        },
      );

      results.push({
        candidate_id: item.candidate_id ?? null,
        store_id: item.store_id,
        product_url: item.product_url,
        status: 'created',
        store_printing_link_id: created.store_printing_link_id,
        message: null,
      });

      createdLinks.push({
        store_id: item.store_id,
        store_printing_link_id: created.store_printing_link_id,
      });
    } catch (error) {
      if (error instanceof AppError && error.code === 'VALIDATION_ERROR') {
        const message = error.message.toLowerCase();
        const isDuplicate = message.includes('ya existe') || message.includes('ya esta');

        if (isDuplicate) {
          const existingLinkId = typeof error.details?.existing_link_id === 'string'
            ? error.details.existing_link_id
            : null;
          results.push({
            candidate_id: item.candidate_id ?? null,
            store_id: item.store_id,
            product_url: item.product_url,
            status: 'skipped_duplicate',
            store_printing_link_id: existingLinkId,
            message: error.message,
          });
          if (existingLinkId) {
            createdLinks.push({
              store_id: item.store_id,
              store_printing_link_id: existingLinkId,
            });
          }
          continue;
        }
      }

      results.push({
        candidate_id: item.candidate_id ?? null,
        store_id: item.store_id,
        product_url: item.product_url,
        status: 'error',
        store_printing_link_id: null,
        message: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  const scrapeExecution: Array<{ store_id: string; success: number; failed: number; total: number }> = [];

  if (parsed.data.run_scrape && createdLinks.length > 0) {
    for (const created of createdLinks) {
      try {
        const trigger = await triggerScrape(adminClient, created.store_id, {
          scope: 'single',
          store_printing_link_id: created.store_printing_link_id,
        });
        const exec = await executeScrapeJob(adminClient, trigger.job.scrape_job_id, {
          scope: 'single',
          store_printing_link_id: created.store_printing_link_id,
        });
        scrapeExecution.push({
          store_id: created.store_id,
          success: exec.success,
          failed: exec.failed,
          total: exec.total,
        });
      } catch {
        // scrape is optional; import result should still succeed
      }
    }
  }

  const createdCount = results.filter((r) => r.status === 'created').length;
  const duplicateCount = results.filter((r) => r.status === 'skipped_duplicate').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  return createSuccess({
    summary: {
      total: results.length,
      created: createdCount,
      duplicates: duplicateCount,
      errors: errorCount,
      scraped: scrapeExecution.length,
    },
    results,
    scrape: scrapeExecution,
  });
});

