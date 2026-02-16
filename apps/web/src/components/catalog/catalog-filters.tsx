'use client';

import type { Block, Edition, CardType, Race, RarityTier, LegalStatus, Tag } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FilterX, Layers, BookOpen, Zap, Users, Gem, Shield, Coins, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterValues {
  block_id?: string;
  edition_id?: string;
  card_type_id?: string;
  race_id?: string;
  rarity_tier_id?: string;
  legal_status?: LegalStatus;
  cost_min?: number;
  cost_max?: number;
  tag_slug?: string;
}

interface CatalogFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  blocks: Block[];
  editions: Edition[];
  cardTypes: CardType[];
  races: Race[];
  rarities: RarityTier[];
  tags: Tag[];
  className?: string;
}

const LEGAL_OPTIONS = [
  { value: 'LEGAL', label: 'Legal' },
  { value: 'RESTRICTED', label: 'Restringida' },
  { value: 'BANNED', label: 'Prohibida' },
  { value: 'DISCONTINUED', label: 'Discontinuada' },
];

export function CatalogFilters({
  filters,
  onChange,
  blocks,
  editions,
  cardTypes,
  races,
  rarities,
  tags,
  className,
}: CatalogFiltersProps) {
  const filteredEditions = filters.block_id
    ? editions.filter((e) => e.block_id === filters.block_id)
    : editions;

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  function update(key: keyof FilterValues, value: string | undefined) {
    const next = { ...filters };
    if (!value || value === '__all__') {
      delete next[key];
    } else if (key === 'cost_min' || key === 'cost_max') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        next[key] = num;
      } else {
        delete next[key];
      }
    } else if (key === 'legal_status') {
      next[key] = value as LegalStatus;
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

      {/* Colección */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Colección
          </h4>
        </div>

        <div className="space-y-2.5">
          {/* Block */}
          <div className="space-y-1.5">
            <Label className="text-xs">Bloque</Label>
            <Select value={filters.block_id ?? '__all__'} onValueChange={(v) => update('block_id', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todos" />
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
          <div className="space-y-1.5">
            <Label className="text-xs">Edición</Label>
            <Select value={filters.edition_id ?? '__all__'} onValueChange={(v) => update('edition_id', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todas" />
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

          {/* Rarity */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Gem className="h-3 w-3 text-muted-foreground" />
              Rareza
            </Label>
            <Select value={filters.rarity_tier_id ?? '__all__'} onValueChange={(v) => update('rarity_tier_id', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todas" />
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
        </div>
      </div>

      <Separator />

      {/* Características */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Características
          </h4>
        </div>

        <div className="space-y-2.5">
          {/* Card Type */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-muted-foreground" />
              Tipo
            </Label>
            <Select value={filters.card_type_id ?? '__all__'} onValueChange={(v) => update('card_type_id', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los tipos</SelectItem>
                {cardTypes.map((ct) => (
                  <SelectItem key={ct.card_type_id} value={ct.card_type_id}>
                    {ct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Race */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              Raza
            </Label>
            <Select value={filters.race_id ?? '__all__'} onValueChange={(v) => update('race_id', v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Todas" />
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

          {/* Cost range */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Coins className="h-3 w-3 text-muted-foreground" />
              Coste
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={filters.cost_min ?? ''}
                onChange={(e) => update('cost_min', e.target.value || undefined)}
                className="h-9 text-xs"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={filters.cost_max ?? ''}
                onChange={(e) => update('cost_max', e.target.value || undefined)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Legalidad */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Legalidad
          </h4>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Estado legal</Label>
          <Select value={filters.legal_status ?? '__all__'} onValueChange={(v) => update('legal_status', v)}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              {LEGAL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mecánicas / Tags */}
      {tags.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mecanicas
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag.tag_id}
                  variant={filters.tag_slug === tag.slug ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer text-xs transition-colors',
                    filters.tag_slug === tag.slug
                      ? 'bg-accent text-accent-foreground hover:bg-accent/80'
                      : 'hover:bg-accent/10 hover:border-accent/30',
                  )}
                  onClick={() =>
                    update('tag_slug', filters.tag_slug === tag.slug ? undefined : tag.slug)
                  }
                >
                  #{tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
