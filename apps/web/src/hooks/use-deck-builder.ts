'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { LegalStatus, ValidationResult } from '@myl/shared';

// ============================================================================
// Types
// ============================================================================

export interface DeckCardSlot {
  card_printing_id: string;
  qty: number;
  is_starting_gold: boolean;
  card: {
    card_id: string;
    name: string;
    card_type: { card_type_id: string; name: string; code: string; sort_order: number };
    race: { race_id: string; name: string; code: string; sort_order: number } | null;
    cost: number | null;
    is_unique: boolean;
    has_ability: boolean;
    can_be_starting_gold: boolean;
    text: string | null;
  };
  edition: { edition_id: string; block_id: string; name: string; code: string };
  rarity_tier: { name: string; code: string } | null;
  image_url: string | null;
  legal_status: LegalStatus;
}

interface CardGrouping {
  typeName: string;
  typeCode: string;
  sortOrder: number;
  cards: DeckCardSlot[];
  totalQty: number;
}

export interface DeckBuilderActions {
  addCard: (printing: CardPrintingData) => void;
  removeCard: (printingId: string) => void;
  setQty: (printingId: string, qty: number) => void;
  setStartingGold: (printingId: string) => void;
  clearStartingGold: () => void;
  setFormat: (formatId: string) => void;
  setName: (name: string) => void;
  saveDeck: () => Promise<string | null>;
  loadDeck: (deckId: string) => Promise<void>;
  clearDeck: () => void;
}

export interface DeckBuilderState {
  deckId: string | null;
  versionId: string | null;
  name: string;
  formatId: string;
  editionId: string | null;
  raceId: string | null;
  cards: DeckCardSlot[];
  validation: ValidationResult | null;
  isValidating: boolean;
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
  totalCards: number;
  groupedByType: CardGrouping[];
}

/** Data shape expected when adding a card from the browser */
export interface CardPrintingData {
  card_printing_id: string;
  image_url: string | null;
  legal_status: LegalStatus;
  edition: { edition_id: string; block_id: string; name: string; code: string };
  rarity_tier: { name: string; code: string } | null;
  card: {
    card_id: string;
    name: string;
    card_type: { card_type_id: string; name: string; code: string; sort_order: number };
    race: { race_id: string; name: string; code: string; sort_order: number } | null;
    cost: number | null;
    is_unique: boolean;
    has_ability: boolean;
    can_be_starting_gold: boolean;
    text: string | null;
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useDeckBuilder(initialFormatId?: string): DeckBuilderState & DeckBuilderActions {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [name, setNameState] = useState('Nuevo mazo');
  const [formatId, setFormatId] = useState(initialFormatId ?? '');
  const [editionId, setEditionId] = useState<string | null>(null);
  const [raceId, setRaceId] = useState<string | null>(null);
  const [cards, setCards] = useState<DeckCardSlot[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Computed: total cards
  const totalCards = useMemo(() => cards.reduce((sum, c) => sum + c.qty, 0), [cards]);

  // Computed: grouped by type
  const groupedByType = useMemo(() => {
    const groups = new Map<string, CardGrouping>();

    for (const slot of cards) {
      const key = slot.card.card_type.code;
      const existing = groups.get(key);
      if (existing) {
        existing.cards.push(slot);
        existing.totalQty += slot.qty;
      } else {
        groups.set(key, {
          typeName: slot.card.card_type.name,
          typeCode: key,
          sortOrder: slot.card.card_type.sort_order,
          cards: [slot],
          totalQty: slot.qty,
        });
      }
    }

    // Sort groups by type sort_order, cards within by cost then name
    const sorted = Array.from(groups.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    for (const group of sorted) {
      group.cards.sort((a, b) => {
        const costA = a.card.cost ?? 999;
        const costB = b.card.cost ?? 999;
        if (costA !== costB) return costA - costB;
        return a.card.name.localeCompare(b.card.name);
      });
    }
    return sorted;
  }, [cards]);

  // --- Live validation ---
  const triggerValidation = useCallback(() => {
    if (!formatId) return;
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);

    validateTimerRef.current = setTimeout(async () => {
      setIsValidating(true);
      try {
        const payload = {
          format_id: formatId,
          cards: cards.map((c) => ({
            card_printing_id: c.card_printing_id,
            qty: c.qty,
            is_starting_gold: c.is_starting_gold,
          })),
        };
        const res = await fetch('/api/v1/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.ok) {
          setValidation(json.data);
        }
      } catch {
        // Silently fail validation — will retry on next change
      } finally {
        setIsValidating(false);
      }
    }, 500);
  }, [formatId, cards]);

  // Re-validate when cards or format changes
  useEffect(() => {
    if (formatId && cards.length > 0) {
      triggerValidation();
    } else if (cards.length === 0) {
      setValidation(null);
    }
    return () => {
      if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    };
  }, [triggerValidation, formatId, cards]);

  // --- Actions ---

  const addCard = useCallback((printing: CardPrintingData) => {
    setCards((prev) => {
      const existing = prev.find((c) => c.card_printing_id === printing.card_printing_id);
      if (existing) {
        // Check limits
        const maxQty = printing.card.is_unique ? 1 : 3;
        if (existing.qty >= maxQty) return prev;
        return prev.map((c) =>
          c.card_printing_id === printing.card_printing_id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      // New card
      const slot: DeckCardSlot = {
        card_printing_id: printing.card_printing_id,
        qty: 1,
        is_starting_gold: false,
        card: printing.card,
        edition: printing.edition,
        rarity_tier: printing.rarity_tier,
        image_url: printing.image_url,
        legal_status: printing.legal_status,
      };
      return [...prev, slot];
    });
    setIsDirty(true);
  }, []);

  const removeCard = useCallback((printingId: string) => {
    setCards((prev) => {
      const existing = prev.find((c) => c.card_printing_id === printingId);
      if (!existing) return prev;
      if (existing.qty > 1) {
        return prev.map((c) =>
          c.card_printing_id === printingId ? { ...c, qty: c.qty - 1 } : c,
        );
      }
      return prev.filter((c) => c.card_printing_id !== printingId);
    });
    setIsDirty(true);
  }, []);

  const setQty = useCallback((printingId: string, qty: number) => {
    if (qty <= 0) {
      setCards((prev) => prev.filter((c) => c.card_printing_id !== printingId));
    } else {
      setCards((prev) =>
        prev.map((c) => (c.card_printing_id === printingId ? { ...c, qty } : c)),
      );
    }
    setIsDirty(true);
  }, []);

  const setStartingGold = useCallback((printingId: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        is_starting_gold: c.card_printing_id === printingId,
      })),
    );
    setIsDirty(true);
  }, []);

  const clearStartingGold = useCallback(() => {
    setCards((prev) => prev.map((c) => ({ ...c, is_starting_gold: false })));
    setIsDirty(true);
  }, []);

  const setFormat = useCallback((newFormatId: string) => {
    setFormatId(newFormatId);
    setIsDirty(true);
  }, []);

  const setName = useCallback((newName: string) => {
    setNameState(newName);
    setIsDirty(true);
  }, []);

  const saveDeck = useCallback(async (): Promise<string | null> => {
    if (!formatId || !name.trim()) {
      setError('Nombre y formato son requeridos');
      return null;
    }

    setIsSaving(true);
    setError(null);
    try {
      let currentDeckId = deckId;

      // Create deck if new
      if (!currentDeckId) {
        const res = await fetch('/api/v1/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, format_id: formatId }),
        });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error?.message ?? 'Error al crear mazo');
          return null;
        }
        currentDeckId = json.data.deck_id;
        setDeckId(currentDeckId);
      } else {
        // Update metadata
        await fetch(`/api/v1/decks/${currentDeckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, format_id: formatId }),
        });
      }

      // Create version
      const versionPayload = {
        cards: cards.map((c) => ({
          card_printing_id: c.card_printing_id,
          qty: c.qty,
          is_starting_gold: c.is_starting_gold,
        })),
      };

      const vRes = await fetch(`/api/v1/decks/${currentDeckId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionPayload),
      });
      const vJson = await vRes.json();
      if (!vJson.ok) {
        setError(vJson.error?.message ?? 'Error al guardar version');
        return null;
      }

      setVersionId(vJson.data.deck_version_id);
      setIsDirty(false);
      return currentDeckId;
    } catch {
      setError('Error de conexion');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [deckId, name, formatId, cards]);

