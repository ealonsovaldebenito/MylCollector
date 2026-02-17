/**
 * CollectionSidebar — Lista de carpetas de colección con stats.
 *
 * Changelog:
 *   2026-02-17 — Creación inicial
 */

'use client';

import { FolderOpen, Library, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UserCollection } from '@myl/shared';

interface CollectionSidebarProps {
  collections: UserCollection[];
  isLoading: boolean;
  selectedId: string | null; // null = "Todas", 'general' = sin carpeta
  onSelect: (id: string | null) => void;
  onCreateNew: () => void;
  onEdit: (collection: UserCollection) => void;
  onDelete: (collection: UserCollection) => void;
  generalCardCount: number;
  totalCardCount: number;
}

export function CollectionSidebar({
  collections,
  isLoading,
  selectedId,
  onSelect,
  onCreateNew,
  onEdit,
  onDelete,
  generalCardCount,
  totalCardCount,
}: CollectionSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <h2 className="text-sm font-semibold">Carpetas</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateNew}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {/* "All" virtual folder */}
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                selectedId === null
                  ? 'bg-primary/10 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              )}
            >
              <Library className={cn('h-4 w-4 shrink-0', selectedId === null && 'text-primary')} />
              <span className="flex-1 text-left">Todas</span>
              <span className="text-[11px] text-muted-foreground">{totalCardCount}</span>
            </button>

            {/* "General" (no folder) virtual folder */}
            <button
              type="button"
              onClick={() => onSelect('general')}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                selectedId === 'general'
                  ? 'bg-primary/10 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              )}
            >
              <FolderOpen className={cn('h-4 w-4 shrink-0', selectedId === 'general' && 'text-primary')} />
              <span className="flex-1 text-left">General</span>
              <span className="text-[11px] text-muted-foreground">{generalCardCount}</span>
            </button>

            {/* User collections */}
            {collections.map((col) => (
              <div
                key={col.collection_id}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                  selectedId === col.collection_id
                    ? 'bg-primary/10 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(col.collection_id)}
                  className="flex flex-1 items-center gap-2.5 text-left"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="flex-1 truncate">{col.name}</span>
                  <span className="text-[11px] text-muted-foreground">{col.card_count}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-6 w-6 shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary/50"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => onEdit(col)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(col)} className="text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
