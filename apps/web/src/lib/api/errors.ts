import { type ErrorCode } from '@myl/shared';

/**
 * Error de aplicación tipado que mapea a respuestas API estándar (doc 99, sec 6).
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
