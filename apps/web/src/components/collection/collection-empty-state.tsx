'use client';

import { EmptyState } from '@/components/feedback';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionEmptyStateProps {
  onAddCards?: () => void;
}

export function CollectionEmptyState({ onAddCards }: CollectionEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="Colección vacía"
      description="Aún no has agregado cartas a tu colección. Empieza a construir tu inventario agregando las cartas que posees."
    >
      {onAddCards && (
        <Button onClick={onAddCards} size="lg" className="mt-4">
          Agregar primera carta
        </Button>
      )}
    </EmptyState>
  );
}