  const loadDeck = useCallback(async (loadDeckId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/v1/decks/${loadDeckId}`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar mazo');
        return;
      }

      const deck = json.data;
      setDeckId(deck.deck_id);
      setNameState(deck.name);
      setFormatId(deck.format_id);
      setEditionId(deck.edition_id ?? null);
      setRaceId(deck.race_id ?? null);

      // Load latest version cards
      if (deck.latest_version) {
        const currentVersionId = deck.latest_version.deck_version_id;
        setVersionId(currentVersionId);
        const vRes = await fetch(`/api/v1/deck-versions/${currentVersionId}`);
        const vJson = await vRes.json();
        if (vJson.ok && vJson.data.cards) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedCards: DeckCardSlot[] = vJson.data.cards.map((row: any) => {
            const cp = row.card_printing;
            return {
              card_printing_id: cp.card_printing_id,
              qty: row.qty,
              is_starting_gold: row.is_starting_gold,
              card: {
                card_id: cp.card.card_id,
                name: cp.card.name,
                card_type: cp.card.card_type,
                race: cp.card.race,
                cost: cp.card.cost,
                is_unique: cp.card.is_unique,
                has_ability: cp.card.has_ability,
                can_be_starting_gold: cp.card.can_be_starting_gold,
                text: cp.card.text,
              },
              edition: cp.edition,
              rarity_tier: cp.rarity_tier,
              image_url: cp.image_url,
              legal_status: cp.legal_status,
            };
          });
          setCards(loadedCards);
        }
      }

      setIsDirty(false);
    } catch {
      setError('Error de conexion al cargar mazo');
    }
  }, []);

  const clearDeck = useCallback(() => {
    setDeckId(null);
    setVersionId(null);
    setNameState('Nuevo mazo');
    setCards([]);
    setValidation(null);
    setIsDirty(false);
    setError(null);
  }, []);

  return {
    // State
    deckId,
    versionId,
    name,
    formatId,
    editionId,
    raceId,
    cards,
    validation,
    isValidating,
    isSaving,
    isDirty,
    error,
    totalCards,
    groupedByType,
    // Actions
    addCard,
    removeCard,
    setQty,
    setStartingGold,
    clearStartingGold,
    setFormat,
    setName,
    saveDeck,
    loadDeck,
    clearDeck,
  };
}
