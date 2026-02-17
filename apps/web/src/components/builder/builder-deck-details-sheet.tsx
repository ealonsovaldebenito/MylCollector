'use client';

import { useMemo, useState } from 'react';
import type { Tag } from '@myl/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Tag as TagIcon, Wand2, X } from 'lucide-react';

export interface SuggestedTagRow {
  tag_id: string;
  name: string;
  slug: string;
  score: number;
  cards: number;
}

interface BuilderDeckDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  tagsCatalog: Tag[];
  onTagCreated: (tag: Tag) => void;
  selectedTagIds: string[];
  onChangeSelectedTagIds: (next: string[]) => void;

  suggestedTags: SuggestedTagRow[];
  isLoadingSuggestedTags?: boolean;

  description: string;
  strategy: string;
  coverImageUrl: string;
  onChangeDescription: (next: string) => void;
  onChangeStrategy: (next: string) => void;
  onChangeCoverImageUrl: (next: string) => void;
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function BuilderDeckDetailsSheet({
  open,
  onOpenChange,
  tagsCatalog,
  onTagCreated,
  selectedTagIds,
  onChangeSelectedTagIds,
  suggestedTags,
  isLoadingSuggestedTags = false,
  description,
  strategy,
  coverImageUrl,
  onChangeDescription,
  onChangeStrategy,
  onChangeCoverImageUrl,
}: BuilderDeckDetailsSheetProps) {
  const [tagSearch, setTagSearch] = useState('');
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [createTagError, setCreateTagError] = useState<string | null>(null);

  const selectedTags = useMemo(() => {
    const byId = new Map(tagsCatalog.map((t) => [t.tag_id, t]));
    return selectedTagIds.map((id) => byId.get(id)).filter(Boolean) as Tag[];
  }, [selectedTagIds, tagsCatalog]);

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    const base = tagsCatalog.slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (!q) return base;
    return base.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [tagSearch, tagsCatalog]);

  async function handleCreateTag() {
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    setIsCreatingTag(true);
    setCreateTagError(null);
    try {
      const res = await fetch('/api/v1/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!json.ok) {
        setCreateTagError(json.error?.message ?? 'Error al crear etiqueta');
        return;
      }

      const tag = json.data.tag as Tag;
      onTagCreated(tag);
      onChangeSelectedTagIds(toggle(selectedTagIds, tag.tag_id));
      setNewTagName('');
      setIsCreateTagOpen(false);
    } catch {
      setCreateTagError('Error de conexión');
    } finally {
      setIsCreatingTag(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] p-0 sm:max-w-[420px]">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="text-base">Detalles del mazo</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="space-y-4 p-4">
            <details open className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
                <span className="inline-flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-muted-foreground" />
                  Tags del mazo
                </span>
              </summary>
              <div className="space-y-3 border-t border-border px-4 py-3">
                {selectedTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aún no hay tags asignados.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((t) => (
                      <Badge key={t.tag_id} className="gap-1">
                        {t.name}
                        <button
                          type="button"
                          className="ml-1 rounded-sm opacity-70 hover:opacity-100"
                          onClick={() => onChangeSelectedTagIds(selectedTagIds.filter((id) => id !== t.tag_id))}
                          title="Quitar tag"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Buscar tags</Label>
                      <Input
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        placeholder="Ej: control, sacrificio..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5">
                          <Plus className="h-3.5 w-3.5" />
                          Crear
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crear etiqueta</DialogTitle>
                          <DialogDescription>
                            Se genera un slug automáticamente. Luego puedes asignarla al mazo.
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
                          {createTagError ? (
                            <p className="text-sm text-destructive">{createTagError}</p>
                          ) : null}
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateTagOpen(false)}
                            disabled={isCreatingTag}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={handleCreateTag}
                            disabled={isCreatingTag || !newTagName.trim()}
                          >
                            {isCreatingTag ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Crear etiqueta
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="max-h-[220px] overflow-auto rounded-md border border-border bg-background">
                  <div className="p-2">
                    {filteredTags.length === 0 ? (
                      <p className="p-2 text-xs text-muted-foreground">Sin resultados</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {filteredTags.slice(0, 60).map((t) => {
                          const active = selectedTagIds.includes(t.tag_id);
                          return (
                            <Badge
                              key={t.tag_id}
                              variant={active ? 'default' : 'outline'}
                              className={cn('cursor-pointer text-[11px]', active && 'shadow-sm')}
                              onClick={() => onChangeSelectedTagIds(toggle(selectedTagIds, t.tag_id))}
                              title={t.slug}
                            >
                              {t.name}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>

            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
                <span className="inline-flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-muted-foreground" />
                  Tags sugeridos (por cartas del mazo)
                </span>
              </summary>
              <div className="space-y-3 border-t border-border px-4 py-3">
                {isLoadingSuggestedTags ? (
                  <p className="text-xs text-muted-foreground">Calculando…</p>
                ) : suggestedTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay sugerencias por ahora.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags.slice(0, 16).map((t) => {
                      const active = selectedTagIds.includes(t.tag_id);
                      return (
                        <Button
                          key={t.tag_id}
                          type="button"
                          size="sm"
                          variant={active ? 'secondary' : 'outline'}
                          className="h-7 gap-2 px-2 text-[11px]"
                          onClick={() => onChangeSelectedTagIds(toggle(selectedTagIds, t.tag_id))}
                          title={t.slug}
                        >
                          <span className="max-w-[170px] truncate">{t.name}</span>
                          <span className={cn('font-mono', active ? 'text-muted-foreground' : 'text-muted-foreground')}>
                            {t.score}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </details>

            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">Descripción</summary>
              <div className="space-y-3 border-t border-border px-4 py-3">
                <Textarea
                  value={description}
                  onChange={(e) => onChangeDescription(e.target.value)}
                  placeholder="Resumen corto del mazo…"
                  rows={4}
                  className="text-sm"
                />
              </div>
            </details>

            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">Estrategia</summary>
              <div className="space-y-3 border-t border-border px-4 py-3">
                <Textarea
                  value={strategy}
                  onChange={(e) => onChangeStrategy(e.target.value)}
                  placeholder="Plan de juego, mulligans, condiciones de victoria…"
                  rows={6}
                  className="text-sm"
                />
              </div>
            </details>

            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">Imagen referencial</summary>
              <div className="space-y-3 border-t border-border px-4 py-3">
                <Input
                  value={coverImageUrl}
                  onChange={(e) => onChangeCoverImageUrl(e.target.value)}
                  placeholder="https://…"
                  className="h-8 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Por ahora es un URL. Luego se puede integrar subida de imagen.
                </p>
              </div>
            </details>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
