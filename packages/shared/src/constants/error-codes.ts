/**
 * Error codes estándar para la API (doc 99, sección 6.2).
 * Cada código mapea a un HTTP status en http-status.ts.
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  IMPORT_AMBIGUOUS: 'IMPORT_AMBIGUOUS',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
