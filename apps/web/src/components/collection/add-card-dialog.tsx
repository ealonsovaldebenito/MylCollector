/**
 * AddCardDialog — Diálogo para agregar cartas a la colección.
 * Incluye búsqueda real contra el catálogo (/api/v1/cards).
 * Condiciones cargadas desde BD (card_conditions).
 *
 * Changelog:
 *   2026-02-18 — Reescritura: búsqueda real con debounce, selección de printing
 *   2026-02-18 — Fix: condiciones dinámicas desde BD en vez de hardcoded
 *   2026-02-18 — Feat: precio usuario, en venta, creación en carpeta actual
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CardImage } from '@/components/catalog/card-image';
import { Search, Loader2, ArrowLeft, Plus, Package } from 'lucide-react';
import { editionDisplayName } from '@myl/shared';
import { cn } from '@/lib/utils';
import type { CardCondition, CardConditionRef } from '@myl/shared';

interface SearchResult {
  card_printing_id: string;
  image_url: string | null;
  legal_status: string;
  edition: { name: string; code: string };
  rarity_tier: { name: string; code: string } | null;
  card: {
    name: string;
    cost: number | null;
    card_type: { name: string };
    race: { name: string } | null;
  };
  store_min_price: number | null;
}

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected card (e.g. from catalog quick-add) */
  cardPrintingId?: string;
  cardName?: string;
  /** Conditions loaded from DB (card_conditions table) */
  conditions?: CardConditionRef[];
  /** Current collection/folder ID (null = General, undefined = no folder context) */
  collectionId?: string | null;
  onAdd: (data: {
    card_printing_id: string;
    qty: number;
    condition: CardCondition;
    notes?: string;
    user_price?: number | null;
    is_for_sale?: boolean;
    collection_id?: string | null;
  }) => Promise<void>;
}

/** Fallback si no se cargan condiciones de la BD */
const FALLBACK_CONDITIONS: CardConditionRef[] = [
  { condition_id: '', code: 'PERFECTA', name: 'Perfecta (9-10)', sort_order: 10 },
  { condition_id: '', code: 'CASI PERFECTA', name: 'Casi Perfecta (8)', sort_order: 9 },
  { condition_id: '', code: 'EXCELENTE', name: 'Excelente (7)', sort_order: 8 },
  { condition_id: '', code: 'BUENA', name: 'Buena (6)', sort_order: 6 },
  { condition_id: '', code: 'POCO USO', name: 'Poco Jugada (5)', sort_order: 5 },
  { condition_id: '', code: 'JUGADA', name: 'Jugada (4)', sort_order: 3 },
  { condition_id: '', code: 'MALAS CONDICIONES', name: 'Pobre (1-3)', sort_order: 1 },
];

const RARITY_COLORS: Record<string, string> = {
  COMUN: 'bg-zinc-500/20 text-zinc-400',
  POCO_COMUN: 'bg-blue-500/20 text-blue-400',
  RARA: 'bg-purple-500/20 text-purple-400',
  ULTRA_RARA: 'bg-amber-500/20 text-amber-400',
  SECRETA: 'bg-yellow-500/20 text-yellow-400',
};

