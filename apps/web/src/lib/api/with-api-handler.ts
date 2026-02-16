import type { NextRequest, NextResponse } from 'next/server';
import { createError } from './response';
import { AppError } from './errors';
import { logger } from '../logger';

type RouteContext = { params: Promise<Record<string, string>> };

type ApiHandlerFn = (
  request: NextRequest,
  context: { params: Record<string, string>; requestId: string },
) => Promise<NextResponse>;

/**
 * Wrapper para API routes que provee:
 * - Extracción de request_id (doc 12)
 * - Logging estructurado (route, method, status, duration_ms)
 * - Manejo de errores estándar (AppError -> response, unknown -> 500)
 */
export function withApiHandler(handler: ApiHandlerFn) {
  return async (request: NextRequest, routeContext: RouteContext): Promise<NextResponse> => {
    const requestId = request.headers.get('x-request-id') ?? 'unknown';
    const start = performance.now();
    const params = await routeContext.params;

    try {
      const response = await handler(request, { params, requestId });
      const duration = Math.round(performance.now() - start);

      logger.info({
        request_id: requestId,
        method: request.method,
        route: request.nextUrl.pathname,
        status: response.status,
        duration_ms: duration,
      });

      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - start);

      if (error instanceof AppError) {
        logger.warn({
          request_id: requestId,
          method: request.method,
          route: request.nextUrl.pathname,
          error_code: error.code,
          error_message: error.message,
          duration_ms: duration,
        });
        return createError(error.code, error.message, requestId, error.details);
      }

      logger.error({
        request_id: requestId,
        method: request.method,
        route: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
      });

      return createError('INTERNAL_ERROR', 'Error interno del servidor', requestId);
    }
  };
}
