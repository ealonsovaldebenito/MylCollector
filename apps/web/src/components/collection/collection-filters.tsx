'use client';

import type { Block, Edition, CardType, Race, RarityTier, CardCondition } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FilterX, Layers, BookOpen, Zap, Users, Gem, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollectionFilterValues {
  q?: string;
  block_id?: string;
  edition_id?: string;
  card_type_id?: string;
  race_id?: string;
  rarity_tier_id?: string;
  condition?: CardCondition;
  min_qty?: number;
  sort?: 'name_asc' | 'name_desc' | 'qty_asc' | 'qty_desc' | 'acquired_asc' | 'acquired_desc' | 'cost_asc' | 'cost_desc';
}

interface CollectionFiltersProps {
  filters: CollectionFilterValues;
  onChange: (filters: CollectionFilterValues) => void;
  blocks: Block[];
  editions: Edition[];
  cardTypes: CardType[];
  races: Race[];
  rarities: RarityTier[];
  className?: string;
}

const CONDITION_OPTIONS: { value: CardCondition; label: string }[] = [
  { value: 'MINT', label: 'Mint' },
  { value: 'NEAR_MINT', label: 'Near Mint' },
  { value: 'EXCELLENT', label: 'Excelente' },
  { value: 'GOOD', label: 'Buena' },
  { value: 'LIGHT_PLAYED', label: 'Poco Jugada' },
  { value: 'PLAYED', label: 'Jugada' },
  { value: 'POOR', label: 'Pobre' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nombre A-Z' },
  { value: 'name_desc', label: 'Nombre Z-A' },
  { value: 'qty_asc', label: 'Cantidad (menor)' },
  { value: 'qty_desc', label: 'Cantidad (mayor)' },
  { value: 'acquired_asc', label: 'Adquirido (antiguo)' },
  { value: 'acquired_desc', label: 'Adquirido (reciente)' },
  { value: 'cost_asc', label: 'Costo (menor)' },
  { value: 'cost_desc', label: 'Costo (mayor)' },
];

export function CollectionFilters({
  filters,
  onChange,
  blocks,
  editions,
  cardTypes,
  races,
  rarities,
  className,
}: CollectionFiltersProps) {
  const filteredEditions = filters.block_id
    ? editions.filter((e) => e.block_id === filters.block_id)
    : editions;

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  function update(key: keyof CollectionFilterValues, value: string | undefined) {
    const next = { ...filters };
    if (!value || value === '__all__') {
      delete next[key];
    } else if (key === 'min_qty') {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        next[key] = num;
      } else {
        delete next[key];
      }
    } else if (key === 'condition') {
      next[key] = value as CardCondition;
    } else {
      (next as Record<string, string>)[key] = value;
    }

    // Clear edition if block changes
    if (key === 'block_id') {
      delete next.edition_id;
    }

    onChange(next);
  }

  function clearAll() {
    onChange({});
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
            <FilterX className="mr-1 h-3 w-3" />
            Limpiar
          </Button>
        )}
      </div>

      <Separator />

      {/* Search */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Buscar</Label>
        <Input
          placeholder="Nombre de carta..."
          value={filters.q ?? ''}
          onChange={(e) => update('q', e.target.value)}
          className="h-9"
        />
      </div>

      <Separator />

      {/* Sorting */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <Layers className="h-3.5 w-3.5" />
          Ordenar por
        </Label>
        <Select value={filters.sort ?? 'name_asc'} onValueChange={(v) => update('sort', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Block */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <BookOpen className="h-3.5 w-3.5" />
          Bloque
        </Label>
        <Select value={filters.block_id ?? '__all__'} onValueChange={(v) => update('block_id', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todos los bloques" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los bloques</SelectItem>
            {blocks.map((b) => (
              <SelectItem key={b.block_id} value={b.block_id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Edition */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <BookOpen className="h-3.5 w-3.5" />
          Edición
        </Label>
        <Select
          value={filters.edition_id ?? '__all__'}
          onValueChange={(v) => update('edition_id', v)}
          disabled={!filters.block_id}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todas las ediciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las ediciones</SelectItem>
            {filteredEditions.map((e) => (
              <SelectItem key={e.edition_id} value={e.edition_id}>
                {editionDisplayName(e.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Card Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <Zap className="h-3.5 w-3.5" />
          Tipo
        </Label>
        <Select value={filters.card_type_id ?? '__all__'} onValueChange={(v) => update('card_type_id', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            {cardTypes.map((t) => (
              <SelectItem key={t.card_type_id} value={t.card_type_id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Race */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <Users className="h-3.5 w-3.5" />
          Raza
        </Label>
        <Select value={filters.race_id ?? '__all__'} onValueChange={(v) => update('race_id', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todas las razas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las razas</SelectItem>
            {races.map((r) => (
              <SelectItem key={r.race_id} value={r.race_id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rarity */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <Gem className="h-3.5 w-3.5" />
          Rareza
        </Label>
        <Select value={filters.rarity_tier_id ?? '__all__'} onValueChange={(v) => update('rarity_tier_id', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todas las rarezas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las rarezas</SelectItem>
            {rarities.map((r) => (
              <SelectItem key={r.rarity_tier_id} value={r.rarity_tier_id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Condition */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium">
          <FileCheck className="h-3.5 w-3.5" />
          Condición
        </Label>
        <Select value={filters.condition ?? '__all__'} onValueChange={(v) => update('condition', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Todas las condiciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las condiciones</SelectItem>
            {CONDITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Min quantity */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Cantidad mínima</Label>
        <Input
          type="number"
          min="1"
          placeholder="1"
          value={filters.min_qty ?? ''}
          onChange={(e) => update('min_qty', e.target.value)}
          className="h-9"
        />
      </div>

      {/* Active filters summary */}
      {hasFilters && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-medium">Filtros activos</Label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || key === 'sort') return null;
                let label = String(value);
                if (key === 'block_id') {
                  label = blocks.find((b) => b.block_id === value)?.name ?? label;
                } else if (key === 'edition_id') {
                  label = editionDisplayName(editions.find((e) => e.edition_id === value)?.name ?? label);
                } else if (key === 'card_type_id') {
                  label = cardTypes.find((t) => t.card_type_id === value)?.name ?? label;
                } else if (key === 'race_id') {
                  label = races.find((r) => r.race_id === value)?.name ?? label;
                } else if (key === 'rarity_tier_id') {
                  label = rarities.find((r) => r.rarity_tier_id === value)?.name ?? label;
                } else if (key === 'condition') {
                  label = CONDITION_OPTIONS.find((c) => c.value === value)?.label ?? label;
                }
                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
