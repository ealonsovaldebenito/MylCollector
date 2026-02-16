'use client';

import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddButtonProps {
  cardPrintingId: string;
  isInCollection?: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export function QuickAddButton({
  cardPrintingId: _cardPrintingId,
  isInCollection = false,
  onClick,
  disabled = false,
  size = 'sm',
  variant = 'secondary',
  className,
}: QuickAddButtonProps) {
  return (
    <Button
      variant={isInCollection ? 'outline' : variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        isInCollection && 'border-green-500/50 text-green-600 dark:text-green-400',
        className,
      )}
      title={isInCollection ? 'Ya está en tu colección' : 'Agregar a colección'}
    >
      {isInCollection ? (
        <>
          <Check className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">En colección</span>}
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Agregar</span>}
        </>
      )}
    </Button>
  );
}
