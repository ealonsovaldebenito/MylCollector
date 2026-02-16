import type { Metadata } from 'next';
import { CollectionContainer } from '@/components/collection/collection-container';

export const metadata: Metadata = {
  title: 'Mi Colección | MYL',
  description: 'Gestiona tu colección personal de cartas MYL.',
};

export default function CollectionPage() {
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <CollectionContainer />
    </div>
  );
}
