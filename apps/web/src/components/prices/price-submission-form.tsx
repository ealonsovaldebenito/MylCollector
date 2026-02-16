'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubmitPrice } from '@/hooks/use-prices';
import type { SubmitPrice } from '@myl/shared';

interface PriceSubmissionFormProps {
  cardPrintingId: string;
  currencyId: string; // Default currency (USD)
  onSuccess?: () => void;
}

export function PriceSubmissionForm({ cardPrintingId, currencyId, onSuccess }: PriceSubmissionFormProps) {
  const [price, setPrice] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const { submitPrice, isSubmitting, error: submitError } = useSubmitPrice(() => {
    // Reset form on success
    setPrice('');
    setEvidenceUrl('');
    setLocalError(null);
    onSuccess?.();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setLocalError('El precio debe ser un número positivo');
      return;
    }

    if (evidenceUrl && !isValidUrl(evidenceUrl)) {
      setLocalError('La URL de evidencia no es válida');
      return;
    }

    const data: SubmitPrice = {
      card_printing_id: cardPrintingId,
      suggested_price: priceNum,
      currency_id: currencyId,
      evidence_url: evidenceUrl || undefined,
    };

    try {
      await submitPrice(data);
    } catch {
      // Error is handled by the hook
    }
  };

  const error = localError || submitError;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar precio comunitario</CardTitle>
        <CardDescription>
          Ayuda a la comunidad compartiendo el precio actual de esta carta. Puedes enviar un nuevo precio cada 15 minutos.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Precio (USD) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evidence">URL de evidencia (opcional)</Label>
            <Input
              id="evidence"
              type="url"
              placeholder="https://ejemplo.com/..."
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Enlace a tienda online, marketplace, o captura de pantalla
            </p>
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Enviando...' : 'Enviar precio'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
