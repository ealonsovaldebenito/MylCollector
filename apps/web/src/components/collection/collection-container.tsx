'use client';

import { useState } from 'react';
import { CollectionGrid } from './collection-grid';
import { CollectionFilters, type CollectionFilterValues } from './collection-filters';
import { CollectionStatsPanel } from './collection-stats-panel';
import { AddCardDialog } from './add-card-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Plus, BarChart3 } from 'lucide-react';
import { useCatalogData } from '@/hooks/use-catalog-data';
import {
  useCollection,
  useCollectionStats,
  useAddToCollection,
  useUpdateCollectionItem,
  useRemoveFromCollection,
} from '@/hooks/use-collection';
import type { UserCardWithRelations } from '@myl/shared';
import { cn } from '@/lib/utils';

export function CollectionContainer() {
  const [filters, setFilters] = useState<CollectionFilterValues>({});
  const [editingItem, setEditingItem] = useState<UserCardWithRelations | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Fetch catalog data for filters
  const { blocks, editions, cardTypes, races, rarities } = useCatalogData();

  // Fetch collection and stats
  const { items, isLoading, mutate } = useCollection(filters);
  const { stats, isLoading: statsLoading, mutate: mutateStats } = useCollectionStats();

  // Mutations
  const { addToCollection, isAdding } = useAddToCollection();
  const { updateItem, isUpdating } = useUpdateCollectionItem();
  const { removeFromCollection, isRemoving } = useRemoveFromCollection();

  async function handleAdd(data: {
    card_printing_id: string;
    qty: number;
    condition: 'MINT' | 'NEAR_MINT' | 'EXCELLENT' | 'GOOD' | 'LIGHT_PLAYED' | 'PLAYED' | 'POOR';
    notes?: string;
  }) {
    await addToCollection(data);
    await mutate();
    await mutateStats();
  }

  async function handleUpdate(updates: {
    qty?: number;
    condition?: 'MINT' | 'NEAR_MINT' | 'EXCELLENT' | 'GOOD' | 'LIGHT_PLAYED' | 'PLAYED' | 'POOR';
    notes?: string | null;
  }) {
    if (!editingItem) return;
    await updateItem({ userCardId: editingItem.user_card_id, updates });
    await mutate();
    await mutateStats();
  }

  async function handleDelete() {
    if (!editingItem) return;
    await removeFromCollection({ userCardId: editingItem.user_card_id });
    await mutate();
    await mutateStats();
  }

  async function handleIncrement(item: UserCardWithRelations) {
    await updateItem({ userCardId: item.user_card_id, updates: { qty: item.qty + 1 } });
    await mutate();
    await mutateStats();
  }

  async function handleDecrement(item: UserCardWithRelations) {
    if (item.qty <= 1) return;
    await updateItem({ userCardId: item.user_card_id, updates: { qty: item.qty - 1 } });
    await mutate();
    await mutateStats();
  }

  return (
    <div className="flex h-full">
      {/* Filters sidebar (desktop) */}
      <aside className="hidden lg:block w-64 border-r border-border bg-muted/30 overflow-y-auto">
        <div className="p-6">
          <CollectionFilters
            filters={filters}
            onChange={setFilters}
            blocks={blocks}
            editions={editions}
            cardTypes={cardTypes}
            races={races}
            rarities={rarities}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Mi Colección</h1>
              <p className="text-muted-foreground mt-1">
                {items.length} {items.length === 1 ? 'carta' : 'cartas'} en tu inventario
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Stats button (mobile) */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>

              {/* Filters button (mobile) */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <CollectionFilters
                      filters={filters}
                      onChange={setFilters}
                      blocks={blocks}
                      editions={editions}
                      cardTypes={cardTypes}
                      races={races}
                      rarities={rarities}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Add card button */}
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar carta
              </Button>
            </div>
          </div>

          {/* Stats panel (mobile) */}
          {showStats && (
            <div className="lg:hidden">
              <CollectionStatsPanel stats={stats} isLoading={statsLoading} />
            </div>
          )}

          {/* Grid */}
          <CollectionGrid
            items={items}
            isLoading={isLoading}
            onEdit={setEditingItem}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            gridSize="large"
          />
        </div>
      </main>

      {/* Stats sidebar (desktop) */}
      <aside className="hidden xl:block w-80 border-l border-border bg-muted/30 overflow-y-auto">
        <div className="p-6">
          <CollectionStatsPanel stats={stats} isLoading={statsLoading} />
        </div>
      </aside>

      {/* Dialogs */}
      <AddCardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAdd}
      />

      <EditItemDialog
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
