/**
 * Admin Stores Page — CRUD for stores with scraping config + printing links.
 * Allows creating/editing stores, managing product links, triggering scrapes.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 *   2026-02-16 — Added platform selector + scrape execution
 *   2026-02-16 — Added store printing links management panel
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Store, RefreshCw, Plus, ExternalLink, Trash2, Settings, Zap,
  Globe, Clock, Link2, Search, X, ChevronRight, Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/feedback';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ============================================================================
// Types
// ============================================================================

interface StoreRow {
  store_id: string;
  name: string;
  url: string | null;
  currency_id: string | null;
  logo_url: string | null;
  scraper_type: string;
  scraper_config: Record<string, unknown>;
  polling_interval_hours: number | null;
  last_polled_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StoreLinkRow {
  store_printing_link_id: string;
  store_id: string;
  card_printing_id: string;
  product_url: string;
  product_name: string | null;
  last_price: number | null;
  last_currency_id: string | null;
  last_scraped_at: string | null;
  is_active: boolean;
  card_printing: {
    card_printing_id: string;
    image_url: string | null;
    collector_number: string | null;
    card: { card_id: string; name: string };
    edition: { edition_id: string; name: string; code: string };
  };
}

interface CardSearchResult {
  card_printing_id: string;
  image_url: string | null;
  card: { card_id: string; name: string };
  edition: { name: string; code: string };
  rarity_tier: { name: string } | null;
}

const PLATFORM_OPTIONS = [
  { value: 'woocommerce', label: 'WooCommerce', description: 'WordPress + WooCommerce (ArkanoGames)' },
  { value: 'tiendanube', label: 'TiendaNube', description: 'Nuvemshop (MercaderesStore)' },
  { value: 'jumpseller', label: 'Jumpseller', description: 'Jumpseller (PandoraStore)' },
  { value: 'generic_og', label: 'Genérico (OG)', description: 'Cualquier tienda con meta tags OG' },
];

function formatCLP(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
}

// ============================================================================
// Component
// ============================================================================

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formScraperType, setFormScraperType] = useState('manual');
  const [formPollingHours, setFormPollingHours] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formPlatform, setFormPlatform] = useState('generic_og');
  const [isSaving, setIsSaving] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);

  // Links panel state
  const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);
  const [links, setLinks] = useState<StoreLinkRow[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksTotal, setLinksTotal] = useState(0);

  // Add link dialog
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<CardSearchResult[]>([]);
  const [linkSearching, setLinkSearching] = useState(false);
  const [selectedPrinting, setSelectedPrinting] = useState<CardSearchResult | null>(null);
  const [linkProductUrl, setLinkProductUrl] = useState('');
  const [linkProductName, setLinkProductName] = useState('');
  const [addingLink, setAddingLink] = useState(false);

  // ---- Store CRUD ----

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/stores');
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'Error al cargar tiendas');
        return;
      }
      setStores(json.data.items ?? []);
    } catch {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreateDialog() {
    setEditingStore(null);
    setFormName('');
    setFormUrl('');
    setFormScraperType('web_scrape');
    setFormPollingHours('');
    setFormLogoUrl('');
    setFormPlatform('generic_og');
    setDialogOpen(true);
  }

  function openEditDialog(store: StoreRow) {
    setEditingStore(store);
    setFormName(store.name);
    setFormUrl(store.url ?? '');
    setFormScraperType(store.scraper_type);
    setFormPollingHours(store.polling_interval_hours?.toString() ?? '');
    setFormLogoUrl(store.logo_url ?? '');
    setFormPlatform((store.scraper_config?.platform as string) ?? 'generic_og');
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
      const body = {
        name: formName.trim(),
        url: formUrl.trim() || null,
        scraper_type: formScraperType,
        polling_interval_hours: formPollingHours ? parseInt(formPollingHours, 10) : null,
        logo_url: formLogoUrl.trim() || null,
        scraper_config: { platform: formPlatform, default_currency: 'CLP' },
      };

      const url = editingStore
        ? `/api/v1/admin/stores/${editingStore.store_id}`
        : '/api/v1/admin/stores';
      const method = editingStore ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al guardar');
        return;
      }

      setDialogOpen(false);
      load();
    } catch {
      alert('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(store: StoreRow) {
    if (!confirm(`¿Desactivar la tienda "${store.name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/stores/${store.store_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al desactivar');
        return;
      }
      if (selectedStore?.store_id === store.store_id) setSelectedStore(null);
      load();
    } catch {
      alert('Error de conexión');
    }
  }

  async function handleTriggerScrape(store: StoreRow) {
    setScrapeResult(null);
    try {
      const res = await fetch(`/api/v1/admin/stores/${store.store_id}/scrape`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope: 'all' }),
      });
      const json = await res.json();
      if (!json.ok) {
        setScrapeResult(`Error: ${json.error?.message ?? 'Error al iniciar scraping'}`);
        return;
      }
      const exec = json.data?.execution;
      if (exec) {
        setScrapeResult(
          `Scrape completado — ${exec.success}/${exec.total} exitosos` +
          (exec.failed > 0 ? `, ${exec.failed} fallidos` : ''),
        );
      } else {
        setScrapeResult(`Job creado — ${json.data.links_count} links a procesar`);
      }
      load();
      if (selectedStore?.store_id === store.store_id) loadLinks(store.store_id);
    } catch {
      setScrapeResult('Error de conexión');
    }
  }

  // ---- Links panel ----

  const loadLinks = useCallback(async (storeId: string) => {
    setLinksLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/stores/${storeId}/links?limit=200`);
      const json = await res.json();
      if (json.ok) {
        setLinks(json.data.items ?? []);
        setLinksTotal(json.data.total ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLinksLoading(false);
    }
  }, []);

  function selectStore(store: StoreRow) {
    setSelectedStore(store);
    loadLinks(store.store_id);
  }

  async function searchCards(q: string) {
    if (q.length < 2) { setLinkSearchResults([]); return; }
    setLinkSearching(true);
    try {
      const res = await fetch(`/api/v1/cards?q=${encodeURIComponent(q)}&limit=10`);
      const json = await res.json();
      if (json.ok) {
        setLinkSearchResults(json.data.items ?? []);
      }
    } catch {
      // silent
    } finally {
      setLinkSearching(false);
    }
  }

  function openAddLink() {
    setLinkSearch('');
    setLinkSearchResults([]);
    setSelectedPrinting(null);
    setLinkProductUrl('');
    setLinkProductName('');
    setAddLinkOpen(true);
  }

  async function handleAddLink() {
    if (!selectedStore || !selectedPrinting || !linkProductUrl.trim()) return;
    setAddingLink(true);
    try {
      const res = await fetch(`/api/v1/admin/stores/${selectedStore.store_id}/links`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          card_printing_id: selectedPrinting.card_printing_id,
          product_url: linkProductUrl.trim(),
          product_name: linkProductName.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al agregar link');
        return;
      }
      setAddLinkOpen(false);
      loadLinks(selectedStore.store_id);
    } catch {
      alert('Error de conexión');
    } finally {
      setAddingLink(false);
    }
  }

  async function handleDeleteLink(linkId: string) {
    if (!selectedStore) return;
    if (!confirm('¿Eliminar este link?')) return;
    try {
      const res = await fetch(`/api/v1/admin/stores/${selectedStore.store_id}/links/${linkId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.error?.message ?? 'Error al eliminar');
        return;
      }
      loadLinks(selectedStore.store_id);
    } catch {
      alert('Error de conexión');
    }
  }

  // ---- Render helpers ----

  const scraperTypeBadge = (type: string) => {
    switch (type) {
      case 'web_scrape': return <Badge variant="default">Web Scrape</Badge>;
      case 'api': return <Badge variant="secondary">API</Badge>;
      case 'rss': return <Badge variant="outline">RSS</Badge>;
      default: return <Badge variant="outline">Manual</Badge>;
    }
  };

  const platformBadge = (config: Record<string, unknown>) => {
    const platform = config?.platform as string;
    const opt = PLATFORM_OPTIONS.find((o) => o.value === platform);
    if (!opt) return null;
    return <Badge variant="secondary" className="text-xs">{opt.label}</Badge>;
  };

  // ---- Main render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Tiendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tiendas, configura scrapers y vincula productos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tienda
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStore ? 'Editar Tienda' : 'Nueva Tienda'}</DialogTitle>
                <DialogDescription>
                  {editingStore ? 'Modifica los datos de la tienda.' : 'Agrega una tienda para tracking de precios.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Nombre *</Label>
                  <Input id="store-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Cueva de las Leyendas" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-url">URL de la tienda</Label>
                  <Input id="store-url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://tienda.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-logo">URL del logo</Label>
                  <Input id="store-logo" value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Plataforma de scraping</Label>
                  <Select value={formPlatform} onValueChange={setFormPlatform}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_OPTIONS.find((o) => o.value === formPlatform)?.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Scraper</Label>
                    <Select value={formScraperType} onValueChange={setFormScraperType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="web_scrape">Web Scrape</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                        <SelectItem value="rss">RSS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-polling">Polling (horas)</Label>
                    <Input id="store-polling" type="number" value={formPollingHours} onChange={(e) => setFormPollingHours(e.target.value)} placeholder="24" min={1} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSaving || !formName.trim()}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {scrapeResult && (
        <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
          {scrapeResult}
          <button onClick={() => setScrapeResult(null)} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="inline h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main layout: store list + links panel */}
      <div className="flex gap-6">
        {/* Store list */}
        <div className={selectedStore ? 'w-1/2 space-y-3' : 'w-full space-y-3'}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : error ? (
            <EmptyState icon={Store} title="Error" description={error} />
          ) : stores.length === 0 ? (
            <EmptyState icon={Store} title="Sin tiendas" description="Agrega tu primera tienda para comenzar a trackear precios." />
          ) : (
            stores.map((store) => (
              <div
                key={store.store_id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors cursor-pointer ${
                  selectedStore?.store_id === store.store_id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() => selectStore(store)}
              >
                <div className="flex items-center gap-4">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="h-10 w-10 rounded-md object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <Store className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{store.name}</h3>
                      {!store.is_active && <Badge variant="destructive">Inactiva</Badge>}
                      {scraperTypeBadge(store.scraper_type)}
                      {platformBadge(store.scraper_config)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {store.url && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {new URL(store.url).hostname}
                        </span>
                      )}
                      {store.polling_interval_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Cada {store.polling_interval_hours}h
                        </span>
                      )}
                      {store.last_polled_at && (
                        <span>Último poll: {new Date(store.last_polled_at).toLocaleDateString('es-CL')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleTriggerScrape(store); }} title="Scrape ahora">
                    <Zap className="mr-1 h-3 w-3" />Scrape
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(store); }} title="Editar">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeactivate(store); }} title="Desactivar" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {store.url && (
                    <a href={store.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" title="Visitar"><ExternalLink className="h-4 w-4" /></Button>
                    </a>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Links panel */}
        {selectedStore && (
          <div className="w-1/2 rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <Link2 className="h-4 w-4" />
                  Links de {selectedStore.name}
                </h3>
                <p className="text-xs text-muted-foreground">{linksTotal} productos vinculados</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={addLinkOpen} onOpenChange={setAddLinkOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={openAddLink}>
                      <Plus className="mr-1 h-3 w-3" />Agregar Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Vincular Producto</DialogTitle>
                      <DialogDescription>
                        Busca una carta y vincula su URL del producto en {selectedStore.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Card search */}
                      <div className="space-y-2">
                        <Label>Buscar carta</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={linkSearch}
                            onChange={(e) => {
                              setLinkSearch(e.target.value);
                              searchCards(e.target.value);
                            }}
                            placeholder="Nombre de la carta..."
                            className="pl-9"
                          />
                        </div>
                        {linkSearching && <p className="text-xs text-muted-foreground">Buscando...</p>}
                        {linkSearchResults.length > 0 && !selectedPrinting && (
                          <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                            {linkSearchResults.map((item) => (
                              <button
                                key={item.card_printing_id}
                                type="button"
                                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent/10 transition-colors"
                                onClick={() => {
                                  setSelectedPrinting(item);
                                  setLinkProductName(item.card.name);
                                }}
                              >
                                {item.image_url && (
                                  <img src={item.image_url} alt="" className="h-10 w-7 rounded object-cover" />
                                )}
                                <div>
                                  <span className="text-sm font-medium">{item.card.name}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {item.edition.name}
                                    {item.rarity_tier ? ` — ${item.rarity_tier.name}` : ''}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedPrinting && (
                          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{selectedPrinting.card.name}</span>
                            <span className="text-xs text-muted-foreground">{selectedPrinting.edition.name}</span>
                            <button onClick={() => setSelectedPrinting(null)} className="ml-auto">
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Product URL */}
                      <div className="space-y-2">
                        <Label htmlFor="link-url">URL del producto *</Label>
                        <Input
                          id="link-url"
                          value={linkProductUrl}
                          onChange={(e) => setLinkProductUrl(e.target.value)}
                          placeholder="https://tienda.cl/producto/carta-xyz"
                        />
                      </div>

                      {/* Product name */}
                      <div className="space-y-2">
                        <Label htmlFor="link-name">Nombre del producto (opcional)</Label>
                        <Input
                          id="link-name"
                          value={linkProductName}
                          onChange={(e) => setLinkProductName(e.target.value)}
                          placeholder="Se auto-detectará al hacer scrape"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddLinkOpen(false)}>Cancelar</Button>
                      <Button
                        onClick={handleAddLink}
                        disabled={addingLink || !selectedPrinting || !linkProductUrl.trim()}
                      >
                        {addingLink ? 'Agregando...' : 'Agregar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" onClick={() => setSelectedStore(null)} title="Cerrar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Links list */}
            <div className="max-h-[600px] overflow-y-auto">
              {linksLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : links.length === 0 ? (
                <div className="p-8 text-center">
                  <Link2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Sin links. Agrega productos para hacer scrape.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {links.map((link) => (
                    <div key={link.store_printing_link_id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {link.card_printing.image_url && (
                          <img
                            src={link.card_printing.image_url}
                            alt=""
                            className="h-12 w-9 flex-shrink-0 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {link.card_printing.card.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {link.card_printing.edition.name}
                          </p>
                          <a
                            href={link.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{link.product_url}</span>
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {link.last_price !== null ? (
                          <Badge variant="secondary" className="bg-green-500/10 font-mono text-sm font-semibold text-green-700 dark:text-green-300">
                            {formatCLP(link.last_price)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Sin precio</Badge>
                        )}
                        {link.last_scraped_at && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(link.last_scraped_at).toLocaleDateString('es-CL')}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLink(link.store_printing_link_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
