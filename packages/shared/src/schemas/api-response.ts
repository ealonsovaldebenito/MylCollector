import { z } from 'zod';

/**
 * Schemas Zod para validar responses de la API (doc 11).
 */

export const apiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    request_id: z.string(),
  }),
});

export function apiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    ok: z.literal(true),
    data: dataSchema,
  });
}

export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return apiSuccessSchema(
    z.object({
      items: z.array(itemSchema),
      next_cursor: z.string().nullable(),
    }),
  );
}
