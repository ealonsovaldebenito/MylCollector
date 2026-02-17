/**
 * File: apps/web/src/hooks/use-deck-builder.ts
 *
 * useDeckBuilder — Client hook para el Builder.
 * Maneja el estado del mazo (metadata + cartas), validación en vivo y guardado/versionado.
 *
 * Contexto:
 * - Builder UI: `BuilderWorkspace` compone navegador de cartas + editor de mazo + tabs (validación/estadísticas/mulligan/costeo).
 *
 * Relaciones / APIs:
 * - POST `/api/v1/validate` (valida reglas del formato).
 * - POST `/api/v1/decks` + PUT `/api/v1/decks/:deckId` (metadata).
 * - POST `/api/v1/decks/:deckId/versions` + GET `/api/v1/deck-versions/:versionId` (versionado y cartas).
 *
 * Bugfixes / Notas:
 * - Soporta selección de impresión por copia: cada copia es un `DeckCardSlot` con `deck_card_id` (client-only).
 * - El payload a validación/guardado se agrega por `card_printing_id` para mantener compatibilidad con la API.
 * - "Cartas clave" (estrella) se persisten en DB via `deck_version_cards.is_key_card` (no localStorage).
 * - Metadata del mazo se auto-guardan por `PUT /api/v1/decks/:deckId` (sin crear versión).
 * - "Cartas clave" se auto-guardan por `PUT /api/v1/decks/:deckId/key-cards` (sin crear versión).
 * - Se auto-crea el mazo al tener `formatId` + `name` para que refrescar no pierda configuración.
 *
 * Changelog:
 * - 2026-02-17: Persistencia de "cartas clave" en DB (is_key_card) + payload de version.
 * - 2026-02-17: Auto-create deck + auto-save metadata/key cards (evita perder config al refrescar).
 * - 2026-02-17 — Refactor: cartas por copia (impresión por copia) + key cards + payload agregado.
 */

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { LegalStatus, ValidationResult, Visibility } from '@myl/shared';

// ============================================================================
// Types
// ============================================================================

export interface DeckCardSlot {
  /** Client-only id for this specific copy */
  deck_card_id: string;
  card_printing_id: string;
  is_starting_gold: boolean;
  /** Key card marker (persisted via `deck_version_cards.is_key_card`) */
  is_key_card: boolean;
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
  duplicateCard: (deckCardId: string) => void;
  removeCard: (deckCardId: string) => void;
  replacePrinting: (deckCardId: string, toPrinting: CardPrintingData) => void;
  setStartingGold: (deckCardId: string) => void;
  clearStartingGold: () => void;
  toggleKeyCard: (cardId: string) => void;
  setFormat: (formatId: string) => void;
  setEditionId: (editionId: string | null) => void;
  setRaceId: (raceId: string | null) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setStrategy: (strategy: string) => void;
  setCoverImageUrl: (url: string) => void;
  setTagIds: (tagIds: string[]) => void;
  setVisibility: (visibility: Visibility) => void;
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
  visibility: Visibility;
  description: string;
  strategy: string;
  coverImageUrl: string;
  tagIds: string[];
  cards: DeckCardSlot[];
  keyCardIds: string[];
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
  const [visibility, setVisibilityState] = useState<Visibility>('PRIVATE');
  const [description, setDescriptionState] = useState<string>('');
  const [strategy, setStrategyState] = useState<string>('');
  const [coverImageUrl, setCoverImageUrlState] = useState<string>('');
  const [tagIds, setTagIdsState] = useState<string[]>([]);
  const [cards, setCards] = useState<DeckCardSlot[]>([]);
  const [keyCardIds, setKeyCardIds] = useState<string[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoCreateRef = useRef(false);
  const autoSaveMetaTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoSaveKeysTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const keyCardIdSet = useMemo(() => new Set(keyCardIds), [keyCardIds]);

  useEffect(() => {
    setCards((prev) => prev.map((c) => ({ ...c, is_key_card: keyCardIdSet.has(c.card.card_id) })));
  }, [keyCardIdSet]);

  // Auto-create a deck as soon as we have required metadata (so refresh keeps config via /builder/:id).
  useEffect(() => {
    if (deckId || autoCreateRef.current) return;
    if (!formatId || !name.trim()) return;

    const t = setTimeout(async () => {
      try {
        autoCreateRef.current = true;
        const res = await fetch('/api/v1/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            format_id: formatId,
            edition_id: editionId ?? null,
            race_id: raceId ?? null,
            description: description.trim() ? description : undefined,
            strategy: strategy.trim() ? strategy : undefined,
            cover_image_url: coverImageUrl.trim() ? coverImageUrl : undefined,
            tag_ids: tagIds,
            visibility,
          }),
        });
        const json = await res.json();
        if (json.ok && json.data?.deck_id) {
          setDeckId(json.data.deck_id as string);
        } else {
          autoCreateRef.current = false;
        }
      } catch {
        autoCreateRef.current = false;
      }
    }, 600);

