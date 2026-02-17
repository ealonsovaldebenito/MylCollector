/**
 * CollectionContainer — Orquestador principal de Mi Colección.
 * Incluye sidebar de carpetas, filtros, grid de cartas y stats.
 *
 * Changelog:
 *   2026-02-17 — Rediseño: multi-carpeta, valor estimado, layout mejorado
 *   2026-02-18 — Fix: condiciones dinámicas desde BD
 *   2026-02-18 — Feat: sort client-side por nombre/costo, mover a carpeta, precio en tile
 */

'use client';

import { useState, useMemo } from 'react';
import { CollectionGrid } from './collection-grid';
import { CollectionFilters, type CollectionFilterValues } from './collection-filters';
import { CollectionStatsPanel } from './collection-stats-panel';
import { CollectionSidebar } from './collection-sidebar';
import { CollectionFolderDialog } from './collection-folder-dialog';
import { MoveCardDialog } from './move-card-dialog';
import { AddCardDialog } from './add-card-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Plus, BarChart3, FolderOpen } from 'lucide-react';
import { useCatalogData } from '@/hooks/use-catalog-data';
import {
  useCollection,
  useCollectionStats,
  useAddToCollection,
  useUpdateCollectionItem,
  useRemoveFromCollection,
} from '@/hooks/use-collection';
import {
  useCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  useMoveCards,
} from '@/hooks/use-collections';
import type { CardCondition, UserCardWithRelations, UserCollection } from '@myl/shared';

/**
 * Client-side sort for nested relation fields (name, cost)
 * that Supabase PostgREST cannot ORDER BY.
 */
function sortItemsClientSide(
  items: UserCardWithRelations[],
  sort: string | undefined,
): UserCardWithRelations[] {
  if (!sort) return items;

  const sorted = [...items];
  switch (sort) {
    case 'name_asc':
      sorted.sort((a, b) =>
        a.card_printing.card.name.localeCompare(b.card_printing.card.name, 'es'),
      );
      break;
    case 'name_desc':
      sorted.sort((a, b) =>
        b.card_printing.card.name.localeCompare(a.card_printing.card.name, 'es'),
      );
      break;
    case 'cost_asc':
      sorted.sort(
        (a, b) => (a.card_printing.card.cost ?? 999) - (b.card_printing.card.cost ?? 999),
      );
      break;
    case 'cost_desc':
      sorted.sort(
        (a, b) => (b.card_printing.card.cost ?? -1) - (a.card_printing.card.cost ?? -1),
      );
      break;
    default:
      // qty_*, acquired_* are handled server-side
      break;
  }
  return sorted;
}

