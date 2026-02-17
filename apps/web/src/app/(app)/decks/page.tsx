import type { Metadata } from 'next';

import { MyDecksDashboard } from '@/components/decks/my-decks-dashboard';

export const metadata: Metadata = {
  title: 'Mis Mazos | MYL',
  description: 'Visualiza y gestiona tus mazos con estadísticas rápidas.',
};

export default function DecksPage() {
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <MyDecksDashboard />
    </div>
  );
}

