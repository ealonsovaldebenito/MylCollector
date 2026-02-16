import { z } from 'zod';

/**
 * Schema de query params para paginación cursor-based (doc 11).
 * limit: default 50, max 200.
 * cursor: opaque string opcional.
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
