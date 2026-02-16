import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { apiErrorSchema, apiSuccessSchema, paginatedSchema } from '../api-response.js';

describe('apiErrorSchema', () => {
  it('valida un error response correcto', () => {
    const input = {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El mazo debe tener 50 cartas',
        request_id: 'req_abc123',
      },
    };
    expect(apiErrorSchema.parse(input)).toEqual(input);
  });

  it('rechaza un response sin error.code', () => {
    const input = {
      ok: false,
      error: { message: 'fail', request_id: 'req_abc' },
    };
    expect(() => apiErrorSchema.parse(input)).toThrow();
  });

  it('acepta details opcionales', () => {
    const input = {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Mazo no encontrado',
        details: { deck_id: '123' },
        request_id: 'req_xyz',
      },
    };
    expect(apiErrorSchema.parse(input)).toEqual(input);
  });
});

describe('apiSuccessSchema', () => {
  it('valida un success response con data tipada', () => {
    const schema = apiSuccessSchema(z.object({ id: z.string() }));
    const input = { ok: true, data: { id: 'abc' } };
    expect(schema.parse(input)).toEqual(input);
  });

  it('rechaza ok: false', () => {
    const schema = apiSuccessSchema(z.object({ id: z.string() }));
    const input = { ok: false, data: { id: 'abc' } };
    expect(() => schema.parse(input)).toThrow();
  });
});

describe('paginatedSchema', () => {
  it('valida un response paginado', () => {
    const schema = paginatedSchema(z.object({ name: z.string() }));
    const input = {
      ok: true,
      data: {
        items: [{ name: 'Oro Basico' }, { name: 'Sombra Nocturna' }],
        next_cursor: 'cursor_abc',
      },
    };
    expect(schema.parse(input)).toEqual(input);
  });

  it('acepta next_cursor null (ultima pagina)', () => {
    const schema = paginatedSchema(z.object({ name: z.string() }));
    const input = {
      ok: true,
      data: { items: [], next_cursor: null },
    };
    expect(schema.parse(input)).toEqual(input);
  });
});
