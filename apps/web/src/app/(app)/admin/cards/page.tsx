'use client';

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Search, ImagePlus, Filter, X, BarChart3, Copy, Table, LayoutGrid, Download, Upload } from 'lucide-react';
import { editionDisplayName } from '@myl/shared';
import { EmptyState } from '@/components/feedback';
import { useCatalogData } from '@/hooks/use-catalog-data';
import { CardGridView } from '@/components/admin/card-grid-view';
import { CsvImportDialog } from '@/components/admin/csv-import-dialog';

interface Printing {
  card_printing_id: string;
  edition_id: string;
  edition_name: string;
  block_id: string;
  block_name: string;
  price_consensus: number | null;
  image_url: string | null;
  rarity_tier_name: string | null;
  legal_status: string;
}

interface CardRow {
  card_id: string;
  name: string;
  card_type: { name: string; code: string };
  race: { name: string; code: string } | null;
  cost: number | null;
  ally_strength: number | null;
  is_unique: boolean;
  printings: Printing[];
  avg_price: number | null;
}

export default function AdminCardsPage() {
  const { cardTypes, races, blocks, editions, isLoading: catalogLoading } = useCatalogData();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterRace, setFilterRace] = useState<string>('');
  const [filterBlock, setFilterBlock] = useState<string>('');
  const [filterEdition, setFilterEdition] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState<number>(1);
  const [pageCursors, setPageCursors] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (filterType) params.set('card_type_id', filterType);
    if (filterRace) params.set('race_id', filterRace);
    if (filterBlock) params.set('block_id', filterBlock);
    if (filterEdition) params.set('edition_id', filterEdition);
    params.set('limit', String(pageSize));

    const cursor = pageCursors[page - 1] ?? null;
    if (cursor) params.set('cursor', cursor);

    const qs = params.toString();
    const res = await fetch(`/api/v1/cards${qs ? `?${qs}` : ''}`);
    const json = await res.json();
    if (json.ok) {
      setTotal(typeof json.data.total === 'number' ? json.data.total : null);
      setNextCursor(json.data.next_cursor ?? null);
      // Group printings by card
      const cardsMap = new Map<string, CardRow>();
      json.data.items.forEach((item: Record<string, unknown>) => {
        const card = item.card as Record<string, unknown>;
        const edition = item.edition as Record<string, unknown>;
        const rarityTier = item.rarity_tier as Record<string, unknown> | null;
        const cardId = card.card_id as string;

        const printing: Printing = {
          card_printing_id: item.card_printing_id as string,
          edition_id: edition.edition_id as string,
          edition_name: edition.name as string,
          block_id: edition.block_id as string,
          block_name: '', // Will be filled later
          price_consensus: null, // TODO: Add when price_consensus is available in API
          image_url: (item.image_url as string | null) ?? null,
          rarity_tier_name: rarityTier ? (rarityTier.name as string) : null,
          legal_status: item.legal_status as string,
        };

        if (!cardsMap.has(cardId)) {
          cardsMap.set(cardId, {
            card_id: cardId,
            name: card.name as string,
            card_type: card.card_type as { name: string; code: string },
            race: (card.race as { name: string; code: string } | null) ?? null,
            cost: (card.cost as number | null) ?? null,
            ally_strength: (card.ally_strength as number | null) ?? null,
            is_unique: card.is_unique as boolean,
            printings: [printing],
            avg_price: null,
          });
        } else {
          cardsMap.get(cardId)!.printings.push(printing);
        }
      });

      // Fill block names
      const cardsArray = Array.from(cardsMap.values());
      cardsArray.forEach((card) => {
        card.printings.forEach((p) => {
          const block = blocks.find((b) => b.block_id === p.block_id);
          if (block) p.block_name = block.name;
        });

        // Calculate average price (when available)
        const prices = card.printings
          .map((p) => p.price_consensus)
          .filter((p): p is number => p !== null);
        if (prices.length > 0) {
          card.avg_price = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
        }
      });

      setCards(cardsArray);
    }
    setIsLoading(false);
  }, [search, filterType, filterRace, filterBlock, filterEdition, blocks, pageSize, pageCursors, page]);

  // Reset pagination when filters / page size change
  useEffect(() => {
    setPage(1);
    setPageCursors([null]);
    setNextCursor(null);
  }, [search, filterType, filterRace, filterBlock, filterEdition, pageSize]);

  useEffect(() => {
    if (!catalogLoading) {
      const timer = setTimeout(load, search ? 300 : 0);
      return () => clearTimeout(timer);
    }
  }, [load, search, catalogLoading]);

  async function handleDelete(cardId: string, name: string) {
    if (!confirm(`¿Eliminar la carta "${name}"? Esta acción no se puede deshacer.`)) return;

    const res = await fetch(`/api/v1/cards/${cardId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.ok) {
      setCards((prev) => prev.filter((c) => c.card_id !== cardId));
    } else {
      alert(json.error?.message ?? 'Error al eliminar');
    }
  }

  function clearFilters() {
    setSearch('');
    setFilterType('');
    setFilterRace('');
    setFilterBlock('');
    setFilterEdition('');
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  async function handleExportCSV() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (filterType) params.set('card_type_id', filterType);
      if (filterRace) params.set('race_id', filterRace);
      if (filterBlock) params.set('block_id', filterBlock);
      if (filterEdition) params.set('edition_id', filterEdition);

      const qs = params.toString();
      const res = await fetch(`/api/v1/cards/export${qs ? `?${qs}` : ''}`);

      if (!res.ok) {
        alert('Error al exportar');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myl-cartas-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  }

  const hasActiveFilters = search || filterType || filterRace || filterBlock || filterEdition;

  // Filtrar ediciones según bloque seleccionado
  const filteredEditions = useMemo(
    () => (filterBlock ? editions.filter((e) => e.block_id === filterBlock) : editions),
    [filterBlock, editions],
  );

  // Estadísticas
  const stats = useMemo(() => {
    const total = cards.length;
    const byType = cardTypes.map((ct) => ({
      type: ct.name,
      count: cards.filter((c) => c.card_type.code === ct.code).length,
    }));
    const totalPrintings = cards.reduce((sum, c) => sum + c.printings.length, 0);
    const uniques = cards.filter((c) => c.is_unique).length;
    return { total, byType, totalPrintings, uniques };
  }, [cards, cardTypes]);

  const canPrev = page > 1;
  const canNext = nextCursor !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Gestion de Cartas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra el catalogo completo de cartas y sus impresiones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Link href="/admin/cards/new">
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Carta
            </Button>
          </Link>
        </div>
      </div>

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onSuccess={load}
      />

      {/* Stats */}
      {!catalogLoading && !isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Total Cartas</p>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Total Impresiones</p>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.totalPrintings}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Cartas Únicas</p>
            <p className="text-3xl font-bold mt-2">{stats.uniques}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Distribución</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {stats.byType.map((t) =>
                t.count > 0 ? (
                  <Badge key={t.type} variant="secondary" className="text-xs">
                    {t.type}: {t.count}
                  </Badge>
                ) : null,
              )}
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cartas por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 / pág.</SelectItem>
                <SelectItem value="50">50 / pág.</SelectItem>
                <SelectItem value="100">100 / pág.</SelectItem>
                <SelectItem value="200">200 / pág.</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canPrev || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canNext || isLoading}
                onClick={() => {
                  if (!nextCursor) return;
                  setPageCursors((prev) => {
                    const next = [...prev];
                    next[page] = nextCursor;
                    return next;
                  });
                  setPage((p) => p + 1);
                }}
              >
                Siguiente
              </Button>
              <span className="ml-2 text-xs text-muted-foreground">
                Página {page}
                {total !== null ? ` · ${total} resultados` : null}
              </span>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Limpiar filtros
            </Button>
          )}
          <Separator orientation="vertical" className="h-8" />
          <div className="flex rounded-md border border-border">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
              title="Vista tabla"
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('cards')}
              title="Vista cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:hidden">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 / pág.</SelectItem>
              <SelectItem value="50">50 / pág.</SelectItem>
              <SelectItem value="100">100 / pág.</SelectItem>
              <SelectItem value="200">200 / pág.</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPrev || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canNext || isLoading}
              onClick={() => {
                if (!nextCursor) return;
                setPageCursors((prev) => {
                  const next = [...prev];
                  next[page] = nextCursor;
                  return next;
                });
                setPage((p) => p + 1);
              }}
            >
              Siguiente
            </Button>
            <span className="text-xs text-muted-foreground">Página {page}</span>
          </div>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={filterType || '__all__'} onValueChange={(v) => setFilterType(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {cardTypes.map((ct) => (
                      <SelectItem key={ct.card_type_id} value={ct.card_type_id}>
                        {ct.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Raza</Label>
                <Select value={filterRace || '__all__'} onValueChange={(v) => setFilterRace(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las razas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {races.map((r) => (
                      <SelectItem key={r.race_id} value={r.race_id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Bloque</Label>
                <Select
                  value={filterBlock || '__all__'}
                  onValueChange={(v) => {
                    setFilterBlock(v === '__all__' ? '' : v);
                    setFilterEdition('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los bloques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {blocks.map((b) => (
                      <SelectItem key={b.block_id} value={b.block_id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Edición</Label>
                <Select
                  value={filterEdition || '__all__'}
                  onValueChange={(v) => setFilterEdition(v === '__all__' ? '' : v)}
                  disabled={!filterBlock}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las ediciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {filteredEditions.map((e) => (
                      <SelectItem key={e.edition_id} value={e.edition_id}>
                        {editionDisplayName(e.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {catalogLoading || isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Search}
          title={hasActiveFilters ? 'Sin resultados' : 'Sin cartas'}
          description={
            hasActiveFilters
              ? 'No se encontraron cartas con los filtros aplicados'
              : 'No hay cartas registradas. Crea la primera.'
          }
          action={!hasActiveFilters ? { label: 'Crear carta', href: '/admin/cards/new' } : undefined}
        />
      ) : viewMode === 'cards' ? (
        <CardGridView cards={cards} onDelete={handleDelete} copyToClipboard={copyToClipboard} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold">Raza</th>
                <th className="px-4 py-3 text-left font-semibold">Coste</th>
                <th className="px-4 py-3 text-left font-semibold">Fuerza</th>
                <th className="px-4 py-3 text-left font-semibold">Ediciones</th>
                <th className="px-4 py-3 text-left font-semibold">Precio Prom.</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <Fragment key={card.card_id}>
                  <tr
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedCard(expandedCard === card.card_id ? null : card.card_id)
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-muted-foreground">
                          {card.card_id.slice(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(card.card_id);
                          }}
                          title="Copiar ID completo"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{card.name}</span>
                        {card.is_unique && (
                          <Badge variant="outline" className="text-xs">
                            Única
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          card.card_type.code === 'ORO'
                            ? 'default'
                            : card.card_type.code === 'ALIADO'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {card.card_type.name}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {card.race ? (
                        <span className="text-foreground">{card.race.name}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {card.cost !== null ? (
                        <span className="font-mono font-medium">{card.cost}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {card.ally_strength !== null ? (
                        <span className="font-mono font-medium">{card.ally_strength}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {card.printings.slice(0, 2).map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {editionDisplayName(p.edition_name)}
                          </Badge>
                        ))}
                        {card.printings.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{card.printings.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {card.avg_price !== null ? (
                        <span className="font-mono font-medium text-green-600 dark:text-green-400">
                          ${card.avg_price}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin precio</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/cards/${card.card_id}/printings/new`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Agregar impresión"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ImagePlus className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/cards/${card.card_id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(card.card_id, card.name);
                          }}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded row */}
                  {expandedCard === card.card_id && (
                    <tr className="bg-muted/20">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-semibold">ID Completo:</Label>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {card.card_id}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(card.card_id)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold mb-2 block">
                              Impresiones ({card.printings.length}):
                            </Label>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {card.printings.map((p, i) => (
                                <div
                                  key={i}
                                  className="rounded-md border border-border bg-background p-3 space-y-1"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {editionDisplayName(p.edition_name)}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Bloque: {p.block_name || 'N/A'}
                                  </p>
                                  {p.price_consensus && (
                                    <p className="text-xs font-mono text-green-600 dark:text-green-400">
                                      ${p.price_consensus}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
