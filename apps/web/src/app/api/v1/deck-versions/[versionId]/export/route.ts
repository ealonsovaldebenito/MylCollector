import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/api/with-api-handler';
import { createClient } from '@/lib/supabase/server';
import { exportFormatSchema } from '@myl/shared';
import { exportDeckVersion, auditExport } from '@/lib/services/export-import.service';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (request, { params, requestId }) => {
  const { versionId } = await params;
  if (!versionId) throw new AppError('VALIDATION_ERROR', 'Version ID is required');

  const url = new URL(request.url);
  const formatParam = url.searchParams.get('format') || 'txt';

  // Validate format
  const formatResult = exportFormatSchema.safeParse(formatParam);
  if (!formatResult.success) {
    throw new AppError('VALIDATION_ERROR', 'Formato de exportación inválido', {
      errors: formatResult.error.errors,
    });
  }

  const format = formatResult.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify user owns this deck version or it's public
  const { data: version, error: versionError } = await supabase
    .from('deck_versions')
    .select(
      `
      deck_version_id,
      deck:decks!inner (
        deck_id,
        user_id,
        visibility
      )
    `,
    )
    .eq('deck_version_id', versionId)
    .single();

  if (versionError || !version) {
    throw new AppError('NOT_FOUND', 'Versión de mazo no encontrada');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deck = (version as any).deck;
  const isOwner = user && deck.user_id === user.id;
  const isPublic = deck.visibility === 'PUBLIC' || deck.visibility === 'UNLISTED';

  if (!isOwner && !isPublic) {
    throw new AppError('FORBIDDEN', 'No tienes permiso para exportar este mazo');
  }

  // Export the deck
  const { content, mimeType, filename } = await exportDeckVersion(supabase, versionId, format);

  // Audit log if user is authenticated
  if (user) {
    await auditExport(supabase, user.id, versionId, format, requestId);
  }

  // Return file as NextResponse
  return new NextResponse(content, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Request-Id': requestId,
    },
  });
});
