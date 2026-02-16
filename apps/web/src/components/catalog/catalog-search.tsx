'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CatalogSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CatalogSearch({ value, onChange, className }: CatalogSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar cartas por nombre..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
