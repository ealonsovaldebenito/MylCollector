import { ulid } from 'ulid';

/**
 * Genera un request_id con formato req_<ulid> (doc 12).
 * Se propaga a logs, audit_log y header X-Request-Id.
 */
export function generateRequestId(): string {
  return `req_${ulid()}`;
}
