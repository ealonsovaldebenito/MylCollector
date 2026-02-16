import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';

export const GET = withApiHandler(async (_request, { requestId }) => {
  return createSuccess({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    request_id: requestId,
  });
});
