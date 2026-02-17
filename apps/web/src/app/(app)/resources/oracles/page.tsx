/**
 * /resources/oracles — Vista pública de oráculos oficiales de MYL.
 * Muestra rulings agrupados por documento fuente con búsqueda por carta.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck, Search, FileText, ChevronDown, ChevronRight, RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================================
// Types
// ============================================================================

interface OracleWithCard {
  oracle_id: string;
  card_id: string;
  source_document: string;
  ruling_text: string;
  ability_type: string | null;
  sort_order: number;
  card?: {
    card_id: string;
    name: string;
    card_type?: { name: string; code: string };
  };
}

interface CardSearchResult {
  card_id: string;
  name: string;
  card_type: { name: string; code: string };
}

const ABILITY_TYPES = [
  { value: 'ACTIVADA', label: 'Activada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'PASIVA', label: 'Pasiva', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { value: 'ESPECIAL', label: 'Especial', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'CONTINUA', label: 'Continua', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'DISPARADA', label: 'Disparada', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
] as const;

function abilityBadge(type: string | null) {
  if (!type) return null;
  const found = ABILITY_TYPES.find((a) => a.value === type);
  if (!found) return <Badge variant="outline">{type}</Badge>;
  return <Badge className={found.color}>{found.label}</Badge>;
}

// ============================================================================
// Main Component
// ============================================================================

export default function PublicOraclesPage() {
  const [activeTab, setActiveTab] = useState('by-source');

  // Source documents
  const [sourceDocuments, setSourceDocuments] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [docOracles, setDocOracles] = useState<Map<string, OracleWithCard[]>>(new Map());
  const [loadingDocOracles, setLoadingDocOracles] = useState<string | null>(null);

  // Card search
  const [cardSearch, setCardSearch] = useState('');
  const [cardResults, setCardResults] = useState<CardSearchResult[]>([]);
  const [searchingCards, setSearchingCards] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [cardOracles, setCardOracles] = useState<OracleWithCard[]>([]);
  const [loadingCardOracles, setLoadingCardOracles] = useState(false);

  // Load source documents
  const loadSourceDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/v1/admin/oracles');
      const json = await res.json();
      if (json.ok) setSourceDocuments(json.data.items ?? []);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => { loadSourceDocuments(); }, [loadSourceDocuments]);

  const loadDocOracles = useCallback(async (doc: string) => {
    setLoadingDocOracles(doc);
    try {
      const res = await fetch(`/api/v1/admin/oracles?source=${encodeURIComponent(doc)}`);
      const json = await res.json();
      if (json.ok) {
        setDocOracles((prev) => new Map(prev).set(doc, json.data.items ?? []));
      }
    } finally {
      setLoadingDocOracles(null);
    }
  }, []);

  const toggleDoc = useCallback((doc: string) => {
    if (expandedDoc === doc) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(doc);
      if (!docOracles.has(doc)) loadDocOracles(doc);
    }
  }, [expandedDoc, docOracles, loadDocOracles]);

  // Card search
  const searchCards = useCallback(async (query: string) => {
    if (query.length < 2) { setCardResults([]); return; }
    setSearchingCards(true);
    try {
      const res = await fetch(`/api/v1/cards?q=${encodeURIComponent(query)}&limit=10`);
      const json = await res.json();
      if (json.ok) setCardResults(json.data.items ?? []);
    } finally {
      setSearchingCards(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchCards(cardSearch), 300);
    return () => clearTimeout(timeout);
  }, [cardSearch, searchCards]);

  const loadCardOracles = useCallback(async (cardId: string) => {
    setLoadingCardOracles(true);
    try {
      const res = await fetch(`/api/v1/cards/${cardId}/oracles`);
      const json = await res.json();
      if (json.ok) setCardOracles(json.data.items ?? []);
    } finally {
      setLoadingCardOracles(false);
    }
  }, []);

  const selectCard = useCallback((card: CardSearchResult) => {
    setSelectedCard(card);
    setCardSearch('');
    setCardResults([]);
    loadCardOracles(card.card_id);
  }, [loadCardOracles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resources" className="text-muted-foreground hover:text-foreground">
          Recursos
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-violet-600" />
          <h1 className="font-display text-2xl font-bold">Oráculos Oficiales</h1>
        </div>
      </div>

      <p className="text-muted-foreground">
        Los oráculos son documentos oficiales de Mitos y Leyendas que explican las habilidades de cada
        carta, detallando tipo de habilidad, limitaciones y resoluciones.
      </p>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="by-source" className="gap-2">
            <FileText className="h-4 w-4" />
            Por Documento
          </TabsTrigger>
          <TabsTrigger value="by-card" className="gap-2">
            <Search className="h-4 w-4" />
            Buscar por Carta
          </TabsTrigger>
        </TabsList>

        {/* Tab: By Source */}
        <TabsContent value="by-source" className="space-y-4 pt-4">
          {loadingDocs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : sourceDocuments.length === 0 ? (
            <EmptyState
              title="Sin oráculos registrados"
              description="Aún no se han cargado oráculos en el sistema."
            />
          ) : (
            <div className="space-y-2">
              {sourceDocuments.map((doc) => (
                <div key={doc} className="rounded-lg border">
                  <button
                    onClick={() => toggleDoc(doc)}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    {expandedDoc === doc ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-violet-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <FileText className="h-5 w-5 shrink-0 text-violet-500" />
                    <span className="font-medium">{doc}</span>
                    {docOracles.has(doc) && (
                      <Badge variant="secondary" className="ml-auto">
                        {docOracles.get(doc)?.length ?? 0} ruling(s)
                      </Badge>
                    )}
                  </button>

                  {expandedDoc === doc && (
                    <div className="border-t px-4 pb-4">
                      {loadingDocOracles === doc ? (
                        <div className="space-y-2 pt-3">
                          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                      ) : (
                        <div className="space-y-3 pt-3">
                          {(docOracles.get(doc) ?? []).map((oracle) => (
                            <div
                              key={oracle.oracle_id}
                              className="rounded-lg border bg-card p-4 shadow-sm"
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <span className="font-semibold">
                                  {oracle.card?.name ?? 'Carta desconocida'}
                                </span>
                                {oracle.card?.card_type && (
                                  <Badge variant="outline" className="text-xs">
                                    {oracle.card.card_type.name}
                                  </Badge>
                                )}
                                {abilityBadge(oracle.ability_type)}
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {oracle.ruling_text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: By Card */}
        <TabsContent value="by-card" className="space-y-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar carta por nombre..."
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
              className="pl-10"
            />
            {cardResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-lg">
                {cardResults.map((card) => (
                  <button
                    key={card.card_id}
                    onClick={() => selectCard(card)}
                    className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="font-medium">{card.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {card.card_type.name}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            {searchingCards && (
              <div className="absolute right-3 top-3">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {selectedCard ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <BookOpenCheck className="h-6 w-6 text-violet-500" />
                <div>
                  <h3 className="font-display text-lg font-semibold">{selectedCard.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedCard.card_type.name} — {cardOracles.length} oráculo(s)
                  </p>
                </div>
              </div>

              {loadingCardOracles ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
              ) : cardOracles.length === 0 ? (
                <EmptyState
                  title="Sin oráculos"
                  description={`No hay oráculos registrados para "${selectedCard.name}".`}
                />
              ) : (
                <div className="space-y-3">
                  {cardOracles.map((oracle) => (
                    <div key={oracle.oracle_id} className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {oracle.source_document}
                        </Badge>
                        {abilityBadge(oracle.ability_type)}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {oracle.ruling_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Busca una carta"
              description="Escribe el nombre de una carta para consultar sus oráculos oficiales."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
