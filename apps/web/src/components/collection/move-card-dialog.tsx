/**
 * MoveCardDialog — Diálogo para mover una carta entre carpetas de colección.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderOpen, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserCollection } from '@myl/shared';

interface MoveCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardName: string;
  collections: UserCollection[];
  onMove: (targetCollectionId: string | null) => Promise<void>;
}

export function MoveCardDialog({
  open,
  onOpenChange,
  cardName,
  collections,
  onMove,
}: MoveCardDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  async function handleMove() {
    setIsMoving(true);
    try {
      await onMove(selected);
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving card:', error);
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mover carta</DialogTitle>
          <DialogDescription>
            Selecciona la carpeta destino para &quot;{cardName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 py-2 max-h-[300px] overflow-y-auto">
          {/* General (no folder) */}
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
              selected === null
                ? 'bg-primary/10 text-foreground font-medium ring-1 ring-primary/30'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
            )}
          >
            <Library className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">General</span>
          </button>

          {/* User folders */}
          {collections.map((col) => (
            <button
              key={col.collection_id}
              type="button"
              onClick={() => setSelected(col.collection_id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors',
                selected === col.collection_id
                  ? 'bg-primary/10 text-foreground font-medium ring-1 ring-primary/30'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              )}
            >
              <div
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: col.color }}
              />
              <span className="flex-1 text-left truncate">{col.name}</span>
              <span className="text-[11px] text-muted-foreground">{col.card_count}</span>
            </button>
          ))}

          {collections.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tienes carpetas. Crea una desde el sidebar.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMoving}>
            Cancelar
          </Button>
          <Button onClick={handleMove} disabled={isMoving}>
            {isMoving ? 'Moviendo...' : 'Mover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
