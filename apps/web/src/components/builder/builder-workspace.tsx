'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDeckBuilder } from '@/hooks/use-deck-builder';
import { useFormats } from '@/hooks/use-formats';
import { useCatalogData } from '@/hooks/use-catalog-data';
import type { Tag } from '@myl/shared';
import { BuilderCardBrowser } from './builder-card-browser';
import { BuilderDeckEditor } from './builder-deck-editor';
import { BuilderValidationPanel } from './builder-validation-panel';
import { BuilderStatsPanel } from './builder-stats-panel';
import { BuilderMulliganSimulator } from './builder-mulligan-simulator';
import { BuilderCostPanel } from './builder-cost-panel';
import { BuilderDeckDetailsSheet, type SuggestedTagRow } from './builder-deck-details-sheet';
import { FormatSelector } from './format-selector';
import { ExportDeckDialog } from './export-deck-dialog';
import { ImportDeckDialog } from './import-deck-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Loader2, AlertCircle, SlidersHorizontal } from 'lucide-react';

interface BuilderWorkspaceProps {
  initialDeckId?: string;
  initialFormatId?: string;
}

export function BuilderWorkspace({ initialDeckId, initialFormatId }: BuilderWorkspaceProps) {
  const router = useRouter();
  const { formats, isLoading: formatsLoading } = useFormats();
  const { tags, blocks, editions, races } = useCatalogData();
  const [isMounted, setIsMounted] = useState(false);
  const [tagsCatalog, setTagsCatalog] = useState<Tag[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTagRow[]>([]);
  const [isLoadingSuggestedTags, setIsLoadingSuggestedTags] = useState(false);
  const [blockId, setBlockId] = useState<string>('');
  const [availableRaceIds, setAvailableRaceIds] = useState<Set<string> | null>(null);
  const [isLoadingAvailableRaces, setIsLoadingAvailableRaces] = useState(false);

  const builder = useDeckBuilder(initialFormatId);

  React.useEffect(() => {
    setTagsCatalog(tags);
  }, [tags]);

  const selectedFormat = useMemo(
    () => formats.find((f) => f.format_id === builder.formatId) ?? null,
    [formats, builder.formatId],
  );

  const isEditionRacialFormat = useMemo(() => {
    if (!selectedFormat) return false;
    const code = (selectedFormat.code ?? '').toUpperCase();
    const name = (selectedFormat.name ?? '').toLowerCase();
    const builderMode = String(
      (selectedFormat.params_json as Record<string, unknown>)?.builder_mode ?? '',
    ).toUpperCase();

    return (
      code === 'EDICION_RACIAL' ||
      code === 'EDICIÓN_RACIAL' ||
      code === 'RACIAL_EDITION' ||
      builderMode === 'EDICION_RACIAL' ||
      builderMode === 'RACIAL_EDITION' ||
      name.includes('edicion racial') ||
      name.includes('edición racial')
    );
  }, [selectedFormat]);

  // Find selected edition and race names
  const selectedEdition = editions.find((e) => e.edition_id === builder.editionId);
  const selectedRace = races.find((r) => r.race_id === builder.raceId);

  const editionsForBlock = useMemo(() => {
    if (!blockId) return [];
    return editions
      .filter((e) => e.block_id === blockId)
      .slice()
      .sort((a, b) => {
        const sa = (a as { sort_order?: number }).sort_order ?? 0;
        const sb = (b as { sort_order?: number }).sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        return a.name.localeCompare(b.name, 'es');
      });
  }, [blockId, editions]);

  const racesForEdition = useMemo(() => {
    if (!builder.editionId) return [];
    if (!availableRaceIds) return races;
    return races.filter((r) => availableRaceIds.has(r.race_id));
  }, [builder.editionId, races, availableRaceIds]);

  React.useEffect(() => {
    if (!isEditionRacialFormat) {
      setBlockId('');
      setAvailableRaceIds(null);
      setIsLoadingAvailableRaces(false);
      return;
    }

    if (builder.editionId) {
      const ed = editions.find((e) => e.edition_id === builder.editionId);
      if (ed) setBlockId(ed.block_id);
    }
  }, [isEditionRacialFormat, builder.editionId, editions]);

  React.useEffect(() => {
    if (!isEditionRacialFormat || !builder.editionId) {
      setAvailableRaceIds(null);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setIsLoadingAvailableRaces(true);
      try {
        const res = await fetch(`/api/v1/catalog/editions/${builder.editionId}/races`, {
          signal: ctrl.signal,
        });
        const json = await res.json();
        if (json.ok) {
          setAvailableRaceIds(new Set<string>((json.data.items ?? []) as string[]));
        } else {
          setAvailableRaceIds(null);
        }
      } catch {
        setAvailableRaceIds(null);
      } finally {
        setIsLoadingAvailableRaces(false);
      }
    }, 150);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [isEditionRacialFormat, builder.editionId]);

  // Load deck if provided
  React.useEffect(() => {
    if (initialDeckId && !isMounted) {
      builder.loadDeck(initialDeckId);
      setIsMounted(true);
    }
  }, [initialDeckId, builder, isMounted]);

  const deckCardIds = useMemo(
    () => new Set(builder.cards.map((c) => c.card_printing_id)),
    [builder.cards],
  );

  const hasStartingGold = builder.cards.some((c) => c.is_starting_gold);
  const deckSize = 50; // TODO: Extract from format params
  const shouldShowValidation =
    builder.isValidating ||
    (builder.validation?.messages?.length ?? 0) > 0 ||
    (builder.validation ? !builder.validation.is_valid : false);

  // Wrappers for deck editor callbacks (convert printingId to slot data)
  const handleDeckAddCard = (printingId: string) => {
    const slot = builder.cards.find((c) => c.card_printing_id === printingId);
    if (slot) {
      builder.addCard({
        card_printing_id: slot.card_printing_id,
        image_url: slot.image_url,
        legal_status: slot.legal_status,
        edition: slot.edition,
        rarity_tier: slot.rarity_tier,
        card: slot.card,
      });
    }
  };

  const handleSave = async () => {
    const savedDeckId = await builder.saveDeck();
    if (savedDeckId && !builder.deckId) {
      // Redirect to edit page after first save
      router.push(`/builder/${savedDeckId}`);
    }
  };

  const handleClose = () => {
    if (builder.isDirty) {
      if (!confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?')) return;
    }
    router.push('/decks');
  };

  // Suggested tags based on the cards currently in the deck
  React.useEffect(() => {
    const payloadCards = builder.cards.map((c) => ({ card_id: c.card.card_id, qty: c.qty }));
    if (payloadCards.length === 0) {
      setSuggestedTags([]);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setIsLoadingSuggestedTags(true);
      try {
        const res = await fetch('/api/v1/tags/aggregate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cards: payloadCards }),
          signal: ctrl.signal,
        });
        const json = await res.json();
        if (json.ok) {
          setSuggestedTags(json.data.items ?? []);
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingSuggestedTags(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [builder.cards]);

  if (formatsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <Input
          value={builder.name}
          onChange={(e) => builder.setName(e.target.value)}
          placeholder="Nombre del mazo"
          className="h-8 max-w-xs text-sm font-semibold"
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Formato:</span>
            <FormatSelector
              formats={formats}
              value={builder.formatId}
              onChange={builder.setFormat}
              disabled={builder.isSaving}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span>Visibilidad:</span>
            <Select
              value={builder.visibility}
              onValueChange={(v) => builder.setVisibility(v as typeof builder.visibility)}
              disabled={builder.isSaving}
            >
              <SelectTrigger className="h-7 w-[140px] text-[11px]">
                <SelectValue placeholder="Visibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIVATE">Privado</SelectItem>
                <SelectItem value="UNLISTED">No listado</SelectItem>
                <SelectItem value="PUBLIC">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isEditionRacialFormat ? (
            <>
              <div className="flex items-center gap-1.5">
                <span>Bloque:</span>
                <Select
                  value={blockId || '__none__'}
                  onValueChange={(v) => {
                    const next = v === '__none__' ? '' : v;
                    setBlockId(next);
                    builder.setEditionId(null);
                    builder.setRaceId(null);
                  }}
                  disabled={builder.isSaving}
                >
                  <SelectTrigger className="h-7 w-[160px] text-[11px]">
                    <SelectValue placeholder="Bloque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Seleccionar bloque</SelectItem>
                    {blocks.map((b) => (
                      <SelectItem key={b.block_id} value={b.block_id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Edición:</span>
                <Select
                  value={builder.editionId || '__none__'}
                  onValueChange={(v) => {
                    const next = v === '__none__' ? null : v;
                    builder.setEditionId(next);
                    builder.setRaceId(null);
                    if (!next) return;
                    const ed = editions.find((e) => e.edition_id === next);
                    if (ed) setBlockId(ed.block_id);
                  }}
                  disabled={builder.isSaving || !blockId}
                >
                  <SelectTrigger className="h-7 w-[200px] text-[11px]">
                    <SelectValue placeholder={blockId ? 'Edición' : 'Primero elige un bloque'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Seleccionar edición</SelectItem>
                    {editionsForBlock.map((e) => (
                      <SelectItem key={e.edition_id} value={e.edition_id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Raza:</span>
                <Select
                  value={builder.raceId || '__none__'}
                  onValueChange={(v) => builder.setRaceId(v === '__none__' ? null : v)}
                  disabled={builder.isSaving || !builder.editionId || isLoadingAvailableRaces}
                >
                  <SelectTrigger className="h-7 w-[180px] text-[11px]">
                    <SelectValue
                      placeholder={
                        !builder.editionId
                          ? 'Primero elige una edición'
                          : isLoadingAvailableRaces
                            ? 'Cargando…'
                            : 'Raza'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Seleccionar raza</SelectItem>
                    {racesForEdition.map((r) => (
                      <SelectItem key={r.race_id} value={r.race_id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          {!isEditionRacialFormat && selectedEdition ? (
            <div className="flex items-center gap-1.5">
              <span>Edición:</span>
              <Badge variant="secondary" className="text-xs">
                {selectedEdition.name}
              </Badge>
            </div>
          ) : null}
          {!isEditionRacialFormat && selectedRace ? (
            <div className="flex items-center gap-1.5">
              <span>Raza:</span>
              <Badge variant="secondary" className="text-xs">
                {selectedRace.name}
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {builder.error && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{builder.error}</span>
            </div>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setDetailsOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Detalles
          </Button>
          <ExportDeckDialog
            versionId={builder.versionId}
            deckName={builder.name || 'Mazo sin nombre'}
          />
          <ImportDeckDialog
            deckId={builder.deckId}
            onImportSuccess={(_versionId) => {
              // Reload the deck after import
              if (builder.deckId) {
                builder.loadDeck(builder.deckId);
              }
            }}
          />
          <Button
            onClick={handleSave}
            disabled={builder.isSaving || !builder.formatId || !builder.name.trim()}
            size="sm"
            className="gap-1.5"
          >
            {builder.isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {builder.isDirty ? 'Guardar cambios' : 'Guardado'}
          </Button>
          <Button onClick={handleClose} variant="ghost" size="sm" className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            Cerrar
          </Button>
        </div>
      </div>

      <BuilderDeckDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        tagsCatalog={tagsCatalog}
        onTagCreated={(tag) =>
          setTagsCatalog((prev) => (prev.some((t) => t.tag_id === tag.tag_id) ? prev : [...prev, tag]))
        }
        selectedTagIds={builder.tagIds}
        onChangeSelectedTagIds={builder.setTagIds}
        suggestedTags={suggestedTags}
        isLoadingSuggestedTags={isLoadingSuggestedTags}
        description={builder.description}
        strategy={builder.strategy}
        coverImageUrl={builder.coverImageUrl}
        onChangeDescription={builder.setDescription}
        onChangeStrategy={builder.setStrategy}
        onChangeCoverImageUrl={builder.setCoverImageUrl}
      />

      {/* Main workspace - Desktop: 3 columns, Mobile: tabs */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden h-full flex-1 lg:flex">
          {/* Left: Card browser */}
          <div className="w-64 border-r border-border bg-card xl:w-72">
            <BuilderCardBrowser
              onAddCard={builder.addCard}
              deckCardIds={deckCardIds}
              preset={
                isEditionRacialFormat
                  ? {
                      block_id: blockId || null,
                      edition_id: builder.editionId || null,
                      race_id: builder.raceId || null,
                      lock_block: true,
                      lock_edition: true,
                      lock_race: true,
                      hide_block_edition_race_filters: true,
                      race_mode: 'ALLY_WHITELIST',
                    }
                  : undefined
              }
            />
          </div>

          {/* Center: Deck editor */}
          <div className="flex-1 border-r border-border">
            <BuilderDeckEditor
              groupedByType={builder.groupedByType}
              totalCards={builder.totalCards}
              deckSize={deckSize}
              hasStartingGold={hasStartingGold}
              isValid={builder.validation?.is_valid ?? null}
              onAddCard={handleDeckAddCard}
              onRemoveCard={builder.removeCard}
              onSetStartingGold={builder.setStartingGold}
              onReplacePrinting={builder.replacePrinting}
            />
          </div>

          {/* Right: Validation + Stats */}
          <div className="flex w-[40px] flex-col bg-card xl:w-[720px]">
            {shouldShowValidation ? (
              <div className="flex max-h-[240px] flex-col border-b border-border">
                <div className="px-4 py-2.5 border-b border-border">
                  <span className="text-xs font-semibold">Validación</span>
                </div>
                <BuilderValidationPanel
                  validation={builder.validation}
                  isValidating={builder.isValidating}
                />
              </div>
            ) : null}
            <div className="min-h-0 flex-1">
              <Tabs defaultValue="stats" className="flex h-full flex-col">
                <div className="border-b border-border px-2 py-2">
                  <TabsList className="h-8 w-full">
                    <TabsTrigger value="stats" className="flex-1 text-xs">Estadísticas</TabsTrigger>
                    <TabsTrigger value="mulligan" className="flex-1 text-xs">Mulligan</TabsTrigger>
                    <TabsTrigger value="costeo" className="flex-1 text-xs">Costeo</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="stats" className="min-h-0 flex-1 overflow-hidden">
                  <BuilderStatsPanel stats={builder.validation?.computed_stats ?? null} />
                </TabsContent>
                <TabsContent value="mulligan" className="min-h-0 flex-1 overflow-hidden p-3">
                  <BuilderMulliganSimulator cards={builder.cards} />
                </TabsContent>
                <TabsContent value="costeo" className="min-h-0 flex-1 overflow-hidden p-3">
                  <BuilderCostPanel cards={builder.cards} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex h-full w-full flex-col lg:hidden">
          <Tabs defaultValue="deck" className="flex h-full flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="catalog" className="flex-1">
                Catalogo
              </TabsTrigger>
              <TabsTrigger value="deck" className="flex-1">
                Mazo ({builder.totalCards}/{deckSize})
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-1">
                Panel
              </TabsTrigger>
            </TabsList>
            <TabsContent value="catalog" className="flex-1 overflow-hidden">
              <BuilderCardBrowser
                onAddCard={builder.addCard}
                deckCardIds={deckCardIds}
                preset={
                  isEditionRacialFormat
                    ? {
                        block_id: blockId || null,
                        edition_id: builder.editionId || null,
                        race_id: builder.raceId || null,
                        lock_block: true,
                        lock_edition: true,
                        lock_race: true,
                        hide_block_edition_race_filters: true,
                        race_mode: 'ALLY_WHITELIST',
                      }
                    : undefined
                }
              />
            </TabsContent>
            <TabsContent value="deck" className="flex-1 overflow-hidden">
              <BuilderDeckEditor
                groupedByType={builder.groupedByType}
                totalCards={builder.totalCards}
                deckSize={deckSize}
                hasStartingGold={hasStartingGold}
                isValid={builder.validation?.is_valid ?? null}
                onAddCard={handleDeckAddCard}
                onRemoveCard={builder.removeCard}
                onSetStartingGold={builder.setStartingGold}
                onReplacePrinting={builder.replacePrinting}
              />
            </TabsContent>
            <TabsContent value="stats" className="flex-1 overflow-hidden">
              <div className="flex h-full flex-col">
                {shouldShowValidation ? (
                  <div className="border-b border-border p-3">
                    <h3 className="mb-2 text-sm font-semibold">Validación</h3>
                    <BuilderValidationPanel
                      validation={builder.validation}
                      isValidating={builder.isValidating}
                    />
                  </div>
                ) : null}
                <div className="min-h-0 flex-1">
                  <Tabs defaultValue="stats" className="flex h-full flex-col">
                    <div className="border-b border-border p-3">
                      <TabsList className="h-8 w-full">
                        <TabsTrigger value="stats" className="flex-1 text-xs">Estadísticas</TabsTrigger>
                        <TabsTrigger value="mulligan" className="flex-1 text-xs">Mulligan</TabsTrigger>
                        <TabsTrigger value="costeo" className="flex-1 text-xs">Costeo</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="stats" className="min-h-0 flex-1 overflow-hidden">
                      <BuilderStatsPanel stats={builder.validation?.computed_stats ?? null} />
                    </TabsContent>
                    <TabsContent value="mulligan" className="min-h-0 flex-1 overflow-auto p-3">
                      <BuilderMulliganSimulator cards={builder.cards} />
                    </TabsContent>
                    <TabsContent value="costeo" className="min-h-0 flex-1 overflow-auto p-3">
                      <BuilderCostPanel cards={builder.cards} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