export function CollectionContainer() {
  const [filters, setFilters] = useState<CollectionFilterValues>({});
  const [editingItem, setEditingItem] = useState<UserCardWithRelations | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFolders, setShowFolders] = useState(false);

  // Folder state
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<UserCollection | null>(null);

  // Move card state
  const [movingItem, setMovingItem] = useState<UserCardWithRelations | null>(null);

  // Fetch catalog data for filters
  const { blocks, editions, cardTypes, races, rarities, conditions } = useCatalogData();

  // Collection folders
  const { collections, isLoading: collectionsLoading, mutate: mutateCollections } = useCollections();
  const { create: createFolder, isLoading: isCreating } = useCreateCollection();
  const { update: updateFolder, isLoading: isFolderUpdating } = useUpdateCollection();
  const { remove: deleteFolder } = useDeleteCollection();
  const { move: moveCards } = useMoveCards();

  // Compute collection_id filter for API
  const collectionFilter = useMemo(() => {
    if (selectedCollectionId === null) return undefined; // all
    if (selectedCollectionId === 'general') return null; // no folder (NULL in DB)
    return selectedCollectionId;
  }, [selectedCollectionId]);

  // Fetch collection items and stats
  const { items: rawItems, isLoading, mutate } = useCollection({
    ...filters,
    ...(collectionFilter !== undefined ? { collection_id: collectionFilter } : {}),
  } as CollectionFilterValues & { collection_id?: string | null });
  const { stats, isLoading: statsLoading, mutate: mutateStats } = useCollectionStats();

  // Client-side sort for name/cost (Supabase can't order by nested relations)
  const items = useMemo(
    () => sortItemsClientSide(rawItems, filters.sort),
    [rawItems, filters.sort],
  );

  // Mutations
  const { addToCollection } = useAddToCollection();
  const { updateItem } = useUpdateCollectionItem();
  const { removeFromCollection } = useRemoveFromCollection();

  // Card counts for sidebar
  const totalCardCount = useMemo(() => {
    return collections.reduce((sum, c) => sum + c.card_count, 0) + (stats?.total_cards ?? 0);
  }, [collections, stats]);

  const generalCardCount = useMemo(() => {
    const folderTotal = collections.reduce((sum, c) => sum + c.card_count, 0);
    return Math.max(0, (stats?.total_cards ?? 0) - folderTotal);
  }, [collections, stats]);

  // Selected folder name for header
  const selectedFolderName = useMemo(() => {
    if (selectedCollectionId === null) return 'Todas las cartas';
    if (selectedCollectionId === 'general') return 'General';
    return collections.find((c) => c.collection_id === selectedCollectionId)?.name ?? 'Colección';
  }, [selectedCollectionId, collections]);

  async function handleAdd(data: {
    card_printing_id: string;
    qty: number;
    condition: CardCondition;
    notes?: string;
    user_price?: number | null;
    is_for_sale?: boolean;
    collection_id?: string | null;
  }) {
    await addToCollection(data);
    await mutate();
    await mutateStats();
    await mutateCollections();
  }

  async function handleUpdate(updates: {
    qty?: number;
    condition?: CardCondition;
    notes?: string | null;
    user_price?: number | null;
    is_for_sale?: boolean;
  }) {
    if (!editingItem) return;
    await updateItem({ userCardId: editingItem.user_card_id, updates });
    await mutate();
    await mutateStats();
    await mutateCollections();
  }

  async function handleDelete() {
    if (!editingItem) return;
    await removeFromCollection({ userCardId: editingItem.user_card_id });
    await mutate();
    await mutateStats();
    await mutateCollections();
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

  // Move card to folder
  async function handleMoveCard(targetCollectionId: string | null) {
    if (!movingItem) return;
    await moveCards([movingItem.user_card_id], targetCollectionId);
    setMovingItem(null);
    await mutate();
    await mutateCollections();
    await mutateStats();
  }

  // Folder handlers
  function handleNewFolder() {
    setEditingFolder(null);
    setFolderDialogOpen(true);
  }

  function handleEditFolder(col: UserCollection) {
    setEditingFolder(col);
    setFolderDialogOpen(true);
  }

  async function handleDeleteFolder(col: UserCollection) {
    if (!confirm(`¿Eliminar la carpeta "${col.name}"? Las cartas se moverán a General.`)) return;
    await deleteFolder(col.collection_id);
    if (selectedCollectionId === col.collection_id) setSelectedCollectionId(null);
    await mutateCollections();
    await mutate();
  }

  async function handleSaveFolder(data: { name: string; description?: string; color?: string }) {
    if (editingFolder) {
      await updateFolder(editingFolder.collection_id, data);
    } else {
      await createFolder(data);
    }
    await mutateCollections();
    setFolderDialogOpen(false);
  }

  return (
    <div className="flex h-full">
      {/* Folders sidebar (desktop) */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-border/30 bg-surface-1/50 backdrop-blur-sm">
        <CollectionSidebar
          collections={collections}
          isLoading={collectionsLoading}
          selectedId={selectedCollectionId}
          onSelect={setSelectedCollectionId}
          onCreateNew={handleNewFolder}
          onEdit={handleEditFolder}
          onDelete={handleDeleteFolder}
          generalCardCount={generalCardCount}
          totalCardCount={stats?.total_cards ?? 0}
        />
      </aside>

      {/* Filters sidebar (desktop) */}
      <aside className="hidden xl:block w-56 border-r border-border/30 bg-surface-1/30 overflow-y-auto">
        <div className="p-4">
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
        <div className="p-5 lg:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{selectedFolderName}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isLoading ? 'Cargando...' : `${items.length} carta${items.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Folders toggle (mobile) */}
              <Sheet open={showFolders} onOpenChange={setShowFolders}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
                  <CollectionSidebar
                    collections={collections}
                    isLoading={collectionsLoading}
                    selectedId={selectedCollectionId}
                    onSelect={(id) => {
                      setSelectedCollectionId(id);
                      setShowFolders(false);
                    }}
                    onCreateNew={handleNewFolder}
                    onEdit={handleEditFolder}
                    onDelete={handleDeleteFolder}
                    generalCardCount={generalCardCount}
                    totalCardCount={stats?.total_cards ?? 0}
                  />
                </SheetContent>
              </Sheet>

              {/* Stats (mobile) */}
              <Button
                variant="outline"
                size="sm"
                className="xl:hidden"
                onClick={() => setShowStats(!showStats)}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>

              {/* Filters (mobile) */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="xl:hidden">
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

              {/* Add card */}
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Agregar carta</span>
              </Button>
            </div>
          </div>

          {/* Stats panel (mobile) */}
          {showStats && (
            <div className="xl:hidden">
              <CollectionStatsPanel stats={stats} isLoading={statsLoading} items={items as Array<Record<string, unknown>>} />
            </div>
          )}

          {/* Grid */}
          <CollectionGrid
            items={items}
            isLoading={isLoading}
            onEdit={setEditingItem}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onMove={setMovingItem}
            gridSize="large"
          />
        </div>
      </main>

      {/* Stats sidebar (desktop) */}
      <aside className="hidden 2xl:block w-96 border-l border-border/30 bg-surface-1/30 overflow-y-auto">
        <div className="p-6">
          <CollectionStatsPanel stats={stats} isLoading={statsLoading} items={items as Array<Record<string, unknown>>} />
        </div>
      </aside>

      {/* Dialogs */}
      <AddCardDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        conditions={conditions}
        collectionId={collectionFilter}
        onAdd={handleAdd}
      />

      <EditItemDialog
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        conditions={conditions}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <CollectionFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        collection={editingFolder}
        onSave={handleSaveFolder}
        isLoading={isCreating || isFolderUpdating}
      />

      <MoveCardDialog
        open={movingItem !== null}
        onOpenChange={(open) => !open && setMovingItem(null)}
        cardName={movingItem?.card_printing.card.name ?? ''}
        collections={collections}
        onMove={handleMoveCard}
      />
    </div>
  );
}
