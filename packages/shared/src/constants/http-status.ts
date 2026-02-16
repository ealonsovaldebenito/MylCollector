import type { ErrorCode } from './error-codes.js';

/**
 * Mapeo ErrorCode -> HTTP status code (doc 99, sección 6.2).
 */
export const ErrorCodeToHttpStatus: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  NOT_AUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  IMPORT_AMBIGUOUS: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};
