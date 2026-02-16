'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CardFilters } from '@myl/shared';
import { useCatalogData } from '@/hooks/use-catalog-data';
import { useCards } from '@/hooks/use-cards';
import { CatalogSearch } from './catalog-search';
import { CatalogFilters, type FilterValues } from './catalog-filters';
import { CatalogGrid } from './catalog-grid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X, Grid3x3, LayoutGrid } from 'lucide-react';

export function CatalogContainer() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [showFilters, setShowFilters] = useState(true);
  const [gridSize, setGridSize] = useState<'normal' | 'large'>('large');

  const catalogData = useCatalogData();

  const filters: Partial<CardFilters> = useMemo(
    () => ({
      q: searchQuery || undefined,
      ...filterValues,
      limit: 50,
    }),
    [searchQuery, filterValues],
  );

  const { cards, isLoading, hasMore, loadMore } = useCards(filters);

  function clearAllFilters() {
    setSearchQuery('');
    setFilterValues({});
  }

  const hasActiveFilters = searchQuery || Object.keys(filterValues).length > 0;
  const activeFilterCount = Object.values(filterValues).filter(Boolean).length;

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar con búsqueda y controles */}
      <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 space-y-3">
          {/* Búsqueda principal */}
          <div className="flex items-center gap-2">
            <CatalogSearch value={searchQuery} onChange={setSearchQuery} className="flex-1" />

            {/* Controles de vista */}
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <Button
                variant={gridSize === 'normal' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setGridSize('normal')}
                title="Vista compacta"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={gridSize === 'large' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setGridSize('large')}
                title="Vista grande"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Toggle filtros */}
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              title="Filtros"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Active filters badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtros activos:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Búsqueda: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAllFilters}>
                  <X className="mr-1 h-3 w-3" />
                  Limpiar todo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel de filtros lateral */}
        {showFilters && (
          <aside className="w-72 flex-shrink-0 border-r border-border overflow-y-auto">
            <div className="p-4">
              <CatalogFilters
                filters={filterValues}
                onChange={setFilterValues}
                blocks={catalogData.blocks}
                editions={catalogData.editions}
                cardTypes={catalogData.cardTypes}
                races={catalogData.races}
                rarities={catalogData.rarities}
                tags={catalogData.tags}
              />
            </div>
          </aside>
        )}

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Contador de resultados */}
            {!isLoading && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando <span className="font-semibold text-foreground">{cards.length}</span> de{' '}
                  <span className="font-semibold text-foreground">{cards.length}</span> cartas
                </p>
              </div>
            )}

            {/* Grid de cartas */}
            <CatalogGrid
              cards={cards}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onCardClick={(cardId) => router.push(`/catalog/${cardId}`)}
              gridSize={gridSize}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
