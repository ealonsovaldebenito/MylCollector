'use client';

import { useMemo } from 'react';
import type { Block, Edition, RarityTier } from '@myl/shared';
import { editionDisplayName } from '@myl/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './image-upload';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export interface PrintingDraft {
  id: string;
  block_id: string;
  edition_id: string;
  rarity_tier_id: string;
  legal_status: string;
  illustrator: string;
  collector_number: string;
  reference_price: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export function createEmptyPrintingDraft(): PrintingDraft {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    block_id: '',
    edition_id: '',
    rarity_tier_id: '',
    legal_status: 'LEGAL',
    illustrator: '',
    collector_number: '',
    reference_price: '',
    imageFile: null,
    imagePreview: null,
  };
}

interface PrintingInlineFormProps {
  draft: PrintingDraft;
  index: number;
  blocks: Block[];
  editions: Edition[];
  rarities: RarityTier[];
  onChange: (updated: PrintingDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const LEGAL_OPTIONS = [
  { value: 'LEGAL', label: 'Legal', color: 'text-green-600' },
  { value: 'RESTRICTED', label: 'Restringida', color: 'text-yellow-600' },
  { value: 'BANNED', label: 'Prohibida', color: 'text-red-600' },
  { value: 'DISCONTINUED', label: 'Discontinuada', color: 'text-muted-foreground' },
];

export function PrintingInlineForm({
  draft,
  index,
  blocks,
  editions,
  rarities,
  onChange,
  onRemove,
  canRemove,
}: PrintingInlineFormProps) {
  const [collapsed, setCollapsed] = useState(false);

  const filteredEditions = useMemo(
    () => (draft.block_id ? editions.filter((e) => e.block_id === draft.block_id) : editions),
    [editions, draft.block_id],
  );

  const selectedEdition = editions.find((e) => e.edition_id === draft.edition_id);
  const selectedBlock = blocks.find((b) => b.block_id === (draft.block_id || selectedEdition?.block_id));

  function update<K extends keyof PrintingDraft>(key: K, value: PrintingDraft[K]) {
    const next = { ...draft, [key]: value };
    // Limpiar edición si cambia bloque
    if (key === 'block_id') {
      next.edition_id = '';
    }
    onChange(next);
  }

  function handleImageChange(file: File | null) {
    if (file) {
      const preview = URL.createObjectURL(file);
      onChange({ ...draft, imageFile: file, imagePreview: preview });
    } else {
      onChange({ ...draft, imageFile: null, imagePreview: null });
    }
  }

  const legalConfig = LEGAL_OPTIONS.find((o) => o.value === draft.legal_status);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          Impresion #{index + 1}
          {selectedEdition && (
            <Badge variant="secondary" className="text-xs ml-1">
              {editionDisplayName(selectedEdition.name)}
            </Badge>
          )}
          {legalConfig && legalConfig.value !== 'LEGAL' && (
            <Badge variant="outline" className={cn('text-xs', legalConfig.color)}>
              {legalConfig.label}
            </Badge>
          )}
        </button>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="Eliminar impresion"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[200px_1fr]">
            {/* Left: Image */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Imagen</Label>
              <ImageUpload
                value={draft.imagePreview}
                onChange={handleImageChange}
              />
            </div>

            {/* Right: Fields */}
            <div className="space-y-4">
              {/* Row 1: Block → Edition */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bloque</Label>
                  <Select
                    value={draft.block_id || '__all__'}
                    onValueChange={(v) => update('block_id', v === '__all__' ? '' : v)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Todos los bloques" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos los bloques</SelectItem>
                      {blocks.map((b) => (
                        <SelectItem key={b.block_id} value={b.block_id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBlock && draft.block_id && (
                    <p className="text-[10px] text-muted-foreground">
                      {filteredEditions.length} ediciones disponibles
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Edicion <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={draft.edition_id || '__none__'}
                    onValueChange={(v) => update('edition_id', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Seleccionar edicion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" disabled>
                        Seleccionar edicion
                      </SelectItem>
                      {filteredEditions.map((e) => (
                        <SelectItem key={e.edition_id} value={e.edition_id}>
                          {editionDisplayName(e.name)} · {e.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Rarity + Legal Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Rareza</Label>
                  <Select
                    value={draft.rarity_tier_id || '__none__'}
                    onValueChange={(v) => update('rarity_tier_id', v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Sin rareza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin rareza</SelectItem>
                      {rarities.map((r) => (
                        <SelectItem key={r.rarity_tier_id} value={r.rarity_tier_id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Estado legal <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={draft.legal_status}
                    onValueChange={(v) => update('legal_status', v)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className={o.color}>{o.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Illustrator + Collector + Price */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ilustrador</Label>
                  <Input
                    value={draft.illustrator}
                    onChange={(e) => update('illustrator', e.target.value)}
                    placeholder="Nombre"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Nro. coleccion</Label>
                  <Input
                    value={draft.collector_number}
                    onChange={(e) => update('collector_number', e.target.value)}
                    placeholder="001/120"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Precio ref. (CLP)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={draft.reference_price}
                    onChange={(e) => update('reference_price', e.target.value)}
                    placeholder="0"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
