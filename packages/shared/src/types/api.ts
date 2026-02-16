/**
 * Tipos canónicos de respuesta API (doc 11).
 *
 * Shape success: { ok: true, data: T }
 * Shape error:   { ok: false, error: { code, message, details?, request_id } }
 */

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;

export interface PaginatedData<T> {
  items: T[];
  next_cursor: string | null;
}

export type PaginatedResponse<T> = ApiSuccess<PaginatedData<T>>;
