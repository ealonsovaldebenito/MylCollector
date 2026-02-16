import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getCardById } from '@/lib/services/cards.service';
import { CardDetailPage } from '@/components/catalog/card-detail-page';

interface Props {
  params: Promise<{ cardId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cardId } = await params;
  const supabase = await createClient();

  try {
    const card = await getCardById(supabase, cardId);
    const firstPrinting = card.printings[0];
    const description = card.text
      ? `${card.card_type.name}${card.race ? ` · ${card.race.name}` : ''} — ${card.text.slice(0, 120)}`
      : `${card.card_type.name}${card.race ? ` · ${card.race.name}` : ''} del catalogo MYL`;

    return {
      title: `${card.name} | MYL`,
      description,
      openGraph: {
        title: card.name,
        description,
        images: firstPrinting?.image_url ? [firstPrinting.image_url] : [],
      },
    };
  } catch {
    return { title: 'Carta no encontrada | MYL' };
  }
}

export default async function CardDetailRoute({ params }: Props) {
  const { cardId } = await params;
  const supabase = await createClient();

  let card;
  try {
    card = await getCardById(supabase, cardId);
  } catch {
    notFound();
  }

  // Fetch similar cards (same card type + race, max 8)
  let similarCards: typeof card[] = [];
  try {
    let query = supabase
      .from('cards')
      .select(
        `
        card_id,
        name,
        name_normalized,
        card_type_id,
        race_id,
        ally_strength,
        cost,
        is_unique,
        has_ability,
        can_be_starting_gold,
        text,
        flavor_text,
        card_type:card_types!inner(card_type_id, name, code, sort_order),
        race:races(race_id, name, code, sort_order)
      `,
      )
      .eq('card_type_id', card.card_type.card_type_id)
      .neq('card_id', card.card_id)
      .limit(8);

    if (card.race) {
      query = query.eq('race_id', card.race.race_id);
    }

    const { data: similarData } = await query;

    if (similarData) {
      // Fetch first printing image for each similar card
      const cardIds = similarData.map((c: Record<string, unknown>) => c.card_id as string);
      const { data: printings } = await supabase
        .from('card_printings')
        .select('card_id, image_url')
        .in('card_id', cardIds)
        .order('card_printing_id');

      const imageMap = new Map<string, string>();
      if (printings) {
        for (const p of printings) {
          if (p.image_url && !imageMap.has(p.card_id)) {
            imageMap.set(p.card_id, p.image_url);
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      similarCards = similarData.map((c: any) => ({
        ...c,
        tags: [],
        printings: imageMap.has(c.card_id)
          ? [{ card_printing_id: '', card_id: c.card_id, edition_id: '', rarity_tier_id: null, image_url: imageMap.get(c.card_id)!, illustrator: null, collector_number: null, legal_status: 'LEGAL', printing_variant: 'standard', edition: { edition_id: '', block_id: '', name: '', code: '', release_date: null, sort_order: 0 }, rarity_tier: null, price_consensus: null }]
          : [],
      }));
    }
  } catch {
    // Similar cards are non-critical, silently ignore errors
  }

  return <CardDetailPage card={card} similarCards={similarCards} />;
}
