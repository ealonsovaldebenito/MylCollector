/**
 * File: apps/web/src/components/builder/builder-card-browser.tsx
 *
 * BuilderCardBrowser — Buscador/selector de cartas para el builder.
 * Permite filtros por tipo/raza/era/edición y bloquea el botón + cuando
 * el mazo no puede aceptar más copias según reglas activas.
 *
 * Changelog:
 * - 2026-02-18 — Muestra badges de Banlist/Limitadas por formato dentro de cada carta.
 * - 2026-02-18 — Soporte para deshabilitar + por límites de copias/tamaño.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CardPrintingData } from '@/hooks/use-deck-builder';
import { useCards } from '@/hooks/use-cards';
import { useCatalogData } from '@/hooks/use-catalog-data';
import { editionDisplayName } from '@myl/shared';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardImage } from '@/components/catalog/card-image';
import { Loader2, Plus, Search } from 'lucide-react';

interface BuilderCardBrowserProps {
  onAddCard: (card: CardPrintingData) => void;
  deckCardIds: Set<string>;
  canAddCard?: (card: CardPrintingData) => boolean;
  getCardCopyLimit?: (
    cardId: string,
    options: { is_unique: boolean; legal_status: CardPrintingData['legal_status'] },
  ) => number;
  getFormatLimitOverride?: (cardId: string) => number | undefined;
  preset?: {
    block_id?: string | null;
    edition_id?: string | null;
    race_id?: string | null;
    lock_block?: boolean;
    lock_edition?: boolean;
    lock_race?: boolean;
    hide_block_edition_race_filters?: boolean;
    race_mode?: 'STRICT_FILTER' | 'ALLY_WHITELIST';
  };
}

export function BuilderCardBrowser({
  onAddCard,
  deckCardIds,
  canAddCard,
  getCardCopyLimit,
  getFormatLimitOverride,
  preset,
}: BuilderCardBrowserProps) {
  const [search, setSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('');
  const [raceFilter, setRaceFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [editionFilter, setEditionFilter] = useState('');

  const { cardTypes, races, blocks, editions } = useCatalogData();

  useEffect(() => {
    if (!preset) return;
    if (preset.block_id !== undefined) setBlockFilter(preset.block_id ?? '');
    if (preset.edition_id !== undefined) setEditionFilter(preset.edition_id ?? '');

    if (preset.race_mode === 'STRICT_FILTER') {
      if (preset.race_id !== undefined) setRaceFilter(preset.race_id ?? '');
    } else if (preset.lock_race) {
      setRaceFilter('');
    }
  }, [preset]);

  const effectiveBlockId = preset?.block_id ?? blockFilter;
  const effectiveEditionId = preset?.edition_id ?? editionFilter;
  const effectiveRaceId =
    preset?.race_mode === 'STRICT_FILTER' ? (preset?.race_id ?? raceFilter) : raceFilter;

  const filteredEditions = useMemo(
    () => (blockFilter ? editions.filter((e) => e.block_id === blockFilter) : editions),
    [blockFilter, editions],
  );

  const filters = useMemo(
    () => ({
      q: search || undefined,
      card_type_id: cardTypeFilter || undefined,
      race_id: effectiveRaceId || undefined,
      block_id: effectiveBlockId || undefined,
      edition_id: effectiveEditionId || undefined,
      limit: 50,
    }),
    [search, cardTypeFilter, effectiveRaceId, effectiveBlockId, effectiveEditionId],
  );

  const { cards, isLoading, hasMore, loadMore } = useCards(filters);

  const visibleCards = useMemo(() => {
    if (preset?.race_mode !== 'ALLY_WHITELIST' || !preset.race_id) return cards;
    const raceId = preset.race_id;
    return cards.filter((c) => c.card.race_id === null || c.card.race_id === raceId);
  }, [cards, preset?.race_id, preset?.race_mode]);

  const gridColsClass = preset?.hide_block_edition_race_filters ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar carta..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className={`grid ${gridColsClass} gap-2`}>
          <Select
            value={cardTypeFilter || '__all__'}
            onValueChange={(v) => setCardTypeFilter(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los tipos</SelectItem>
              {cardTypes.map((t) => (
                <SelectItem key={t.card_type_id} value={t.card_type_id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {preset?.hide_block_edition_race_filters ? null : (
            <Select
              value={raceFilter || '__all__'}
              onValueChange={(v) => setRaceFilter(v === '__all__' ? '' : v)}
              disabled={preset?.lock_race}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Raza" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las razas</SelectItem>
                {races.map((r) => (
                  <SelectItem key={r.race_id} value={r.race_id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {preset?.hide_block_edition_race_filters ? null : (
            <Select
              value={blockFilter || '__all__'}
              onValueChange={(v) => {
                const next = v === '__all__' ? '' : v;
                setBlockFilter(next);
                setEditionFilter('');
              }}
              disabled={preset?.lock_block}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Era" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las eras</SelectItem>
                {blocks.map((b) => (
                  <SelectItem key={b.block_id} value={b.block_id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {preset?.hide_block_edition_race_filters ? null : (
            <Select
              value={editionFilter || '__all__'}
              onValueChange={(v) => {
                const nextEditionId = v === '__all__' ? '' : v;
                setEditionFilter(nextEditionId);
                if (!nextEditionId) return;
                const edition = editions.find((e) => e.edition_id === nextEditionId);
                if (edition && !blockFilter) setBlockFilter(edition.block_id);
              }}
              disabled={preset?.lock_edition}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Edición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las ediciones</SelectItem>
                {filteredEditions.map((e) => (
                  <SelectItem key={e.edition_id} value={e.edition_id}>
                    {editionDisplayName(e.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {isLoading && visibleCards.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : visibleCards.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No se encontraron cartas</p>
          ) : (
            <>
              {visibleCards.map((item) => {
                const inDeck = deckCardIds.has(item.card_printing_id);
                const printing: CardPrintingData = {
                  card_printing_id: item.card_printing_id,
                  image_url: item.image_url,
                  legal_status: item.legal_status as CardPrintingData['legal_status'],
                  edition: item.edition,
                  rarity_tier: item.rarity_tier
                    ? { name: item.rarity_tier.name, code: item.rarity_tier.code }
                    : null,
                  card: {
                    card_id: item.card.card_id,
                    name: item.card.name,
                    card_type: item.card.card_type,
                    race: item.card.race,
                    cost: item.card.cost,
                    is_unique: item.card.is_unique,
                    has_ability: item.card.has_ability,
                    can_be_starting_gold: item.card.can_be_starting_gold,
                    text: item.card.text,
                  },
                };
                const isAddDisabled = canAddCard ? !canAddCard(printing) : false;
                const maxCopiesForCard = getCardCopyLimit
                  ? getCardCopyLimit(item.card.card_id, {
                      is_unique: item.card.is_unique,
                      legal_status: item.legal_status as CardPrintingData['legal_status'],
                    })
                  : item.card.is_unique
                    ? 1
                    : 3;
                const overrideLimit = getFormatLimitOverride?.(item.card.card_id);
                const isFormatBanned = maxCopiesForCard <= 0 || overrideLimit === 0;
                const isRestricted =
                  !isFormatBanned &&
                  (item.legal_status === 'RESTRICTED' || (overrideLimit !== undefined && maxCopiesForCard <= 2));

                return (
                  <div
                    key={item.card_printing_id}
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="h-9 w-6 flex-shrink-0 overflow-hidden rounded-sm">
                      <CardImage
                        src={item.image_url}
                        alt={item.card.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.card.name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{item.card.card_type.name}</span>
                        {item.card.cost !== null ? (
                          <span className="text-[10px] text-muted-foreground">· C:{item.card.cost}</span>
                        ) : null}
                        {isFormatBanned ? (
                          <Badge variant="destructive" className="h-3.5 px-1 text-[9px]">
                            Banlist
                          </Badge>
                        ) : isRestricted ? (
                          <Badge variant="outline" className="h-3.5 px-1 text-[9px]">
                            Lim {maxCopiesForCard}
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="h-3.5 px-1 text-[9px]">
                          {editionDisplayName(item.edition.name)}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={inDeck ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => onAddCard(printing)}
                      disabled={isAddDisabled}
                      title={isAddDisabled ? 'No puedes agregar mas copias de esta carta' : 'Agregar'}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {isLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                    Cargar más
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
