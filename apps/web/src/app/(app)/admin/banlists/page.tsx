/**
 * Admin Banlists Page — Comprehensive ban list management per format.
 * Tab 1: Gestión por formato (prohibidas, limitadas a 1, limitadas a 2)
 * Tab 2: Historial de revisiones
 * Tab 3: Legal status por printing (original functionality)
 *
 * Changelog:
 *   2026-02-16 — Complete rewrite with format-based management and revision history
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShieldX, RefreshCw, Plus, Trash2, History, Ban, AlertTriangle, Clock,
  Search,
} from 'lucide-react';
import { editionDisplayName } from '@myl/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCatalogData } from '@/hooks/use-catalog-data';

// ============================================================================
// Types
// ============================================================================

interface Format {
  format_id: string;
  name: string;
  code: string;
}

interface LimitRow {
  format_card_limit_id: string;
  format_id: string;
  card_id: string;
  max_qty: number;
  notes: string | null;
  card: {
    card_id: string;
    name: string;
    card_type: { name: string; code: string };
  };
}

interface RevisionRow {
  revision_id: string;
  format_id: string;
  name: string;
  description: string | null;
  effective_date: string;
  created_at: string;
}

interface LegalStatusRow {
  card_printing_id: string;
  legal_status: 'LEGAL' | 'RESTRICTED' | 'BANNED' | 'DISCONTINUED';
  edition: { edition_id: string; name: string; code: string };
  card: { card_id: string; name: string };
}

interface CardSearchResult {
  card_id: string;
  name: string;
  card_type: { name: string; code: string };
}

// ============================================================================
// Component
// ============================================================================

export default function AdminBanlistsPage() {
  const { editions, isLoading: catalogLoading } = useCatalogData();

  // Format state
  const [formats, setFormats] = useState<Format[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string>('');

  // Limits tab
  const [banned, setBanned] = useState<LimitRow[]>([]);
  const [limited1, setLimited1] = useState<LimitRow[]>([]);
  const [limited2, setLimited2] = useState<LimitRow[]>([]);
  const [limitsLoading, setLimitsLoading] = useState(false);

  // Revisions tab
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  // Legal status tab
  const [legalRows, setLegalRows] = useState<LegalStatusRow[]>([]);
  const [legalLoading, setLegalLoading] = useState(false);
  const [legalFilter, setLegalFilter] = useState<'BANNED' | 'RESTRICTED' | 'DISCONTINUED'>('BANNED');
  const [legalEditionId, setLegalEditionId] = useState('');

  // Add card dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [cardSearch, setCardSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CardSearchResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [addMaxQty, setAddMaxQty] = useState('0');
  const [addNotes, setAddNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Load formats
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/formats');
        const json = await res.json();
        if (json.ok) {
          const items = json.data.items ?? json.data ?? [];
          setFormats(items);
          if (items.length > 0 && !selectedFormatId) {
            setSelectedFormatId(items[0]!.format_id);
          }
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Load limits when format changes
  const loadLimits = useCallback(async () => {
    if (!selectedFormatId) return;
    setLimitsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/banlists/formats/${selectedFormatId}/limits?grouped=true`);
      const json = await res.json();
      if (json.ok) {
        setBanned(json.data.banned ?? []);
        setLimited1(json.data.limited_1 ?? []);
        setLimited2(json.data.limited_2 ?? []);
      }
    } catch { /* ignore */ }
    setLimitsLoading(false);
  }, [selectedFormatId]);

  useEffect(() => { loadLimits(); }, [loadLimits]);

  // Load revisions
  const loadRevisions = useCallback(async () => {
    if (!selectedFormatId) return;
    setRevisionsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/banlists/formats/${selectedFormatId}/revisions`);
      const json = await res.json();
      if (json.ok) setRevisions(json.data.items ?? []);
    } catch { /* ignore */ }
    setRevisionsLoading(false);
  }, [selectedFormatId]);

  // Load legal status
  const loadLegalStatus = useCallback(async () => {
    setLegalLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      params.set('legal_status', legalFilter);
      if (legalEditionId) params.set('edition_id', legalEditionId);
      const res = await fetch(`/api/v1/cards?${params.toString()}`);
      const json = await res.json();
      if (json.ok) setLegalRows(json.data.items ?? []);
    } catch { /* ignore */ }
    setLegalLoading(false);
  }, [legalFilter, legalEditionId]);

  // Card search for add dialog
  async function searchCards(query: string) {
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const params = new URLSearchParams();
      params.set('q', query);
      params.set('limit', '10');
      const res = await fetch(`/api/v1/cards?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setSearchResults((json.data.items ?? []).map((item: Record<string, unknown>) => ({
          card_id: item.card_id ?? (item.card as Record<string, unknown>)?.card_id,
          name: item.name ?? (item.card as Record<string, unknown>)?.name,
          card_type: item.card_type ?? { name: 'Desconocido', code: 'UNK' },
        })));
      }
    } catch { /* ignore */ }
  }

  async function handleAddLimit() {
    if (!selectedCard || !selectedFormatId) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/v1/admin/banlists/formats/${selectedFormatId}/limits`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          card_id: selectedCard.card_id,
          max_qty: parseInt(addMaxQty, 10),
          notes: addNotes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al agregar restricción');
        return;
      }
      setAddDialogOpen(false);
      setSelectedCard(null);
      setCardSearch('');
      setAddNotes('');
      loadLimits();
    } catch {
      alert('Error de conexión');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteLimit(cardId: string) {
    if (!confirm('¿Eliminar esta restricción? La carta volverá al límite por defecto.')) return;
    try {
      const res = await fetch(`/api/v1/admin/banlists/formats/${selectedFormatId}/limits/${cardId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al eliminar');
        return;
      }
      loadLimits();
    } catch {
      alert('Error de conexión');
    }
  }

  async function updateLegalStatus(row: LegalStatusRow, newStatus: string) {
    try {
      const res = await fetch(`/api/v1/cards/${row.card.card_id}/printings/${row.card_printing_id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ legal_status: newStatus }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al actualizar');
        return;
      }
      if (newStatus !== legalFilter) {
        setLegalRows((prev) => prev.filter((r) => r.card_printing_id !== row.card_printing_id));
      }
    } catch {
      alert('Error de conexión');
    }
  }

  const editionOptions = useMemo(
    () => editions.slice().sort((a, b) => a.sort_order - b.sort_order),
    [editions],
  );

  const selectedFormat = formats.find((f) => f.format_id === selectedFormatId);

  // ============================================================================
  // Render helpers
  // ============================================================================

  function renderLimitSection(title: string, icon: React.ReactNode, items: LimitRow[], variant: 'destructive' | 'secondary' | 'outline') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
          <Badge variant={variant}>{items.length}</Badge>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-6">Sin cartas en esta categoría.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Carta</th>
                  <th className="px-4 py-2 text-left font-medium">Tipo</th>
                  <th className="px-4 py-2 text-left font-medium">Notas</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.card_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium">{item.card.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{item.card.card_type.name}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{item.notes ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLimit(item.card_id)}
                        className="text-destructive hover:text-destructive"
                        title="Eliminar restricción"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Banlists</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona restricciones de cartas por formato y estado legal.
          </p>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="format" className="space-y-4">
        <TabsList>
          <TabsTrigger value="format">
            <Ban className="mr-1.5 h-4 w-4" />
            Por Formato
          </TabsTrigger>
          <TabsTrigger value="revisions" onClick={loadRevisions}>
            <History className="mr-1.5 h-4 w-4" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="legal" onClick={loadLegalStatus}>
            <AlertTriangle className="mr-1.5 h-4 w-4" />
            Legal Status
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB 1: Gestión por Formato */}
        {/* ============================================ */}
        <TabsContent value="format" className="space-y-6">
          <div className="flex items-center gap-3">
            <Select value={selectedFormatId} onValueChange={setSelectedFormatId}>
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Selecciona un formato" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f.format_id} value={f.format_id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={loadLimits} disabled={limitsLoading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refrescar
            </Button>

            <Button size="sm" onClick={() => { setAddDialogOpen(true); setSelectedCard(null); setCardSearch(''); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Agregar Restricción
            </Button>
          </div>

          {selectedFormat && (
            <p className="text-sm text-muted-foreground">
              Formato: <strong>{selectedFormat.name}</strong> ({selectedFormat.code})
            </p>
          )}

          {limitsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {renderLimitSection(
                'Cartas Prohibidas (0 copias)',
                <Ban className="h-5 w-5 text-destructive" />,
                banned,
                'destructive',
              )}
              {renderLimitSection(
                'Limitadas a 1 copia',
                <AlertTriangle className="h-5 w-5 text-amber-500" />,
                limited1,
                'secondary',
              )}
              {renderLimitSection(
                'Limitadas a 2 copias',
                <Clock className="h-5 w-5 text-blue-500" />,
                limited2,
                'outline',
              )}
            </div>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 2: Historial de Revisiones */}
        {/* ============================================ */}
        <TabsContent value="revisions" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedFormatId} onValueChange={setSelectedFormatId}>
              <SelectTrigger className="w-[320px]">
                <SelectValue placeholder="Selecciona un formato" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f.format_id} value={f.format_id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={loadRevisions} disabled={revisionsLoading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refrescar
            </Button>
          </div>

          {revisionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : revisions.length === 0 ? (
            <EmptyState icon={History} title="Sin revisiones" description="Aún no se han creado revisiones para este formato." />
          ) : (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div key={rev.revision_id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{rev.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Vigente desde: {new Date(rev.effective_date).toLocaleDateString('es-CL')}
                        {' · '}Creada: {new Date(rev.created_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {new Date(rev.effective_date).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                    </Badge>
                  </div>
                  {rev.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{rev.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================ */}
        {/* TAB 3: Legal Status */}
        {/* ============================================ */}
        <TabsContent value="legal" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={legalFilter} onValueChange={(v) => setLegalFilter(v as typeof legalFilter)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANNED">Prohibidas</SelectItem>
                <SelectItem value="RESTRICTED">Restringidas</SelectItem>
                <SelectItem value="DISCONTINUED">Discontinuadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={legalEditionId || '__all__'} onValueChange={(v) => setLegalEditionId(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Todas las ediciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las ediciones</SelectItem>
                {editionOptions.map((e) => (
                  <SelectItem key={e.edition_id} value={e.edition_id}>
                    {editionDisplayName(e.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={loadLegalStatus} disabled={legalLoading || catalogLoading}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refrescar
            </Button>
          </div>

          {legalLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : legalRows.length === 0 ? (
            <EmptyState icon={ShieldX} title="Sin resultados" description="No se encontraron impresiones." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold">Carta</th>
                    <th className="px-4 py-3 text-left font-semibold">Edición</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {legalRows.map((row) => (
                    <tr key={row.card_printing_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/admin/cards/${row.card.card_id}/edit`} className="font-medium hover:text-primary">
                          {row.card.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {editionDisplayName(row.edition.name)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={row.legal_status === 'BANNED' ? 'destructive' : 'secondary'}>
                          {row.legal_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Select
                          value={row.legal_status}
                          onValueChange={(v) => updateLegalStatus(row, v)}
                        >
                          <SelectTrigger className="h-8 w-[180px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEGAL">Legal</SelectItem>
                            <SelectItem value="RESTRICTED">Restringida</SelectItem>
                            <SelectItem value="BANNED">Prohibida</SelectItem>
                            <SelectItem value="DISCONTINUED">Discontinuada</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================ */}
      {/* Dialog: Add Restriction */}
      {/* ============================================ */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Restricción</DialogTitle>
            <DialogDescription>
              Busca una carta y define su límite de copias en el formato {selectedFormat?.name ?? ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Buscar carta</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={cardSearch}
                  onChange={(e) => {
                    setCardSearch(e.target.value);
                    searchCards(e.target.value);
                  }}
                  placeholder="Escribe el nombre de la carta..."
                  className="pl-9"
                />
              </div>
              {searchResults.length > 0 && !selectedCard && (
                <div className="max-h-48 overflow-y-auto rounded border border-border">
                  {searchResults.map((card) => (
                    <button
                      key={card.card_id}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                      onClick={() => {
                        setSelectedCard(card);
                        setCardSearch(card.name);
                        setSearchResults([]);
                      }}
                    >
                      <span className="font-medium">{card.name}</span>
                      <Badge variant="outline" className="text-xs">{card.card_type.name}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {selectedCard && (
                <div className="flex items-center gap-2 rounded bg-muted px-3 py-2 text-sm">
                  <span className="font-medium">{selectedCard.name}</span>
                  <Badge variant="outline">{selectedCard.card_type.name}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 w-6 p-0"
                    onClick={() => { setSelectedCard(null); setCardSearch(''); }}
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máximo copias</Label>
                <Select value={addMaxQty} onValueChange={setAddMaxQty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 — Prohibida</SelectItem>
                    <SelectItem value="1">1 — Limitada a 1</SelectItem>
                    <SelectItem value="2">2 — Limitada a 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Justificación..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddLimit} disabled={isAdding || !selectedCard}>
              {isAdding ? 'Agregando...' : 'Agregar Restricción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
