'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDeckBuilder } from '@/hooks/use-deck-builder';
import { useFormats } from '@/hooks/use-formats';
import { useEditions, useRaces } from '@/hooks/use-catalog';
import { BuilderCardBrowser } from './builder-card-browser';
import { BuilderDeckEditor } from './builder-deck-editor';
import { BuilderValidationPanel } from './builder-validation-panel';
import { BuilderStatsPanel } from './builder-stats-panel';
import { FormatSelector } from './format-selector';
import { ExportDeckDialog } from './export-deck-dialog';
import { ImportDeckDialog } from './import-deck-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Loader2, AlertCircle } from 'lucide-react';

interface BuilderWorkspaceProps {
  initialDeckId?: string;
  initialFormatId?: string;
}

export function BuilderWorkspace({ initialDeckId, initialFormatId }: BuilderWorkspaceProps) {
  const router = useRouter();
  const { formats, isLoading: formatsLoading } = useFormats();
  const { editions } = useEditions();
  const { races } = useRaces();
  const [isMounted, setIsMounted] = useState(false);

  const builder = useDeckBuilder(initialFormatId);

  // Find selected edition and race names
  const selectedEdition = editions.find((e) => e.edition_id === builder.editionId);
  const selectedRace = races.find((r) => r.race_id === builder.raceId);

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
    router.push('/builder');
  };

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
          {selectedEdition && (
            <div className="flex items-center gap-1.5">
              <span>Edición:</span>
              <Badge variant="secondary" className="text-xs">
                {selectedEdition.name}
              </Badge>
            </div>
          )}
          {selectedRace && (
            <div className="flex items-center gap-1.5">
              <span>Raza:</span>
              <Badge variant="secondary" className="text-xs">
                {selectedRace.name}
              </Badge>
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {builder.error && (
            <div className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{builder.error}</span>
            </div>
          )}
          <ExportDeckDialog
            versionId={builder.versionId}
            deckName={builder.name || 'Mazo sin nombre'}
          />
          <ImportDeckDialog
            deckId={builder.deckId}
            onImportSuccess={(versionId) => {
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

      {/* Main workspace - Desktop: 3 columns, Mobile: tabs */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden h-full flex-1 lg:flex">
          {/* Left: Card browser */}
          <div className="w-80 border-r border-border bg-card">
            <BuilderCardBrowser onAddCard={builder.addCard} deckCardIds={deckCardIds} />
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
            />
          </div>

          {/* Right: Validation + Stats */}
          <div className="flex w-80 flex-col">
            <div className="flex-1 border-b border-border">
              <div className="px-4 py-2.5 border-b border-border">
                <span className="text-xs font-semibold">Validacion</span>
              </div>
              <BuilderValidationPanel
                validation={builder.validation}
                isValidating={builder.isValidating}
              />
            </div>
            <div className="flex-1">
              <div className="px-4 py-2.5 border-b border-border">
                <span className="text-xs font-semibold">Estadisticas</span>
              </div>
              <BuilderStatsPanel stats={builder.validation?.computed_stats ?? null} />
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
                Validacion
              </TabsTrigger>
            </TabsList>
            <TabsContent value="catalog" className="flex-1 overflow-hidden">
              <BuilderCardBrowser onAddCard={builder.addCard} deckCardIds={deckCardIds} />
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
              />
            </TabsContent>
            <TabsContent value="stats" className="flex-1 space-y-4 overflow-auto p-3">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Validacion</h3>
                <BuilderValidationPanel
                  validation={builder.validation}
                  isValidating={builder.isValidating}
                />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Estadisticas</h3>
                <BuilderStatsPanel stats={builder.validation?.computed_stats ?? null} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
