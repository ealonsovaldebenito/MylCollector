import { z } from 'zod';

import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';

const aggregateTagsSchema = z.object({
  cards: z
    .array(
      z.object({
        card_id: z.string().uuid(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(200),
});

export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();
  const body = await request.json();
  const parsed = aggregateTagsSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Datos invalidos', { issues: parsed.error.issues });
  }

  const qtyByCardId = new Map<string, number>();
  for (const c of parsed.data.cards) {
    qtyByCardId.set(c.card_id, (qtyByCardId.get(c.card_id) ?? 0) + c.qty);
  }

  const cardIds = [...qtyByCardId.keys()];

  const { data, error } = await supabase
    .from('card_tags')
    .select('card_id, tag:tags!inner(tag_id, name, slug)')
    .in('card_id', cardIds);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al agregar tags');
  }

  const agg = new Map<string, { tag_id: string; name: string; slug: string; score: number; cards: number }>();

  type TagJoinRow = { card_id: string; tag: { tag_id: string; name: string; slug: string } };
  for (const row of (data ?? []) as TagJoinRow[]) {
    const cardId = row.card_id as string;
    const qty = qtyByCardId.get(cardId) ?? 1;
    const tag = row.tag;
    const existing = agg.get(tag.tag_id);
    if (existing) {
      existing.score += qty;
      existing.cards += 1;
    } else {
      agg.set(tag.tag_id, { tag_id: tag.tag_id, name: tag.name, slug: tag.slug, score: qty, cards: 1 });
    }
  }

  const items = [...agg.values()].sort((a, b) => b.score - a.score);
  return createSuccess({ items });
});
