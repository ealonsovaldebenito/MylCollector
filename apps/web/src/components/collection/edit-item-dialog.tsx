/**
 * EditItemDialog — Diálogo para editar un item de la colección.
 * Permite cambiar cantidad, condición, precio propio, estado de venta y notas.
 *
 * Changelog:
 *   2026-02-17 — Creación inicial
 *   2026-02-18 — Fix: condiciones dinámicas desde BD
 *   2026-02-18 — Feat: precio usuario, toggle en venta
 */

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
import { Switch } from '@/components/ui/switch';
import type { CardCondition, CardConditionRef, UserCardWithRelations } from '@myl/shared';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: UserCardWithRelations | null;
  /** Conditions from DB */
  conditions?: CardConditionRef[];
  onUpdate: (data: {
    qty?: number;
    condition?: CardCondition;
    notes?: string | null;
    user_price?: number | null;
    is_for_sale?: boolean;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

/** Fallback si no se cargan condiciones de la BD */
const FALLBACK_CONDITIONS: CardConditionRef[] = [
  { condition_id: '', code: 'PERFECTA', name: 'Perfecta (9-10)', sort_order: 10 },
  { condition_id: '', code: 'CASI PERFECTA', name: 'Casi Perfecta (8)', sort_order: 9 },
  { condition_id: '', code: 'EXCELENTE', name: 'Excelente (7)', sort_order: 8 },
  { condition_id: '', code: 'BUENA', name: 'Buena (6)', sort_order: 6 },
  { condition_id: '', code: 'POCO USO', name: 'Poco Jugada (5)', sort_order: 5 },
  { condition_id: '', code: 'JUGADA', name: 'Jugada (4)', sort_order: 3 },
  { condition_id: '', code: 'MALAS CONDICIONES', name: 'Pobre (1-3)', sort_order: 1 },
];

export function EditItemDialog({
  open,
  onOpenChange,
  item,
  conditions: conditionsProp,
  onUpdate,
  onDelete,
}: EditItemDialogProps) {
  const conditionOptions = conditionsProp && conditionsProp.length > 0
    ? conditionsProp
    : FALLBACK_CONDITIONS;

  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState<CardCondition>('PERFECTA');
  const [notes, setNotes] = useState('');
  const [userPrice, setUserPrice] = useState('');
  const [isForSale, setIsForSale] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setQty(item.qty);
      setCondition(item.condition);
      setNotes(item.notes ?? '');
      const price = (item as Record<string, unknown>).user_price as number | null | undefined;
      setUserPrice(price != null ? String(price) : '');
      setIsForSale(((item as Record<string, unknown>).is_for_sale as boolean) ?? false);
    }
  }, [item]);

  async function handleUpdate() {
    if (!item) return;

    setIsSubmitting(true);
    try {
      const parsedPrice = userPrice ? parseFloat(userPrice) : null;
      await onUpdate({
        qty,
        condition,
        notes: notes.trim() || null,
        user_price: parsedPrice && parsedPrice > 0 ? parsedPrice : null,
        is_for_sale: isForSale,
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
            Editando &quot;{item.card_printing.card.name}&quot; en tu colección
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quantity + Condition row */}
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="condition">Condición</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as CardCondition)}>
                <SelectTrigger id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditionOptions.map((opt) => (
                    <SelectItem key={opt.code} value={opt.code}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="edit-price">Mi precio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="100"
                placeholder="Ej: 5000"
                value={userPrice}
                onChange={(e) => setUserPrice(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tu precio para esta carta. Déjalo vacío si no quieres asignar precio.
            </p>
          </div>

          {/* For sale toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border/30 p-3">
            <div>
              <Label htmlFor="edit-for-sale" className="text-sm font-medium">En venta</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Marcar como disponible para vender
              </p>
            </div>
            <Switch
              id="edit-for-sale"
              checked={isForSale}
              onCheckedChange={setIsForSale}
            />
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
