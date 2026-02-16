import { NextResponse } from 'next/server';
import type { ApiSuccess, ApiErrorResponse, ErrorCode } from '@myl/shared';
import { ErrorCodeToHttpStatus } from '@myl/shared';

/**
 * Response helpers para API routes (doc 11).
 * Garantizan shape estándar: { ok: true, data } o { ok: false, error }.
 */

export function createSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true as const, data }, { status });
}

export function createError(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: Record<string, unknown>,
): NextResponse<ApiErrorResponse> {
  const status = ErrorCodeToHttpStatus[code] ?? 500;
  return NextResponse.json(
    {
      ok: false as const,
      error: { code, message, details, request_id: requestId },
    },
    { status },
  );
}
