import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { getCardById } from '@/lib/services/cards.service';

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

  // Catalog detail is presented inside /catalog via a Sheet to preserve search + filters UX.
  // Keep this route for backwards compatibility.
  redirect(`/catalog?card=${encodeURIComponent(cardId)}`);
}
