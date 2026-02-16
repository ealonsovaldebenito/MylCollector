'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Edition, RarityTier, Block } from '@myl/shared';
import { createCardPrintingSchema, updateCardPrintingSchema, editionDisplayName } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './image-upload';
import { Loader2, Save, Copy } from 'lucide-react';

interface CardPrintingFormData {
  card_printing_id?: string;
  edition_id: string;
  rarity_tier_id?: string;
  illustrator: string;
  collector_number: string;
  legal_status: string;
  printing_variant: string;
  image_url?: string;
}

interface CardPrintingFormProps {
  cardId: string;
  printingId?: string;
  editions: Edition[];
  blocks: Block[];
  rarities: RarityTier[];
  mode: 'create' | 'edit';
  initialData?: CardPrintingFormData;
}

export function CardPrintingForm({
  cardId,
  printingId,
  editions,
  blocks,
  rarities,
  mode,
  initialData,
}: CardPrintingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState<CardPrintingFormData>(
    initialData ?? {
      edition_id: '',
      rarity_tier_id: undefined,
      illustrator: '',
      collector_number: '',
      legal_status: 'LEGAL',
      printing_variant: 'standard',
    },
  );

  // Encontrar bloque de la edición seleccionada
  const selectedEdition = useMemo(
    () => editions.find((e) => e.edition_id === form.edition_id),
    [editions, form.edition_id],
  );
  const selectedBlock = useMemo(
    () => blocks.find((b) => b.block_id === selectedEdition?.block_id),
    [blocks, selectedEdition],
  );

  function update(key: keyof CardPrintingFormData, value: string | undefined) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...(mode === 'create' && { card_id: cardId }),
      edition_id: form.edition_id,
      rarity_tier_id: form.rarity_tier_id || undefined,
      illustrator: form.illustrator || undefined,
      collector_number: form.collector_number || undefined,
      legal_status: form.legal_status,
      printing_variant: form.printing_variant || 'standard',
    };

    const schema = mode === 'create' ? createCardPrintingSchema : updateCardPrintingSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(', '));
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        mode === 'create'
          ? `/api/v1/cards/${cardId}/printings`
          : `/api/v1/cards/${cardId}/printings/${printingId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'Error al guardar printing');
        return;
      }

      const finalPrintingId = mode === 'create' ? json.data.card_printing_id : printingId;

      // Upload image if provided
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const imgRes = await fetch(`/api/v1/cards/${cardId}/printings/${finalPrintingId}/image`, {
          method: 'POST',
          body: formData,
        });
        const imgJson = await imgRes.json();
        if (!imgJson.ok) {
          setError(
            `Printing ${mode === 'create' ? 'creado' : 'actualizado'}, pero fallo la subida de imagen`,
          );
          return;
        }
      }

      router.push(`/admin/cards/${cardId}/edit`);
      router.refresh();
    } catch {
      setError('Error de conexion');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Printing ID (en modo edición) */}
      {mode === 'edit' && form.card_printing_id && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-muted-foreground">ID de Impresión</Label>
              <p className="font-mono text-sm font-medium">{form.card_printing_id}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(form.card_printing_id!)}
              title="Copiar ID"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: image upload */}
        <div className="space-y-1.5">
          <Label>Imagen de la carta</Label>
          <ImageUpload value={form.image_url ?? null} onChange={setImageFile} />
          {form.image_url && !imageFile && (
            <p className="text-xs text-muted-foreground">Imagen actual guardada</p>
          )}
        </div>

        {/* Right: fields */}
        <div className="space-y-4">
          {/* Edition */}
          <div className="space-y-1.5">
            <Label>Edicion *</Label>
            <Select value={form.edition_id} onValueChange={(v) => update('edition_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar edicion" />
              </SelectTrigger>
              <SelectContent>
                {editions.map((e) => (
                  <SelectItem key={e.edition_id} value={e.edition_id}>
                    {editionDisplayName(e.name)} · {e.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEdition && selectedBlock && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Bloque: {selectedBlock.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Rarity */}
          <div className="space-y-1.5">
            <Label>Rareza</Label>
            <Select
              value={form.rarity_tier_id ?? ''}
              onValueChange={(v) => update('rarity_tier_id', v || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rareza" />
              </SelectTrigger>
              <SelectContent>
                {rarities.map((r) => (
                  <SelectItem key={r.rarity_tier_id} value={r.rarity_tier_id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Illustrator */}
          <div className="space-y-1.5">
            <Label htmlFor="illustrator">Ilustrador</Label>
            <Input
              id="illustrator"
              value={form.illustrator}
              onChange={(e) => update('illustrator', e.target.value)}
              placeholder="Nombre del ilustrador"
            />
          </div>

          {/* Collector number */}
          <div className="space-y-1.5">
            <Label htmlFor="collector_number">Numero de coleccion</Label>
            <Input
              id="collector_number"
              value={form.collector_number}
              onChange={(e) => update('collector_number', e.target.value)}
              placeholder="Ej: 001/120"
            />
          </div>

          {/* Legal status */}
          <div className="space-y-1.5">
            <Label>Estado legal *</Label>
            <Select value={form.legal_status} onValueChange={(v) => update('legal_status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEGAL">✅ Legal</SelectItem>
                <SelectItem value="RESTRICTED">⚠️ Restringida</SelectItem>
                <SelectItem value="BANNED">🚫 Prohibida</SelectItem>
                <SelectItem value="DISCONTINUED">⏸️ Discontinuada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {mode === 'create' ? 'Crear printing' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
