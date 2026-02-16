'use client';

import { useState, useMemo } from 'react';
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
import { Search, Plus, Loader2 } from 'lucide-react';

interface BuilderCardBrowserProps {
  onAddCard: (card: CardPrintingData) => void;
  deckCardIds: Set<string>;
}

export function BuilderCardBrowser({ onAddCard, deckCardIds }: BuilderCardBrowserProps) {
  const [search, setSearch] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('');
  const [raceFilter, setRaceFilter] = useState('');

  const { cardTypes, races } = useCatalogData();

  const filters = useMemo(() => ({
    q: search || undefined,
    card_type_id: cardTypeFilter || undefined,
    race_id: raceFilter || undefined,
    limit: 50,
  }), [search, cardTypeFilter, raceFilter]);

  const { cards, isLoading, hasMore, loadMore } = useCards(filters);

  return (
    <div className="flex h-full flex-col">
      {/* Search & Filters */}
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
        <div className="flex gap-2">
          <Select value={cardTypeFilter || '__all__'} onValueChange={(v) => setCardTypeFilter(v === '__all__' ? '' : v)}>
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
          <Select value={raceFilter || '__all__'} onValueChange={(v) => setRaceFilter(v === '__all__' ? '' : v)}>
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
        </div>
      </div>

      {/* Card list */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {isLoading && cards.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : cards.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No se encontraron cartas
            </p>
          ) : (
            <>
              {cards.map((item) => {
                const inDeck = deckCardIds.has(item.card_printing_id);
                const printing: CardPrintingData = {
                  card_printing_id: item.card_printing_id,
                  image_url: item.image_url,
                  legal_status: item.legal_status as CardPrintingData['legal_status'],
                  edition: item.edition,
                  rarity_tier: item.rarity_tier ? { name: item.rarity_tier.name, code: item.rarity_tier.code } : null,
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

                return (
                  <div
                    key={item.card_printing_id}
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                  >
                    {/* Mini image */}
                    <div className="h-9 w-6 flex-shrink-0 overflow-hidden rounded-sm">
                      <CardImage
                        src={item.image_url}
                        alt={item.card.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.card.name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          {item.card.card_type.name}
                        </span>
                        {item.card.cost !== null && (
                          <span className="text-[10px] text-muted-foreground">· C:{item.card.cost}</span>
                        )}
                        <Badge variant="outline" className="h-3.5 px-1 text-[9px]">
                          {editionDisplayName(item.edition.name)}
                        </Badge>
                      </div>
                    </div>

                    {/* Add button */}
                    <Button
                      type="button"
                      variant={inDeck ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onAddCard(printing)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}

              {/* Load more */}
              {hasMore && (
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
                    Cargar mas
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
