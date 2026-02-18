/**
 * CardPrintingForm - Admin create/edit UI for card printings.
 *
 * Scope:
 * - Edit printing metadata (variant, edition, rarity, legal status, collector, illustrator).
 * - Replace image via upload or set image URL directly.
 * - Delete printing from edit view with explicit confirmation.
 *
 * Changelog:
 *   2026-02-18 - Added variant/image URL editing and delete action in edit mode.
 *   2026-02-18 - Improved metadata panel for quick inspection and copyable IDs.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Block, Edition, RarityTier } from '@myl/shared';
import { createCardPrintingSchema, editionDisplayName, updateCardPrintingSchema } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ImageUpload } from './image-upload';
import { Copy, ExternalLink, Loader2, Save, Trash2 } from 'lucide-react';

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
  const [isDeleting, setIsDeleting] = useState(false);
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
      image_url: '',
    },
  );

  const selectedEdition = useMemo(
    () => editions.find((edition) => edition.edition_id === form.edition_id),
    [editions, form.edition_id],
  );
  const selectedBlock = useMemo(
    () => blocks.find((block) => block.block_id === selectedEdition?.block_id),
    [blocks, selectedEdition],
  );

  function update(key: keyof CardPrintingFormData, value: string | undefined) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  async function handleDelete() {
    if (mode !== 'edit' || !printingId) return;
    if (!confirm('Eliminar esta impresion? Esta accion no se puede deshacer.')) return;

    setError(null);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/cards/${cardId}/printings/${printingId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'No se pudo eliminar la impresion.');
        return;
      }

      router.push(`/admin/cards/${cardId}/edit`);
      router.refresh();
    } catch {
      setError('Error de conexion al eliminar la impresion.');
    } finally {
      setIsDeleting(false);
    }
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
      printing_variant: form.printing_variant.trim() || 'standard',
      image_url: form.image_url?.trim() || undefined,
    };

    const schema = mode === 'create' ? createCardPrintingSchema : updateCardPrintingSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(', '));
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
        setError(json.error?.message ?? 'Error al guardar impresion.');
        return;
      }

      const finalPrintingId = mode === 'create' ? json.data.card_printing_id : printingId;

      if (imageFile && finalPrintingId) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const imageRes = await fetch(`/api/v1/cards/${cardId}/printings/${finalPrintingId}/image`, {
          method: 'POST',
          body: formData,
        });
        const imageJson = await imageRes.json();
        if (!imageJson.ok) {
          setError(
            `Impresion guardada, pero fallo la subida de imagen: ${
              imageJson.error?.message ?? 'error desconocido'
            }`,
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
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {mode === 'edit' && form.card_printing_id ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ID de impresion</Label>
              <p className="font-mono text-sm font-medium">{form.card_printing_id}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{form.printing_variant || 'standard'}</Badge>
              <Badge
                variant={
                  form.legal_status === 'LEGAL'
                    ? 'default'
                    : form.legal_status === 'RESTRICTED'
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {form.legal_status}
              </Badge>
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
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Imagen de la impresion</Label>
            <ImageUpload value={form.image_url ?? null} onChange={setImageFile} />
            {form.image_url && !imageFile ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Imagen actual guardada.</p>
                <Button type="button" variant="link" className="h-auto p-0 text-xs" asChild>
                  <a href={form.image_url} target="_blank" rel="noreferrer">
                    Abrir <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="image_url">URL de imagen (opcional)</Label>
            <Input
              id="image_url"
              value={form.image_url ?? ''}
              onChange={(e) => update('image_url', e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Si subes archivo y URL, prevalece el archivo subido.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="printing_variant">Nombre de impresion *</Label>
            <Input
              id="printing_variant"
              value={form.printing_variant}
              onChange={(e) => update('printing_variant', e.target.value)}
              placeholder="standard, Full Art, Foil Lluvia..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Edicion *</Label>
            <Select value={form.edition_id} onValueChange={(value) => update('edition_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar edicion" />
              </SelectTrigger>
              <SelectContent>
                {editions.map((edition) => (
                  <SelectItem key={edition.edition_id} value={edition.edition_id}>
                    {editionDisplayName(edition.name)} - {edition.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEdition && selectedBlock ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Bloque: {selectedBlock.name}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Codigo: {selectedEdition.code}
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Rareza</Label>
            <Select
              value={form.rarity_tier_id ?? '__none__'}
              onValueChange={(value) => update('rarity_tier_id', value === '__none__' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rareza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin rareza</SelectItem>
                {rarities.map((rarity) => (
                  <SelectItem key={rarity.rarity_tier_id} value={rarity.rarity_tier_id}>
                    {rarity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="illustrator">Ilustrador</Label>
            <Input
              id="illustrator"
              value={form.illustrator}
              onChange={(e) => update('illustrator', e.target.value)}
              placeholder="Nombre del ilustrador"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="collector_number">Numero de coleccion</Label>
            <Input
              id="collector_number"
              value={form.collector_number}
              onChange={(e) => update('collector_number', e.target.value)}
              placeholder="Ej: 001/120"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Estado legal *</Label>
            <Select value={form.legal_status} onValueChange={(value) => update('legal_status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEGAL">Legal</SelectItem>
                <SelectItem value="RESTRICTED">Restringida</SelectItem>
                <SelectItem value="BANNED">Prohibida</SelectItem>
                <SelectItem value="DISCONTINUED">Discontinuada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {mode === 'edit' ? (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={isSubmitting || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar impresion
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting || isDeleting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || isDeleting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === 'create' ? 'Crear impresion' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </form>
  );
}
