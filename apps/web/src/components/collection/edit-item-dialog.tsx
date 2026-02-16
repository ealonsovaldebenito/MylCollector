'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CardCondition, UserCardWithRelations } from '@myl/shared';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UserCardWithRelations | null;
  onUpdate: (data: {
    qty?: number;
    condition?: CardCondition;
    notes?: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const CONDITION_OPTIONS: { value: CardCondition; label: string }[] = [
  { value: 'MINT', label: 'Mint (M)' },
  { value: 'NEAR_MINT', label: 'Near Mint (NM)' },
  { value: 'EXCELLENT', label: 'Excelente (EX)' },
  { value: 'GOOD', label: 'Buena (GD)' },
  { value: 'LIGHT_PLAYED', label: 'Poco Jugada (LP)' },
  { value: 'PLAYED', label: 'Jugada (PL)' },
  { value: 'POOR', label: 'Pobre (PR)' },
];

export function EditItemDialog({
  open,
  onOpenChange,
  item,
  onUpdate,
  onDelete,
}: EditItemDialogProps) {
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState<CardCondition>('NEAR_MINT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setQty(item.qty);
      setCondition(item.condition);
      setNotes(item.notes ?? '');
    }
  }, [item]);

  async function handleUpdate() {
    if (!item) return;

    setIsSubmitting(true);
    try {
      await onUpdate({
        qty,
        condition,
        notes: notes.trim() || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!item || !onDelete) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${item.card_printing.card.name}" de tu colección?`,
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
          <DialogDescription>
            Editando "{item.card_printing.card.name}" en tu colección
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="qty">Cantidad</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condición</Label>
            <Select value={condition} onValueChange={(v) => setCondition(v as CardCondition)}>
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ej: Comprada en torneo, firmada, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="sm:mr-auto"
            >
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