export function AddCardDialog({
  open,
  onOpenChange,
  cardPrintingId: preselectedId,
  cardName: preselectedName,
  conditions: conditionsProp,
  collectionId,
  onAdd,
}: AddCardDialogProps) {
  const conditionOptions = conditionsProp && conditionsProp.length > 0
    ? conditionsProp
    : FALLBACK_CONDITIONS;

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Selection state
  const [selected, setSelected] = useState<SearchResult | null>(null);

  // Form state
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState<CardCondition>('PERFECTA');
  const [notes, setNotes] = useState('');
  const [userPrice, setUserPrice] = useState('');
  const [isForSale, setIsForSale] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search cards from API
  const searchCards = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({ q, limit: '12' });
      const res = await fetch(`/api/v1/cards?${params}`);
      const json = await res.json();

      if (!json.ok) {
        setSearchError(json.error?.message ?? 'Error al buscar');
        return;
      }

      setResults(json.data.items ?? []);
    } catch {
      setSearchError('Error de conexión');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchCards(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchCards]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(null);
      setQty(1);
      setCondition('PERFECTA');
      setNotes('');
      setUserPrice('');
      setIsForSale(false);
      setSearchError(null);

      if (preselectedId && preselectedName) {
        setSelected({
          card_printing_id: preselectedId,
          image_url: null,
          legal_status: 'STANDARD',
          edition: { name: '', code: '' },
          rarity_tier: null,
          card: {
            name: preselectedName,
            cost: null,
            card_type: { name: '' },
            race: null,
          },
          store_min_price: null,
        });
      } else {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  }, [open, preselectedId, preselectedName]);

  function handleSelectCard(card: SearchResult) {
    setSelected(card);
  }

  function handleBackToSearch() {
    setSelected(null);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }

  async function handleSubmit() {
    if (!selected) return;

    setIsSubmitting(true);
    try {
      const parsedPrice = userPrice ? parseFloat(userPrice) : null;
      await onAdd({
        card_printing_id: selected.card_printing_id,
        qty,
        condition,
        notes: notes.trim() || undefined,
        user_price: parsedPrice && parsedPrice > 0 ? parsedPrice : null,
        is_for_sale: isForSale,
        collection_id: collectionId !== undefined ? collectionId : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to collection:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Agregar a Colección
          </DialogTitle>
          <DialogDescription>
            {selected
              ? `Configurando "${selected.card.name}"`
              : 'Busca una carta del catálogo para agregarla'}
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          /* -- STEP 1: Search & Select -- */
          <div className="flex-1 overflow-hidden flex flex-col gap-3 py-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar carta por nombre..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-10"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto min-h-0 max-h-[350px] space-y-1 rounded-md border border-border/50 p-1">
              {searchError && (
                <p className="text-sm text-destructive p-3 text-center">{searchError}</p>
              )}

              {!isSearching && query.length >= 2 && results.length === 0 && !searchError && (
                <p className="text-sm text-muted-foreground p-6 text-center">
                  No se encontraron cartas para &quot;{query}&quot;
                </p>
              )}

              {query.length < 2 && !isSearching && (
                <p className="text-sm text-muted-foreground p-6 text-center">
                  Escribe al menos 2 caracteres para buscar
                </p>
              )}

              {results.map((card) => (
                <button
                  key={card.card_printing_id}
                  type="button"
                  className={cn(
                    'flex items-center gap-3 w-full rounded-md p-2 text-left transition-colors',
                    'hover:bg-accent/10 focus:bg-accent/10 focus:outline-none',
                  )}
                  onClick={() => handleSelectCard(card)}
                >
                  <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                    <CardImage
                      src={card.image_url}
                      alt={card.card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{card.card.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {card.card.card_type.name}
                      </span>
                      {card.card.cost !== null && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono">
                          {card.card.cost}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        {editionDisplayName(card.edition.name)}
                      </span>
                      {card.rarity_tier && (
                        <Badge
                          className={cn(
                            'h-4 px-1 text-[10px]',
                            RARITY_COLORS[card.rarity_tier.code] ?? RARITY_COLORS.COMUN,
                          )}
                        >
                          {card.rarity_tier.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {card.store_min_price != null ? (
                      <span className="text-xs font-mono text-accent">
                        ${card.store_min_price.toLocaleString('es-CL')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Sin precio</span>
                    )}
                  </div>
                  <Plus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* -- STEP 2: Configure & Add -- */
          <div className="space-y-4 py-2 overflow-y-auto max-h-[50vh]">
            {/* Selected card preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-1/50 border border-border/30">
              {selected.image_url && (
                <div className="w-12 h-[68px] flex-shrink-0 rounded overflow-hidden">
                  <CardImage
                    src={selected.image_url}
                    alt={selected.card.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{selected.card.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.card.card_type.name}
                  {selected.edition.name && ` · ${editionDisplayName(selected.edition.name)}`}
                </p>
                {selected.rarity_tier && (
                  <Badge
                    className={cn(
                      'mt-1 h-4 px-1 text-[10px]',
                      RARITY_COLORS[selected.rarity_tier.code] ?? RARITY_COLORS.COMUN,
                    )}
                  >
                    {selected.rarity_tier.name}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleBackToSearch} className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Cambiar
              </Button>
            </div>

            {/* Quantity + Condition row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-qty">Cantidad</Label>
                <Input
                  id="add-qty"
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-condition">Condición</Label>
                <Select value={condition} onValueChange={(v) => setCondition(v as CardCondition)}>
                  <SelectTrigger id="add-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((opt) => (
                      <SelectItem key={opt.code} value={opt.code}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="add-price">Mi precio (opcional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="add-price"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Ej: 5000"
                  value={userPrice}
                  onChange={(e) => setUserPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                El precio que TU asignas a esta carta. Puedes cambiarlo después.
              </p>
            </div>

            {/* For sale toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border/30 p-3">
              <div>
                <Label htmlFor="add-for-sale" className="text-sm font-medium">En venta</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Marcar esta carta como disponible para vender
                </p>
              </div>
              <Switch
                id="add-for-sale"
                checked={isForSale}
                onCheckedChange={setIsForSale}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notas (opcional)</Label>
              <Textarea
                id="add-notes"
                placeholder="Ej: Comprada en torneo, firmada, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          {selected && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Agregando...' : `Agregar ${qty > 1 ? `(x${qty})` : ''}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