    return () => clearTimeout(t);
  }, [deckId, formatId, name, editionId, raceId, description, strategy, coverImageUrl, tagIds, visibility]);

  // Auto-save deck metadata (format/race/edition/tags/etc.) without requiring "Guardar" (version).
  useEffect(() => {
    if (!deckId) return;
    if (!name.trim() || !formatId) return; // evitar requests inválidos (400) cuando falta nombre o formato
    if (autoSaveMetaTimerRef.current) clearTimeout(autoSaveMetaTimerRef.current);

    autoSaveMetaTimerRef.current = setTimeout(async () => {
      try {
        const payload: Record<string, unknown> = {
          name,
          format_id: formatId,
          edition_id: editionId ?? null,
          race_id: raceId ?? null,
          tag_ids: tagIds,
          visibility,
        };

        if (description.trim()) payload.description = description.trim();
        if (strategy.trim()) payload.strategy = strategy.trim();
        if (coverImageUrl.trim()) payload.cover_image_url = coverImageUrl.trim();

        await fetch(`/api/v1/decks/${deckId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore auto-save failures
      }
    }, 500);

    return () => {
      if (autoSaveMetaTimerRef.current) clearTimeout(autoSaveMetaTimerRef.current);
    };
  }, [deckId, name, formatId, editionId, raceId, description, strategy, coverImageUrl, tagIds, visibility]);

  // Auto-save key cards to DB (deck-level) so refresh keeps stars even without saving a new version.
  useEffect(() => {
    if (!deckId) return;
    if (autoSaveKeysTimerRef.current) clearTimeout(autoSaveKeysTimerRef.current);

    autoSaveKeysTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/v1/decks/${deckId}/key-cards`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_ids: keyCardIds }),
        });
      } catch {
        // ignore
      }
    }, 400);

    return () => {
      if (autoSaveKeysTimerRef.current) clearTimeout(autoSaveKeysTimerRef.current);
    };
  }, [deckId, keyCardIds]);

  // Computed: total cards
  const totalCards = useMemo(() => cards.length, [cards]);

  // Computed: grouped by type
  const groupedByType = useMemo(() => {
    const groups = new Map<string, CardGrouping>();

    for (const slot of cards) {
      const key = slot.card.card_type.code;
      const existing = groups.get(key);
      if (existing) {
        existing.cards.push(slot);
        existing.totalQty += 1;
      } else {
        groups.set(key, {
          typeName: slot.card.card_type.name,
          typeCode: key,
          sortOrder: slot.card.card_type.sort_order,
          cards: [slot],
          totalQty: 1,
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

  function aggregateCardsPayload(list: DeckCardSlot[]) {
    const map = new Map<string, { qty: number; is_starting_gold: boolean; is_key_card: boolean }>();
    for (const c of list) {
      const existing = map.get(c.card_printing_id);
      if (existing) {
        existing.qty += 1;
        existing.is_starting_gold = existing.is_starting_gold || c.is_starting_gold;
        existing.is_key_card = existing.is_key_card || c.is_key_card;
      } else {
        map.set(c.card_printing_id, {
          qty: 1,
          is_starting_gold: c.is_starting_gold,
          is_key_card: c.is_key_card,
        });
      }
    }
    return Array.from(map.entries()).map(([card_printing_id, v]) => ({
      card_printing_id,
      qty: v.qty,
      is_starting_gold: v.is_starting_gold,
      is_key_card: v.is_key_card,
    }));
  }

  // --- Live validation ---
  const triggerValidation = useCallback(() => {
    if (!formatId) return;
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);

    validateTimerRef.current = setTimeout(async () => {
      setIsValidating(true);
        try {
          const payload = {
            format_id: formatId,
            cards: aggregateCardsPayload(cards),
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
      const currentQtyForCard = prev.filter((c) => c.card.card_id === printing.card.card_id).length;
      const maxQty = printing.card.is_unique ? 1 : 3;
      if (currentQtyForCard >= maxQty) return prev;

      const slot: DeckCardSlot = {
        deck_card_id:
          typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        card_printing_id: printing.card_printing_id,
        is_starting_gold: false,
        is_key_card: keyCardIdSet.has(printing.card.card_id),
        card: printing.card,
        edition: printing.edition,
        rarity_tier: printing.rarity_tier,
        image_url: printing.image_url,
        legal_status: printing.legal_status,
      };
      return [...prev, slot];
    });
    setIsDirty(true);
  }, [keyCardIdSet]);

  const duplicateCard = useCallback((deckCardId: string) => {
    setCards((prev) => {
      const from = prev.find((c) => c.deck_card_id === deckCardId);
      if (!from) return prev;
      const currentQtyForCard = prev.filter((c) => c.card.card_id === from.card.card_id).length;
      const maxQty = from.card.is_unique ? 1 : 3;
      if (currentQtyForCard >= maxQty) return prev;

      const next: DeckCardSlot = {
        ...from,
        deck_card_id:
          typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        is_starting_gold: false,
        is_key_card: keyCardIdSet.has(from.card.card_id),
      };
      return [...prev, next];
    });
    setIsDirty(true);
  }, [keyCardIdSet]);

  const removeCard = useCallback((deckCardId: string) => {
    setCards((prev) => prev.filter((c) => c.deck_card_id !== deckCardId));
    setIsDirty(true);
  }, []);

  const setStartingGold = useCallback((deckCardId: string) => {
    setCards((prev) =>
      prev.map((c) => ({
        ...c,
        is_starting_gold: c.deck_card_id === deckCardId,
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

  const replacePrinting = useCallback((deckCardId: string, toPrinting: CardPrintingData) => {
    setCards((prev) => {
      return prev.map((c) => {
        if (c.deck_card_id !== deckCardId) return c;
        return {
          ...c,
          card_printing_id: toPrinting.card_printing_id,
          edition: toPrinting.edition,
          rarity_tier: toPrinting.rarity_tier,
          image_url: toPrinting.image_url,
          legal_status: toPrinting.legal_status,
          card: toPrinting.card,
        };
      });
    });
    setIsDirty(true);
  }, []);

  const setDescription = useCallback((next: string) => {
    setDescriptionState(next);
    setIsDirty(true);
  }, []);

  const setStrategy = useCallback((next: string) => {
    setStrategyState(next);
    setIsDirty(true);
  }, []);

  const setCoverImageUrl = useCallback((next: string) => {
    setCoverImageUrlState(next);
    setIsDirty(true);
  }, []);

  const setTagIds = useCallback((next: string[]) => {
    setTagIdsState(next);
    setIsDirty(true);
  }, []);

  const setVisibility = useCallback((next: Visibility) => {
    setVisibilityState(next);
    setIsDirty(true);
  }, []);

  const toggleKeyCard = useCallback((cardId: string) => {
    setKeyCardIds((prev) => {
      const set = new Set(prev);
      if (set.has(cardId)) set.delete(cardId);
      else set.add(cardId);
      return Array.from(set);
    });
    setIsDirty(true);
  }, []);

  const setEditionIdAction = useCallback((next: string | null) => {
    setEditionId(next);
    setIsDirty(true);
  }, []);

  const setRaceIdAction = useCallback((next: string | null) => {
    setRaceId(next);
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
          body: JSON.stringify({
            name,
            format_id: formatId,
            edition_id: editionId ?? null,
            race_id: raceId ?? null,
            description: description.trim() ? description : undefined,
            strategy: strategy.trim() ? strategy : undefined,
            cover_image_url: coverImageUrl.trim() ? coverImageUrl : undefined,
            tag_ids: tagIds,
            visibility,
          }),
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
          body: JSON.stringify({
            name,
            format_id: formatId,
            edition_id: editionId ?? null,
            race_id: raceId ?? null,
            description: description.trim() ? description : null,
            strategy: strategy.trim() ? strategy : null,
            cover_image_url: coverImageUrl.trim() ? coverImageUrl : null,
            tag_ids: tagIds,
            visibility,
          }),
        });
      }

      // Create version
      const versionPayload = {
        cards: aggregateCardsPayload(cards),
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
  }, [deckId, name, formatId, editionId, raceId, description, strategy, coverImageUrl, tagIds, visibility, cards]);

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
      const deckKeyIdsFromDeck = (deck.key_card_ids ?? []) as string[];
      setDeckId(deck.deck_id);
      setNameState(deck.name);
      setFormatId(deck.format_id);
      setEditionId(deck.edition_id ?? null);
      setRaceId(deck.race_id ?? null);
      setDescriptionState(deck.description ?? '');
      setStrategyState(deck.strategy ?? '');
      setCoverImageUrlState(deck.cover_image_url ?? '');
      setTagIdsState(deck.tag_ids ?? []);
      setVisibilityState((deck.visibility as Visibility) ?? 'PRIVATE');
      setKeyCardIds(deckKeyIdsFromDeck);

      // Load latest version cards
      if (deck.latest_version) {
        const currentVersionId = deck.latest_version.deck_version_id;
        setVersionId(currentVersionId);
        const vRes = await fetch(`/api/v1/deck-versions/${currentVersionId}`);
        const vJson = await vRes.json();
        if (vJson.ok && vJson.data.cards) {
          const fallbackKeyIds = new Set<string>();
          if (deckKeyIdsFromDeck.length === 0) {
            // If deck-level key cards aren't available yet, fallback to snapshot on the latest version.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const row of vJson.data.cards as any[]) {
              if (row.is_key_card) {
                const cid = row.card_printing?.card?.card_id as string | undefined;
                if (cid) fallbackKeyIds.add(cid);
              }
            }
            if (fallbackKeyIds.size > 0) setKeyCardIds(Array.from(fallbackKeyIds));
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedCards: DeckCardSlot[] = vJson.data.cards.flatMap((row: any) => {
            const cp = row.card_printing;
            const qty = Number(row.qty ?? 0);
            return Array.from({ length: Math.max(0, qty) }).map((_, i) => ({
              deck_card_id:
                typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
              card_printing_id: cp.card_printing_id,
              is_starting_gold: !!row.is_starting_gold && i === 0,
              is_key_card: deckKeyIdsFromDeck.includes(cp.card.card_id) || fallbackKeyIds.has(cp.card.card_id),
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
            }));
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
    setVisibilityState('PRIVATE');
    setDescriptionState('');
    setStrategyState('');
    setCoverImageUrlState('');
    setTagIdsState([]);
    setCards([]);
    setValidation(null);
    setIsDirty(false);
    setError(null);
  }, [keyCardIdSet]);

  return {
    // State
    deckId,
    versionId,
    name,
    formatId,
    editionId,
    raceId,
    visibility,
    description,
    strategy,
    coverImageUrl,
    tagIds,
    cards,
    keyCardIds,
    validation,
    isValidating,
    isSaving,
    isDirty,
    error,
    totalCards,
    groupedByType,
    // Actions
    addCard,
    duplicateCard,
    removeCard,
    replacePrinting,
    setStartingGold,
    clearStartingGold,
    toggleKeyCard,
    setFormat,
    setEditionId: setEditionIdAction,
    setRaceId: setRaceIdAction,
    setName,
    setDescription,
    setStrategy,
    setCoverImageUrl,
    setTagIds,
    setVisibility,
    saveDeck,
    loadDeck,
    clearDeck,
  };
}
