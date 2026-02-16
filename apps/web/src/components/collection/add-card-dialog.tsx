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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CardCondition } from '@myl/shared';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardPrintingId?: string;
  cardName?: string;
  onAdd: (data: {
    card_printing_id: string;
    qty: number;
    condition: CardCondition;
    notes?: string;
  }) => Promise<void>;
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

export function AddCardDialog({
  open,
  onOpenChange,
  cardPrintingId,
  cardName,
  onAdd,
}: AddCardDialogProps) {
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState<CardCondition>('NEAR_MINT');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!cardPrintingId) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        card_printing_id: cardPrintingId,
        qty,
        condition,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
      // Reset form
      setQty(1);
      setCondition('NEAR_MINT');
      setNotes('');
    } catch (error) {
      console.error('Error adding to collection:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar a Colección</DialogTitle>
          <DialogDescription>
            {cardName ? `Agregando "${cardName}" a tu colección` : 'Agrega esta carta a tu colección personal'}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !cardPrintingId}>
            {isSubmitting ? 'Agregando...' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
