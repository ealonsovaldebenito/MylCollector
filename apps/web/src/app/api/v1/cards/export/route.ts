import { NextResponse } from 'next/server';
import { cardFiltersSchema } from '@myl/shared';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { exportCardsToCSV } from '@/lib/services/csv.service';

export const GET = withApiHandler(async (request, { requestId }) => {
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return createError('NOT_AUTHENTICATED', 'Autenticacion requerida', requestId);
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const filters = cardFiltersSchema.partial().parse(params);

  const csv = await exportCardsToCSV(supabase, filters);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="myl-cartas-${Date.now()}.csv"`,
      'X-Request-Id': requestId,
    },
  });
});
