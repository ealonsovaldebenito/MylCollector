import type { Metadata } from 'next';

import { MyDecksDashboard } from '@/components/decks/my-decks-dashboard';

export const metadata: Metadata = {
  title: 'Mis Mazos | MYL',
  description: 'Visualiza y gestiona tus mazos con estadísticas rápidas.',
};

export default function DecksPage() {
  return <MyDecksDashboard />;
}

