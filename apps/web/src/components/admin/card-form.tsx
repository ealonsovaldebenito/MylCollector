/**
 * CardForm — Formulario de creación/edición de cartas (admin).
 * Tabs: Datos, Impresiones, Tiendas.
 *
 * Relaciones:
 *   - cards → card_types, races (FK)
 *   - cards → tags (many-to-many via card_tags)
 *   - card_printings → editions, rarity_tiers (FK)
 *   - store_printing_links → card_printings, stores (FK)
 *
 * Changelog:
 *   2026-02-16 — Creación inicial con tabs y preview sidebar
 *   2026-02-17 — Fix: eliminar mensajes técnicos visibles en tab Tiendas
 *   2026-02-17 — UX: mejorar estados vacíos con iconos y mensajes claros
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CardType, Race, Tag, Block, Edition, RarityTier } from '@myl/shared';
import { createCardSchema, updateCardSchema, editionDisplayName } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Loader2,
  Save,
  X,
  ImagePlus,
  Copy,
  Plus,
  Type,
  Hash,
  Zap,
  FileText,
  Tag as TagIcon,
  Info,
  Calendar,
  Shield,
  Layers,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Link2,
} from 'lucide-react';
import {
  PrintingInlineForm,
  createEmptyPrintingDraft,
  type PrintingDraft,
} from './printing-inline-form';
import { CardStoreLinks } from '@/components/admin/card-store-links';
import type { CardDetail } from '@myl/shared';

interface CardFormData {
  card_id?: string;
  name: string;
  name_normalized?: string;
  card_type_id: string;
  race_id?: string;
  ally_strength?: number;
  cost?: number;
  is_unique: boolean;
  has_ability: boolean;
  can_be_starting_gold: boolean;
  text?: string;
  flavor_text?: string;
  tag_ids: string[];
  created_at?: string;
  updated_at?: string;
}

interface CardFormProps {
  initialData?: CardFormData;
  cardTypes: CardType[];
  races: Race[];
  tags: Tag[];
  mode: 'create' | 'edit';
  printings?: CardDetail['printings'];
  blocks?: Block[];
  editions?: Edition[];
  rarities?: RarityTier[];
}

const ALIADO_CODE = 'ALIADO';

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface SubmissionProgress {
  step: string;
  current: number;
  total: number;
}

export function CardForm({
  initialData,
  cardTypes,
  races,
  tags,
  mode,
  printings = [],
  blocks = [],
  editions = [],
  rarities = [],
}: CardFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<SubmissionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingPrintings, setExistingPrintings] = useState<CardDetail['printings']>(printings);
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [form, setForm] = useState<CardFormData>(
    initialData ?? {
      name: '',
      card_type_id: '',
      race_id: undefined,
      ally_strength: undefined,
      cost: undefined,
      is_unique: false,
      has_ability: false,
      can_be_starting_gold: false,
      text: undefined,
      flavor_text: undefined,
      tag_ids: [],
    },
  );

  // Inline printing drafts (for new printings)
  const [printingDrafts, setPrintingDrafts] = useState<PrintingDraft[]>(
    mode === 'create' ? [createEmptyPrintingDraft()] : [],
  );

  useEffect(() => {
    setExistingPrintings(printings);
  }, [printings]);

  useEffect(() => {
    setAvailableTags(tags);
  }, [tags]);

  const selectedType = cardTypes.find((ct) => ct.card_type_id === form.card_type_id);
  const isAlly = selectedType?.code === ALIADO_CODE;

  const imagePrintings = useMemo(
    () => existingPrintings.filter((p) => !!p.image_url),
    [existingPrintings],
  );

  const printingPriceSummary = useMemo(() => {
    const prices = existingPrintings
      .map((p) => (p.price_consensus ? Number((p.price_consensus as { consensus_price: number }).consensus_price) : null))
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max, count: prices.length };
  }, [existingPrintings]);

  const legalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of existingPrintings) {
      counts[p.legal_status] = (counts[p.legal_status] ?? 0) + 1;
    }
    return counts;
  }, [existingPrintings]);

  useEffect(() => {
    if (carouselIndex >= imagePrintings.length) setCarouselIndex(0);
  }, [carouselIndex, imagePrintings.length]);

  function update<K extends keyof CardFormData>(key: K, value: CardFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  }

  function addPrintingDraft() {
    setPrintingDrafts((prev) => [...prev, createEmptyPrintingDraft()]);
  }

  function updatePrintingDraft(index: number, updated: PrintingDraft) {
    setPrintingDrafts((prev) => prev.map((d, i) => (i === index ? updated : d)));
  }

  function removePrintingDraft(index: number) {
    setPrintingDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDeletePrinting(printingId: string) {
    if (!form.card_id) return;
    if (!confirm('¿Eliminar esta impresión? Esta acción no se puede deshacer.')) return;

    try {
      const res = await fetch(`/api/v1/cards/${form.card_id}/printings/${printingId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al eliminar impresión');
        return;
      }
      setExistingPrintings((prev) => prev.filter((p) => p.card_printing_id !== printingId));
    } catch {
      alert('Error de conexión');
    }
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;

    setIsCreatingTag(true);
    try {
      const res = await fetch('/api/v1/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al crear etiqueta');
        return;
      }
      const tag = json.data.tag as Tag;
      setAvailableTags((prev) => (prev.some((t) => t.tag_id === tag.tag_id) ? prev : [...prev, tag]));
      toggleTag(tag.tag_id);
      setNewTagName('');
      setIsCreateTagOpen(false);
    } catch {
      alert('Error de conexión');
    } finally {
      setIsCreatingTag(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate card data
    const schema = mode === 'create' ? createCardSchema : updateCardSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(', '));
      return;
    }

    // Validate printings have edition_id
    const validDrafts = printingDrafts.filter((d) => d.edition_id);
    const invalidDrafts = printingDrafts.filter((d) => !d.edition_id && (d.block_id || d.illustrator || d.collector_number || d.imageFile));
    if (invalidDrafts.length > 0) {
      setError('Hay impresiones sin edicion seleccionada. Selecciona una edicion o elimina la fila.');
      return;
    }

    setIsSubmitting(true);
    const totalSteps = 1 + validDrafts.length + validDrafts.filter((d) => d.imageFile).length + validDrafts.filter((d) => d.reference_price).length;
    let currentStep = 0;

    try {
      // Step 1: Create/Update card
      setProgress({ step: mode === 'create' ? 'Creando carta...' : 'Guardando carta...', current: ++currentStep, total: totalSteps });

      const url = mode === 'create' ? '/api/v1/cards' : `/api/v1/cards/${form.card_id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'Error al guardar carta');
        return;
      }

      const cardId = mode === 'create' ? json.data.card_id : form.card_id;

      // Step 2: Create each printing
      const errors: string[] = [];

      for (let i = 0; i < validDrafts.length; i++) {
        const draft = validDrafts[i]!;
        setProgress({ step: `Creando impresion ${i + 1}/${validDrafts.length}...`, current: ++currentStep, total: totalSteps });

        const printingPayload = {
          card_id: cardId,
          edition_id: draft.edition_id,
          rarity_tier_id: draft.rarity_tier_id || undefined,
          illustrator: draft.illustrator || undefined,
          collector_number: draft.collector_number || undefined,
          legal_status: draft.legal_status,
          printing_variant: 'standard',
        };

        const pRes = await fetch(`/api/v1/cards/${cardId}/printings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(printingPayload),
        });
        const pJson = await pRes.json();

        if (!pJson.ok) {
          errors.push(`Impresion ${i + 1}: ${pJson.error?.message ?? 'Error desconocido'}`);
          continue;
        }

        const printingId = pJson.data.card_printing_id;

        // Upload image if provided
        if (draft.imageFile) {
          setProgress({ step: `Subiendo imagen ${i + 1}...`, current: ++currentStep, total: totalSteps });
          const formData = new FormData();
          formData.append('file', draft.imageFile);
          const imgRes = await fetch(`/api/v1/cards/${cardId}/printings/${printingId}/image`, {
            method: 'POST',
            body: formData,
          });
          const imgJson = await imgRes.json();
          if (!imgJson.ok) {
            errors.push(`Imagen impresion ${i + 1}: ${imgJson.error?.message ?? 'Error al subir'}`);
          }
        }

        // Set reference price if provided
        if (draft.reference_price) {
          setProgress({ step: `Guardando precio ${i + 1}...`, current: ++currentStep, total: totalSteps });
          const priceRes = await fetch(`/api/v1/cards/${cardId}/printings/${printingId}/price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: Number(draft.reference_price) }),
          });
          if (!priceRes.ok) {
            errors.push(`Precio impresion ${i + 1}: Error al guardar`);
          }
        }
      }

      if (errors.length > 0) {
        setError(`Carta guardada pero hubo errores:\n${errors.join('\n')}`);
        // Still redirect after a delay
        setTimeout(() => {
          router.push(`/admin/cards/${cardId}/edit`);
          router.refresh();
        }, 3000);
        return;
      }

      // Success — redirect
      if (mode === 'create' && validDrafts.length > 0) {
        router.push(`/admin/cards/${cardId}/edit`);
      } else {
        router.push('/admin/cards');
      }
      router.refresh();
    } catch {
      setError('Error de conexion');
    } finally {
      setIsSubmitting(false);
      setProgress(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-9">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="whitespace-pre-wrap">{error}</div>
          </div>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span>{progress.step}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {progress.current}/{progress.total}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Tabs defaultValue="details" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <TabsList>
              <TabsTrigger value="details">Datos</TabsTrigger>
              <TabsTrigger value="printings">
                Impresiones
                <span className="ml-2 rounded-md bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {existingPrintings.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="stores" disabled={mode !== 'edit' || !form.card_id || existingPrintings.length === 0}>
                Tiendas
              </TabsTrigger>
            </TabsList>
            {mode === 'edit' && form.card_id ? (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {printingPriceSummary ? (
                  <Badge variant="secondary" className="font-mono text-xs">
                    Consenso: {printingPriceSummary.min.toLocaleString('es-CL')}–{printingPriceSummary.max.toLocaleString('es-CL')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Sin consenso</Badge>
                )}
                {Object.keys(legalCounts).length > 0 ? (
                  <Badge variant="outline" className="text-xs">
                    Legal: {legalCounts.LEGAL ?? 0} · Res: {legalCounts.RESTRICTED ?? 0} · Ban: {legalCounts.BANNED ?? 0}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          <TabsContent value="details" className="space-y-6">
            {/* Metadata Section (Edit Mode) */}
            {mode === 'edit' && form.card_id && (
              <div className="rounded-lg border border-border bg-gradient-to-br from-muted/30 to-muted/10 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Informacion del Sistema</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="col-span-full flex items-center justify-between p-3 bg-background rounded-md border">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">ID de Carta</Label>
                      <code className="text-sm font-mono">{form.card_id}</code>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(form.card_id!)}
                      title="Copiar ID"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {form.name_normalized && (
                    <div className="p-3 bg-background rounded-md border">
                      <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Type className="h-3 w-3" />
                        Nombre Normalizado
                      </Label>
                      <code className="text-xs text-muted-foreground">{form.name_normalized}</code>
                    </div>
                  )}

                  {form.created_at && (
                    <div className="p-3 bg-background rounded-md border">
                      <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Creacion
                      </Label>
                      <p className="text-xs">{new Date(form.created_at).toLocaleString('es-CL')}</p>
                    </div>
                  )}

                  {form.updated_at && (
                    <div className="p-3 bg-background rounded-md border">
                      <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Ultima Actualizacion
                      </Label>
                      <p className="text-xs">{new Date(form.updated_at).toLocaleString('es-CL')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="rounded-lg border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-2 pb-2">
                <Type className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Informacion Basica</h3>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
              Nombre de la Carta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Ej: Moneda de Sangre"
              required
              className="h-11"
            />
          </div>

          {/* Type + Race Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select value={form.card_type_id} onValueChange={(v) => update('card_type_id', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {cardTypes.map((ct) => (
                    <SelectItem key={ct.card_type_id} value={ct.card_type_id}>
                      {ct.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAlly && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Raza</Label>
                <Select value={form.race_id ?? ''} onValueChange={(v) => update('race_id', v || undefined)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccionar raza" />
                  </SelectTrigger>
                  <SelectContent>
                    {races.map((r) => (
                      <SelectItem key={r.race_id} value={r.race_id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2">
            <Hash className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Estadisticas</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-sm font-medium">Coste</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                value={form.cost ?? ''}
                onChange={(e) => update('cost', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="h-11 font-mono"
              />
            </div>

            {isAlly && (
              <div className="space-y-2">
                <Label htmlFor="strength" className="text-sm font-medium flex items-center gap-1">
                  Fuerza <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="strength"
                  type="number"
                  min={1}
                  value={form.ally_strength ?? ''}
                  onChange={(e) =>
                    update('ally_strength', e.target.value ? Number(e.target.value) : undefined)
                  }
                  required={isAlly}
                  placeholder="1"
                  className="h-11 font-mono"
                />
              </div>
            )}
          </div>

          {/* Properties Toggles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Propiedades</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={form.is_unique ? 'default' : 'outline'}
                size="sm"
                onClick={() => update('is_unique', !form.is_unique)}
                className="h-9"
              >
                <Shield className="mr-2 h-3.5 w-3.5" />
                Unica
              </Button>
              <Button
                type="button"
                variant={form.has_ability ? 'default' : 'outline'}
                size="sm"
                onClick={() => update('has_ability', !form.has_ability)}
                className="h-9"
              >
                <Zap className="mr-2 h-3.5 w-3.5" />
                Con habilidad
              </Button>
              <Button
                type="button"
                variant={form.can_be_starting_gold ? 'default' : 'outline'}
                size="sm"
                onClick={() => update('can_be_starting_gold', !form.can_be_starting_gold)}
                className="h-9"
              >
                <Hash className="mr-2 h-3.5 w-3.5" />
                Oro inicial
              </Button>
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2 pb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Texto</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text" className="text-sm font-medium">Habilidad</Label>
            <Textarea
              id="text"
              value={form.text ?? ''}
              onChange={(e) => update('text', e.target.value || undefined)}
              placeholder="Texto de la habilidad de la carta..."
              rows={4}
              className="font-mono text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flavor" className="text-sm font-medium">Texto de Ambientacion</Label>
            <Textarea
              id="flavor"
              value={form.flavor_text ?? ''}
              onChange={(e) => update('flavor_text', e.target.value || undefined)}
              placeholder="Texto de ambientacion o flavor text..."
              rows={3}
              className="italic text-sm resize-none"
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Etiquetas</h3>
            </div>
            <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Crear
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear etiqueta</DialogTitle>
                  <DialogDescription>
                    Se genera un slug automáticamente. Luego puedes asignarla a la carta.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Nombre</Label>
                  <Input
                    id="tag-name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Ej: control, sacrificio, vampiros..."
                    disabled={isCreatingTag}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateTagOpen(false)} disabled={isCreatingTag}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleCreateTag} disabled={isCreatingTag || !newTagName.trim()}>
                    {isCreatingTag ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Crear etiqueta
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay etiquetas disponibles</p>
            ) : (
              availableTags
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                .map((tag) => (
                <Badge
                  key={tag.tag_id}
                  variant={form.tag_ids.includes(tag.tag_id) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                  onClick={() => toggleTag(tag.tag_id)}
                >
                  {form.tag_ids.includes(tag.tag_id) && <X className="mr-1 h-3 w-3" />}
                  {tag.name}
                </Badge>
              ))
            )}
          </div>
        </div>

        </TabsContent>

        <TabsContent value="printings" className="space-y-6">
        {/* ============================================================ */}
        {/* Printings Section — NEW inline printing forms                */}
        {/* ============================================================ */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-lg">Impresiones</h3>
              {printingDrafts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {printingDrafts.length} nueva{printingDrafts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPrintingDraft}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar impresion
            </Button>
          </div>

          {printingDrafts.length === 0 && mode === 'edit' && (
            <p className="text-sm text-muted-foreground py-2">
              Agrega nuevas impresiones a esta carta haciendo click en &quot;Agregar impresion&quot;.
            </p>
          )}

          {printingDrafts.length === 0 && mode === 'create' && (
            <p className="text-sm text-muted-foreground py-2">
              Puedes crear la carta sin impresiones y agregarlas despues, o agregar impresiones ahora.
            </p>
          )}

          <div className="space-y-4">
            {printingDrafts.map((draft, i) => (
              <PrintingInlineForm
                key={draft.id}
                draft={draft}
                index={i}
                blocks={blocks}
                editions={editions}
                rarities={rarities}
                onChange={(updated) => updatePrintingDraft(i, updated)}
                onRemove={() => removePrintingDraft(i)}
                canRemove={true}
              />
            ))}
          </div>
        </div>

        {/* Existing Printings (Edit Mode) */}
        {mode === 'edit' ? (
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Impresiones existentes</h3>
                <Badge variant="secondary" className="text-xs">
                  {existingPrintings.length}
                </Badge>
              </div>
              <Link href={`/admin/cards/${form.card_id}/printings/new`}>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Form completo
                </Button>
              </Link>
            </div>

            {existingPrintings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Esta carta aún no tiene impresiones.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {existingPrintings.map((p) => {
                  const block = p.edition?.block_id ? blocks.find((b) => b.block_id === p.edition.block_id) : null;
                  const consensusPrice =
                    (p as unknown as { price_consensus?: { consensus_price?: number } | null })
                      .price_consensus?.consensus_price ?? null;
                  return (
                    <div
                      key={p.card_printing_id}
                      className="flex gap-3 rounded-md border border-border bg-background/30 p-3 transition-colors hover:border-primary hover:bg-muted/20"
                    >
                      <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-md border border-border bg-background">
                        <CardImage src={p.image_url ?? null} alt={form.name || 'Carta'} className="h-full w-full" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {editionDisplayName(p.edition.name)}
                          </Badge>
                          {consensusPrice !== null && typeof consensusPrice === 'number' ? (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {formatCLP(consensusPrice)}
                            </Badge>
                          ) : null}
                          {p.rarity_tier ? (
                            <Badge variant="outline" className="text-xs">
                              {p.rarity_tier.name}
                            </Badge>
                          ) : null}
                          <Badge
                            variant={
                              p.legal_status === 'LEGAL'
                                ? 'default'
                                : p.legal_status === 'RESTRICTED'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="text-xs"
                          >
                            {p.legal_status === 'LEGAL'
                              ? 'Legal'
                              : p.legal_status === 'RESTRICTED'
                                ? 'Restringida'
                                : p.legal_status === 'BANNED'
                                  ? 'Prohibida'
                                  : 'Discontinuada'}
                          </Badge>
                        </div>

                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">{block ? `Bloque: ${block.name}` : 'Bloque: N/A'}</p>
                          <code className="block text-[10px] text-muted-foreground">{p.card_printing_id}</code>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/admin/cards/${form.card_id}/printings/${p.card_printing_id}/edit`} className="flex-1">
                            <Button type="button" variant="outline" size="sm" className="h-8 w-full">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Eliminar impresión"
                            onClick={() => handleDeletePrinting(p.card_printing_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          {mode !== 'edit' || !form.card_id ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center">
              <Link2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Guarda la carta primero para poder vincular tiendas.
              </p>
            </div>
          ) : existingPrintings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-8 text-center">
              <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Crea al menos una impresión para poder vincular tiendas y precios.
              </p>
            </div>
          ) : (
            <CardStoreLinks cardId={form.card_id} cardName={form.name} printings={existingPrintings} />
          )}
        </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === 'create' ? 'Crear Carta' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>

      {/* Right Sidebar - Preview */}
      <div className="lg:col-span-3">
        <div className="sticky top-6 space-y-6">
          {/* Card Preview */}
          <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <ImagePlus className="h-5 w-5 text-primary" />
              Vista Previa
            </h3>

          <div className="mb-4 space-y-2">
            {imagePrintings.length > 0 ? (
              (() => {
                const current = imagePrintings[carouselIndex]!;
                return (
                  <>
                    <div className="relative overflow-hidden rounded-md border border-border bg-background">
                      <CardImage
                        src={current.image_url ?? null}
                        alt={`${form.name || 'Carta'} — ${editionDisplayName(current.edition.name)}`}
                        className="h-[140px] w-full"
                        fit="contain"
                        priority
                      />
                      {imagePrintings.length > 1 && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="pointer-events-auto h-8 w-8 rounded-full"
                            onClick={() => setCarouselIndex((i) => (i - 1 + imagePrintings.length) % imagePrintings.length)}
                            title="Anterior"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="pointer-events-auto h-8 w-8 rounded-full"
                            onClick={() => setCarouselIndex((i) => (i + 1) % imagePrintings.length)}
                            title="Siguiente"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {imagePrintings.length > 1 && (
                        <div className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
                          {carouselIndex + 1}/{imagePrintings.length}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="max-w-[70%] truncate text-[11px]">
                        {editionDisplayName(current.edition.name)}
                      </Badge>
                      <Badge
                        variant={
                          current.legal_status === 'LEGAL'
                            ? 'default'
                            : current.legal_status === 'RESTRICTED'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="text-[11px]"
                      >
                        {current.legal_status === 'LEGAL'
                          ? 'Legal'
                          : current.legal_status === 'RESTRICTED'
                            ? 'Restringida'
                            : current.legal_status === 'BANNED'
                              ? 'Prohibida'
                              : 'Discontinuada'}
                      </Badge>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="overflow-hidden rounded-md border border-border bg-background">
                <CardImage src={null} alt="Sin imagen" className="h-[140px] w-full" />
              </div>
            )}
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Nombre</Label>
              <p className="font-semibold">{form.name || '(Sin nombre)'}</p>
            </div>
            {selectedType && (
              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Badge variant="secondary">{selectedType.name}</Badge>
              </div>
            )}
            {form.cost !== undefined && form.cost !== null && (
              <div>
                <Label className="text-xs text-muted-foreground">Coste</Label>
                <p className="font-mono font-medium">{form.cost}</p>
              </div>
            )}
            {isAlly && form.ally_strength !== undefined && form.ally_strength !== null && (
              <div>
                <Label className="text-xs text-muted-foreground">Fuerza</Label>
                <p className="font-mono font-medium">{form.ally_strength}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-1 pt-2">
              {form.is_unique && <Badge variant="outline" className="text-xs">Unica</Badge>}
              {form.has_ability && <Badge variant="outline" className="text-xs">Con habilidad</Badge>}
              {form.can_be_starting_gold && <Badge variant="outline" className="text-xs">Oro inicial</Badge>}
            </div>

            <div className="rounded-md border border-border bg-background/50 p-3">
              <Label className="text-xs text-muted-foreground">Resumen</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Impresiones</p>
                  <p className="font-mono font-medium">{existingPrintings.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Con imagen</p>
                  <p className="font-mono font-medium">{imagePrintings.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Etiquetas</p>
                  <p className="font-mono font-medium">{form.tag_ids.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consenso</p>
                  <p className="font-mono font-medium">
                    {printingPriceSummary ? `${formatCLP(printingPriceSummary.min)}–${formatCLP(printingPriceSummary.max)}` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary of new printings */}
            {printingDrafts.filter((d) => d.edition_id).length > 0 && (
              <div className="pt-2 border-t border-border">
                <Label className="text-xs text-muted-foreground">Nuevas impresiones</Label>
                <div className="space-y-1 mt-1">
                  {printingDrafts
                    .filter((d) => d.edition_id)
                    .map((d) => {
                      const edition = editions.find((e) => e.edition_id === d.edition_id);
                      return (
                        <div key={d.id} className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          <span className="text-xs">
                            {edition ? editionDisplayName(edition.name) : 'Sin edicion'}
                          </span>
                          {d.imageFile && <ImagePlus className="h-3 w-3 text-muted-foreground" />}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
