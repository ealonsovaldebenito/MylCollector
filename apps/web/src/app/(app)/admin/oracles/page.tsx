/**
 * Admin Oracles Page — Manage card oracles (rulings/errata) and view by source.
 * Tab 1: Gestión por documento fuente — CRUD oráculos agrupados por documento
 * Tab 2: Buscar por carta — buscar una carta y ver/agregar sus oráculos
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck, RefreshCw, Plus, Trash2, Pencil, Search,
  FileText, ChevronDown, ChevronRight, X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

interface OracleRow {
  oracle_id: string;
  card_id: string;
  source_document: string;
  ruling_text: string;
  ability_type: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface OracleWithCard extends OracleRow {
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
  { value: 'ACTIVADA', label: 'Activada', color: 'bg-blue-100 text-blue-700' },
  { value: 'PASIVA', label: 'Pasiva', color: 'bg-green-100 text-green-700' },
  { value: 'ESPECIAL', label: 'Especial', color: 'bg-purple-100 text-purple-700' },
  { value: 'CONTINUA', label: 'Continua', color: 'bg-amber-100 text-amber-700' },
  { value: 'DISPARADA', label: 'Disparada', color: 'bg-red-100 text-red-700' },
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

export default function AdminOraclesPage() {
  const [activeTab, setActiveTab] = useState('by-source');

  // Source documents state
  const [sourceDocuments, setSourceDocuments] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [docOracles, setDocOracles] = useState<Map<string, OracleWithCard[]>>(new Map());
  const [loadingDocOracles, setLoadingDocOracles] = useState<string | null>(null);

  // Card search state
  const [cardSearch, setCardSearch] = useState('');
  const [cardResults, setCardResults] = useState<CardSearchResult[]>([]);
  const [searchingCards, setSearchingCards] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [cardOracles, setCardOracles] = useState<OracleRow[]>([]);
  const [loadingCardOracles, setLoadingCardOracles] = useState(false);

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOracle, setEditingOracle] = useState<OracleRow | null>(null);
  const [formCardId, setFormCardId] = useState('');
  const [formSourceDoc, setFormSourceDoc] = useState('');
  const [formRulingText, setFormRulingText] = useState('');
  const [formAbilityType, setFormAbilityType] = useState<string>('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // ── Load source documents ───────────────────────────────────────────────
  const loadSourceDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/v1/admin/oracles');
      const json = await res.json();
      if (json.ok) {
        setSourceDocuments(json.data.items ?? []);
      }
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => { loadSourceDocuments(); }, [loadSourceDocuments]);

  // ── Load oracles for a source document ──────────────────────────────────
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
      if (!docOracles.has(doc)) {
        loadDocOracles(doc);
      }
    }
  }, [expandedDoc, docOracles, loadDocOracles]);

  // ── Card search ─────────────────────────────────────────────────────────
  const searchCards = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCardResults([]);
      return;
    }
    setSearchingCards(true);
    try {
      const res = await fetch(`/api/v1/cards?q=${encodeURIComponent(query)}&limit=10`);
      const json = await res.json();
      if (json.ok) {
        setCardResults(json.data.items ?? []);
      }
    } finally {
      setSearchingCards(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchCards(cardSearch), 300);
    return () => clearTimeout(timeout);
  }, [cardSearch, searchCards]);

  // ── Load oracles for selected card ──────────────────────────────────────
  const loadCardOracles = useCallback(async (cardId: string) => {
    setLoadingCardOracles(true);
    try {
      const res = await fetch(`/api/v1/cards/${cardId}/oracles`);
      const json = await res.json();
      if (json.ok) {
        setCardOracles(json.data.items ?? []);
      }
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

  // ── Create/Edit dialog ─────────────────────────────────────────────────
  const openCreateDialog = useCallback((cardId?: string) => {
    setEditingOracle(null);
    setFormCardId(cardId ?? selectedCard?.card_id ?? '');
    setFormSourceDoc('');
    setFormRulingText('');
    setFormAbilityType('');
    setFormSortOrder(0);
    setDialogOpen(true);
  }, [selectedCard]);

  const openEditDialog = useCallback((oracle: OracleRow) => {
    setEditingOracle(oracle);
    setFormCardId(oracle.card_id);
    setFormSourceDoc(oracle.source_document);
    setFormRulingText(oracle.ruling_text);
    setFormAbilityType(oracle.ability_type ?? '');
    setFormSortOrder(oracle.sort_order);
    setDialogOpen(true);
  }, []);

  const saveOracle = useCallback(async () => {
    setSaving(true);
    try {
      if (editingOracle) {
        // Update
        const res = await fetch(`/api/v1/admin/oracles/${editingOracle.oracle_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_document: formSourceDoc,
            ruling_text: formRulingText,
            ability_type: formAbilityType || null,
            sort_order: formSortOrder,
          }),
        });
        if (!(await res.json()).ok) return;
      } else {
        // Create
        const res = await fetch('/api/v1/admin/oracles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            card_id: formCardId,
            source_document: formSourceDoc,
            ruling_text: formRulingText,
            ability_type: formAbilityType || null,
            sort_order: formSortOrder,
          }),
        });
        if (!(await res.json()).ok) return;
      }

      setDialogOpen(false);

      // Reload data
      if (selectedCard) {
        loadCardOracles(selectedCard.card_id);
      }
      loadSourceDocuments();
      // Clear cache for expanded doc to force reload
      if (expandedDoc) {
        loadDocOracles(expandedDoc);
      }
    } finally {
      setSaving(false);
    }
  }, [
    editingOracle, formCardId, formSourceDoc, formRulingText, formAbilityType,
    formSortOrder, selectedCard, loadCardOracles, loadSourceDocuments,
    expandedDoc, loadDocOracles,
  ]);

  const deleteOracle = useCallback(async (oracleId: string) => {
    const res = await fetch(`/api/v1/admin/oracles/${oracleId}`, { method: 'DELETE' });
    if ((await res.json()).ok) {
      if (selectedCard) loadCardOracles(selectedCard.card_id);
      loadSourceDocuments();
      if (expandedDoc) loadDocOracles(expandedDoc);
    }
  }, [selectedCard, loadCardOracles, loadSourceDocuments, expandedDoc, loadDocOracles]);

  // ── Card search for dialog (when not in card tab) ──────────────────────
  const [dialogCardSearch, setDialogCardSearch] = useState('');
  const [dialogCardResults, setDialogCardResults] = useState<CardSearchResult[]>([]);

  useEffect(() => {
    if (dialogCardSearch.length < 2) {
      setDialogCardResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/v1/cards?q=${encodeURIComponent(dialogCardSearch)}&limit=8`);
      const json = await res.json();
      if (json.ok) setDialogCardResults(json.data.items ?? []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [dialogCardSearch]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            Admin
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-bold">Oráculos</h1>
          </div>
        </div>
        <Button onClick={() => openCreateDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Oráculo
        </Button>
      </div>

      <p className="text-muted-foreground">
        Gestiona los oráculos oficiales de MYL: rulings, erratas y aclaraciones de habilidades por carta.
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
            Por Carta
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: By Source Document ───────────────────────────────────── */}
        <TabsContent value="by-source" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sourceDocuments.length} documento(s) fuente registrado(s)
            </p>
            <Button variant="outline" size="sm" onClick={loadSourceDocuments} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>

          {loadingDocs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : sourceDocuments.length === 0 ? (
            <EmptyState
              title="Sin documentos fuente"
              description="Aún no se han registrado oráculos. Crea el primero para empezar."
            />
          ) : (
            <div className="space-y-2">
              {sourceDocuments.map((doc) => (
                <div key={doc} className="rounded-lg border">
                  <button
                    onClick={() => toggleDoc(doc)}
                    className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50"
                  >
                    {expandedDoc === doc ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <FileText className="h-5 w-5 shrink-0 text-indigo-500" />
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
                          {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                      ) : (
                        <div className="space-y-3 pt-3">
                          {(docOracles.get(doc) ?? []).map((oracle) => (
                            <div
                              key={oracle.oracle_id}
                              className="flex items-start gap-3 rounded-md border bg-muted/30 p-3"
                            >
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {oracle.card?.name ?? 'Carta desconocida'}
                                  </span>
                                  {abilityBadge(oracle.ability_type)}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{oracle.ruling_text}</p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(oracle)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => deleteOracle(oracle.oracle_id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {(docOracles.get(doc) ?? []).length === 0 && (
                            <p className="text-sm text-muted-foreground py-2">
                              No hay oráculos para este documento.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: By Card ─────────────────────────────────────────────── */}
        <TabsContent value="by-card" className="space-y-4 pt-4">
          {/* Search */}
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

          {/* Selected card */}
          {selectedCard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <BookOpenCheck className="h-5 w-5 text-indigo-500" />
                  <div>
                    <h3 className="font-semibold">{selectedCard.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCard.card_type.name} — {cardOracles.length} oráculo(s)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateDialog(selectedCard.card_id)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Oráculo
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setSelectedCard(null); setCardOracles([]); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                    <div
                      key={oracle.oracle_id}
                      className="flex items-start gap-3 rounded-lg border p-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {oracle.source_document}
                          </Badge>
                          {abilityBadge(oracle.ability_type)}
                          <span className="text-xs text-muted-foreground ml-auto">
                            Orden: {oracle.sort_order}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{oracle.ruling_text}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(oracle)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteOracle(oracle.oracle_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="Selecciona una carta"
              description="Busca una carta para ver y gestionar sus oráculos."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Create/Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOracle ? 'Editar Oráculo' : 'Nuevo Oráculo'}
            </DialogTitle>
            <DialogDescription>
              {editingOracle
                ? 'Modifica los datos del oráculo.'
                : 'Registra un nuevo ruling u oráculo oficial.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Card selector (only for create, and only if not pre-selected) */}
            {!editingOracle && !formCardId && (
              <div className="space-y-2">
                <Label>Carta</Label>
                <div className="relative">
                  <Input
                    placeholder="Buscar carta..."
                    value={dialogCardSearch}
                    onChange={(e) => setDialogCardSearch(e.target.value)}
                  />
                  {dialogCardResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-lg">
                      {dialogCardResults.map((card) => (
                        <button
                          key={card.card_id}
                          onClick={() => {
                            setFormCardId(card.card_id);
                            setDialogCardSearch(card.name);
                            setDialogCardResults([]);
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                        >
                          <span>{card.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {card.card_type.name}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {formCardId && !editingOracle && (
              <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                <span>Carta seleccionada:</span>
                <Badge>{dialogCardSearch || selectedCard?.name || formCardId}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-6 w-6"
                  onClick={() => { setFormCardId(''); setDialogCardSearch(''); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="source_document">Documento Fuente</Label>
              <Input
                id="source_document"
                placeholder="Ej: Oráculo Lootbox Primer Bloque 2025"
                value={formSourceDoc}
                onChange={(e) => setFormSourceDoc(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ability_type">Tipo de Habilidad</Label>
              <Select value={formAbilityType} onValueChange={setFormAbilityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tipo</SelectItem>
                  {ABILITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruling_text">Texto del Ruling</Label>
              <Textarea
                id="ruling_text"
                placeholder="Describe el ruling, errata o aclaración oficial..."
                value={formRulingText}
                onChange={(e) => setFormRulingText(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Orden</Label>
              <Input
                id="sort_order"
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveOracle}
              disabled={saving || !formSourceDoc || !formRulingText || (!formCardId && !editingOracle)}
            >
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingOracle ? 'Guardar Cambios' : 'Crear Oráculo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
