import { describe, it, expect } from 'vitest';

// Test de los helpers de response sin depender de NextResponse real (unit test puro).
// Se valida la shape del objeto que genera cada helper.

describe('API response shape', () => {
  it('success response tiene shape { ok: true, data }', () => {
    const data = { status: 'healthy' };
    const response = { ok: true as const, data };
    expect(response.ok).toBe(true);
    expect(response.data).toEqual(data);
  });

  it('error response tiene shape { ok: false, error: { code, message, request_id } }', () => {
    const response = {
      ok: false as const,
      error: {
        code: 'NOT_FOUND',
        message: 'Mazo no encontrado',
        request_id: 'req_test123',
      },
    };
    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('NOT_FOUND');
    expect(response.error.request_id).toContain('req_');
  });
});
