import type { Metadata } from 'next';
import { CatalogContainer } from '@/components/catalog/catalog-container';

export const metadata: Metadata = {
  title: 'Catalogo de Cartas | MYL',
  description: 'Explora el catalogo completo de cartas MYL con filtros avanzados.',
};

export default function CatalogPage() {
  return (
    <div className="-m-6 h-[calc(100vh-3.5rem)]">
      <CatalogContainer />
    </div>
  );
}
