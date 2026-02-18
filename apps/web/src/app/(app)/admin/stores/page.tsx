/**
 * Admin Stores Page — CRUD for stores with scraping config + printing links.
 * Allows creating/editing stores, managing product links, triggering scrapes.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 *   2026-02-16 — Added platform selector + scrape execution
 *   2026-02-16 — Added store printing links management panel
 *   2026-02-19 — Refactor: modal de vinculación extraído a componente modular.
 *   2026-02-19 — Scrape automático tras vincular link ahora procesa solo el último link añadido.
 *   2026-02-19 — UX: estados visuales de progreso/errores para scraping y vinculación.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Store, RefreshCw, Plus, ExternalLink, Trash2, Settings, Zap,
  Globe, Clock, Link2, X, ChevronRight, Wand2, Image as ImageIcon, Loader2,
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
import { StoreLinkDialog } from '@/components/admin/stores/store-link-dialog';
import { AppAlert, type AppAlertVariant } from '@/components/ui/app-alert';

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

interface ScrapePreview {
  name: string | null;
  price: number | null;
  currency: string;
  available: boolean;
  image_url: string | null;
  stock: number | null;
  original_price: number | null;
  store_id?: string | null;
  store_name?: string | null;
  platform?: string;
}

interface PrintingOption {
  card_printing_id: string;
  card_id: string;
  edition_id: string;
  rarity_tier_id: string | null;
  image_url: string | null;
  illustrator: string | null;
  collector_number: string | null;
  legal_status: string;
  printing_variant: string | null;
  edition: { edition_id: string; name: string; code: string };
  rarity_tier?: { name: string; code: string } | null;
}

const PLATFORM_OPTIONS = [
  { value: 'woocommerce', label: 'WooCommerce', description: 'WordPress + WooCommerce (ArkanoGames)' },
  { value: 'tiendanube', label: 'TiendaNube', description: 'Nuvemshop (MercaderesStore)' },
  { value: 'jumpseller', label: 'Jumpseller', description: 'Jumpseller (PandoraStore)' },
  { value: 'generic_og', label: 'Generico (OG)', description: 'Cualquier tienda con meta tags OG' },
];

function formatCLP(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeProductUrl(value: string): string {
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    if (parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

function isManagedCardImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/card-images/');
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
  const [scrapingStoreId, setScrapingStoreId] = useState<string | null>(null);

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
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [cardPrintings, setCardPrintings] = useState<PrintingOption[]>([]);
  const [cardPrintingsLoading, setCardPrintingsLoading] = useState(false);
  const [selectedPrintingId, setSelectedPrintingId] = useState<string | null>(null);
  const [createReprint, setCreateReprint] = useState(false);
  const [linkProductUrl, setLinkProductUrl] = useState('');
  const [linkProductName, setLinkProductName] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [addLinkProgress, setAddLinkProgress] = useState<string | null>(null);
  const [addLinkError, setAddLinkError] = useState<string | null>(null);

  // Quick scrape preview
  const [quickUrl, setQuickUrl] = useState('');
  const [quickResult, setQuickResult] = useState<ScrapePreview | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [suggestedStore, setSuggestedStore] = useState<{ name: string; url: string; platform: string } | null>(null);
  const [creatingSuggested, setCreatingSuggested] = useState(false);
  const [pageAlert, setPageAlert] = useState<{
    variant: AppAlertVariant;
    title: string;
    description?: string;
  } | null>(null);

  const showPageAlert = useCallback(
    (variant: AppAlertVariant, title: string, description?: string) => {
      setPageAlert({ variant, title, description });
    },
    [],
  );

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
        showPageAlert('error', 'No se pudo guardar la tienda.', json.error?.message ?? undefined);
        return;
      }

      setDialogOpen(false);
      showPageAlert('success', 'Tienda guardada correctamente.');
      load();
    } catch {
      showPageAlert('error', 'Error de conexion.', 'No se pudo guardar la tienda.');
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
        showPageAlert('error', 'No se pudo desactivar la tienda.', json.error?.message ?? undefined);
        return;
      }
      if (selectedStore?.store_id === store.store_id) setSelectedStore(null);
      showPageAlert('success', `Tienda "${store.name}" desactivada.`);
      load();
    } catch {
      showPageAlert('error', 'Error de conexion.', 'No se pudo desactivar la tienda.');
    }
  }

  async function handleTriggerScrape(store: StoreRow) {
    setScrapeResult(null);
    setScrapingStoreId(store.store_id);
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
    } finally {
      setScrapingStoreId(null);
    }
  }

  async function handleQuickScrape() {
    if (!quickUrl.trim()) return;
    setQuickLoading(true);
    setQuickError(null);
    setQuickResult(null);
    setSuggestedStore(null);
    try {
      const res = await fetch('/api/v1/admin/scrape/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: quickUrl.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        setQuickError(json.error?.message ?? 'Error al scrapear');
        return;
      }
      const result = json.data.result as ScrapePreview;
      setQuickResult(result);
      setSuggestedStore(json.data.suggested_store ?? null);
      if (result?.name) setLinkProductName(result.name);
      setLinkProductUrl(quickUrl.trim());

      // Auto-select detected store if present
      const detectedStoreId: string | undefined = json.data.store?.store_id ?? result?.store_id ?? undefined;
      if (detectedStoreId) {
        const found = stores.find((s) => s.store_id === detectedStoreId);
        if (found) {
          setSelectedStore(found);
          loadLinks(detectedStoreId);
        }
      }
    } catch {
      setQuickError('Error de conexión');
    } finally {
      setQuickLoading(false);
    }
  }

  async function handleCreateSuggestedStore() {
    if (!suggestedStore) return;
    setCreatingSuggested(true);
    try {
      const res = await fetch('/api/v1/admin/stores', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: suggestedStore.name,
          url: suggestedStore.url,
          scraper_type: 'web_scrape',
          scraper_config: { platform: suggestedStore.platform, default_currency: 'CLP' },
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setQuickError(json.error?.message ?? 'No se pudo crear la tienda');
        return;
      }
      const created = json.data as StoreRow | null;
      if (created) {
        setSelectedStore(created);
        loadLinks(created.store_id);
      }
      await load();
    } catch {
      setQuickError('Error de conexión al crear tienda');
    } finally {
      setCreatingSuggested(false);
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
        const baseItems = (json.data.items ?? []) as CardSearchResult[];
        const byCard = new Map<string, CardSearchResult>();
        for (const item of baseItems) {
          if (!byCard.has(item.card.card_id)) byCard.set(item.card.card_id, item);
        }

        const allPrintings = await Promise.all(
          [...byCard.values()].map(async (item) => {
            try {
              const rp = await fetch(`/api/v1/cards/${item.card.card_id}/printings`);
              const jp = await rp.json();
              if (!jp.ok) return [];
              const rows = (jp.data ?? []) as PrintingOption[];
              return rows.map((p) => ({
                card_printing_id: p.card_printing_id,
                image_url: p.image_url ?? item.image_url,
                card: { card_id: item.card.card_id, name: item.card.name },
                edition: { name: p.edition?.name ?? item.edition.name, code: p.edition?.code ?? item.edition.code },
                rarity_tier: p.rarity_tier ? { name: p.rarity_tier.name } : item.rarity_tier,
              })) as CardSearchResult[];
            } catch {
              return [item];
            }
          }),
        );

        const flattened = allPrintings.flat();
        setLinkSearchResults(flattened.length > 0 ? flattened : baseItems);
      }
    } catch {
      // silent
    } finally {
      setLinkSearching(false);
    }
  }

  const resetAddLinkState = useCallback((prefill?: { productUrl?: string; productName?: string }) => {
    setLinkSearch('');
    setLinkSearchResults([]);
    setLinkSearching(false);
    setSelectedCard(null);
    setCardPrintings([]);
    setCardPrintingsLoading(false);
    setSelectedPrintingId(null);
    setCreateReprint(false);
    setLinkProductUrl(prefill?.productUrl ?? '');
    setLinkProductName(prefill?.productName ?? '');
    setAddLinkProgress(null);
    setAddLinkError(null);
  }, []);

  function openAddLink() {
    resetAddLinkState();
    setAddLinkOpen(true);
  }

  function openAddLinkFromQuickScrape() {
    resetAddLinkState({
      productUrl: quickUrl.trim(),
      productName: quickResult?.name ?? '',
    });
    setAddLinkOpen(true);
  }

  async function loadPrintings(cardId: string) {
    setCardPrintingsLoading(true);
    try {
      const res = await fetch(`/api/v1/cards/${cardId}/printings`);
      const json = await res.json();
      if (json.ok) {
        const list = (json.data as PrintingOption[]) ?? [];
        setCardPrintings(list);
        if (list.length > 0) setSelectedPrintingId(list[0]!.card_printing_id);
      }
    } catch {
      // silent
    } finally {
      setCardPrintingsLoading(false);
    }
  }

  async function handleAddLink() {
    if (!selectedStore || !selectedCard || !selectedPrintingId || !linkProductUrl.trim()) return;
    const normalizedNewUrl = normalizeProductUrl(linkProductUrl);
    const hasDuplicateInList = links.some(
      (link) => normalizeProductUrl(link.product_url) === normalizedNewUrl,
    );
    if (hasDuplicateInList) {
      setAddLinkError('Esta URL ya esta vinculada a la tienda seleccionada.');
      return;
    }
    setAddingLink(true);
    setAddLinkError(null);
    setAddLinkProgress('Vinculando producto a la carta...');
    try {
      let printingId = selectedPrintingId;
      const productName = linkProductName.trim();
      const shouldCreateReprint = createReprint
        || (productName.length > 0 && normalizeName(productName) !== normalizeName(selectedCard.card.name));

      if (shouldCreateReprint) {
        const base = cardPrintings.find((p) => p.card_printing_id === selectedPrintingId) ?? cardPrintings[0];
        if (!base) throw new Error('No hay impresion base para clonar');

        const variant = (productName || 'reprint').slice(0, 50);
        const existingReprint = cardPrintings.find((p) => normalizeName(p.printing_variant ?? '') === normalizeName(variant));

        if (existingReprint) {
          printingId = existingReprint.card_printing_id;
        } else {
          const resPrinting = await fetch(`/api/v1/cards/${base.card_id}/printings`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              edition_id: base.edition_id,
              rarity_tier_id: base.rarity_tier_id ?? undefined,
              // Never persist external scrape URLs directly in DB.
              // If there is no managed image yet, it will be uploaded via scraped_image_url later.
              image_url: isManagedCardImageUrl(base.image_url) ? base.image_url : undefined,
              illustrator: base.illustrator ?? undefined,
              collector_number: base.collector_number ?? undefined,
              legal_status: base.legal_status ?? 'LEGAL',
              printing_variant: variant,
            }),
          });
          const jsonPrint = await resPrinting.json();
          if (!jsonPrint.ok) {
            throw new Error(jsonPrint.error?.message ?? 'No se pudo crear reimpresion');
          }
          printingId = jsonPrint.data.card_printing_id as string;
        }
      }

      const res = await fetch(`/api/v1/admin/stores/${selectedStore.store_id}/links`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          card_printing_id: printingId,
          product_url: linkProductUrl.trim(),
          product_name: productName || null,
          scraped_image_url: quickResult?.image_url ?? null,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setAddLinkError(json.error?.message ?? 'Error al agregar link');
        setAddLinkProgress(null);
        return;
      }

      const createdLinkId: string | undefined = json.data?.store_printing_link_id;

      // Trigger immediate scrape only for the created link so price appears right away.
      setAddLinkProgress('Actualizando precio del nuevo link...');
      const scrapeRes = await fetch(`/api/v1/admin/stores/${selectedStore.store_id}/scrape`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scope: 'single',
          card_printing_id: printingId,
          store_printing_link_id: createdLinkId,
        }),
      });
      const scrapeJson = await scrapeRes.json().catch(() => null);
      if (scrapeJson?.ok) {
        const exec = scrapeJson.data?.execution;
        if (exec) {
          setScrapeResult(`Precio actualizado al instante: ${exec.success}/${exec.total} exitosos`);
        }
      } else {
        setScrapeResult(scrapeJson?.error?.message ?? 'El link se guardó, pero falló el scrape inmediato.');
      }

      setAddLinkProgress('Link creado y scrape ejecutado.');
      setAddLinkOpen(false);
      setCreateReprint(false);
      setAddLinkProgress(null);
      await loadLinks(selectedStore.store_id);
    } catch (err) {
      setAddLinkError(err instanceof Error ? err.message : 'Error de conexion');
      setAddLinkProgress(null);
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
        showPageAlert('error', 'No se pudo eliminar el link.', json.error?.message ?? undefined);
        return;
      }
      showPageAlert('success', 'Link eliminado correctamente.');
      loadLinks(selectedStore.store_id);
    } catch {
      showPageAlert('error', 'Error de conexion.', 'No se pudo eliminar el link.');
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

      {pageAlert ? (
        <AppAlert
          variant={pageAlert.variant}
          title={pageAlert.title}
          description={pageAlert.description}
          onClose={() => setPageAlert(null)}
        />
      ) : null}

      {/* Quick scrape playground */}
      <div className="rounded-lg border border-border/60 bg-card/70 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-semibold">Scrape rápido</p>
              <p className="text-xs text-muted-foreground">Prueba una URL, ve los datos y luego vincúlala a una carta.</p>
            </div>
          </div>
          <Button size="sm" onClick={handleQuickScrape} disabled={quickLoading || !quickUrl.trim()}>
            {quickLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
            Scrape
          </Button>
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            placeholder="https://tienda.cl/producto..."
            className="flex-1"
          />
        </div>
        {quickError ? (
          <AppAlert
            variant="error"
            title="No se pudo completar el scrape rapido."
            description={quickError}
            onClose={() => setQuickError(null)}
          />
        ) : null}
        {quickResult && (
          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <div className="flex items-start gap-3">
              <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded border border-border bg-background">
                {quickResult.image_url ? (
                  <img src={quickResult.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold truncate">{quickResult.name ?? 'Sin título'}</p>
                <p className="text-xs text-muted-foreground">
                  Precio: {quickResult.price !== null ? formatCLP(quickResult.price) : 'No detectado'} ·
                  Moneda: {quickResult.currency} · {quickResult.available ? 'Disponible' : 'Sin stock'}
                </p>
                {quickResult.platform && (
                  <p className="text-[11px] text-muted-foreground">Plataforma: {quickResult.platform}</p>
                )}
                {quickResult.store_name && (
                  <p className="text-[11px] text-muted-foreground">
                    Tienda detectada: {quickResult.store_name}
                  </p>
                )}
                {quickResult.original_price && (
                  <p className="text-xs text-muted-foreground">Precio lista: {formatCLP(quickResult.original_price)}</p>
                )}
                {quickResult.stock !== null && (
                  <p className="text-xs text-muted-foreground">Stock: {quickResult.stock}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!selectedStore) {
                      showPageAlert(
                        'warning',
                        'Selecciona una tienda antes de vincular.',
                        'El link rapido necesita una tienda activa seleccionada.',
                      );
                      return;
                    }
                    openAddLinkFromQuickScrape();
                  }}
                >
                  Vincular a carta
                </Button>
                {!selectedStore && suggestedStore && (
                  <Button
                    size="sm"
                    onClick={() => handleCreateSuggestedStore()}
                    disabled={creatingSuggested}
                  >
                    {creatingSuggested ? 'Creando...' : `Crear tienda (${suggestedStore.name})`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {scrapeResult ? (
        <AppAlert
          variant={scrapeResult.toLowerCase().startsWith('error') ? 'error' : 'success'}
          title={scrapeResult}
          onClose={() => setScrapeResult(null)}
        />
      ) : null}

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleTriggerScrape(store); }}
                    title="Scrape ahora"
                    disabled={scrapingStoreId !== null}
                  >
                    {scrapingStoreId === store.store_id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-1 h-3 w-3" />
                    )}
                    Scrape
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
                <StoreLinkDialog
                  open={addLinkOpen}
                  onOpenChange={(open) => {
                    setAddLinkOpen(open);
                    if (!open) {
                      resetAddLinkState();
                    }
                  }}
                  storeName={selectedStore.name}
                  linkSearch={linkSearch}
                  onChangeLinkSearch={(value) => {
                    setLinkSearch(value);
                    void searchCards(value);
                  }}
                  linkSearching={linkSearching}
                  linkSearchResults={linkSearchResults}
                  selectedCard={selectedCard}
                  onSelectCard={(item) => {
                    setSelectedCard(item);
                    setLinkProductName(item.card.name);
                    void loadPrintings(item.card.card_id);
                  }}
                  onClearSelectedCard={() => {
                    setSelectedCard(null);
                    setCardPrintings([]);
                    setSelectedPrintingId(null);
                    setCreateReprint(false);
                  }}
                  cardPrintings={cardPrintings}
                  cardPrintingsLoading={cardPrintingsLoading}
                  selectedPrintingId={selectedPrintingId}
                  onSelectPrinting={(printingId) => setSelectedPrintingId(printingId)}
                  linkProductUrl={linkProductUrl}
                  onChangeLinkProductUrl={setLinkProductUrl}
                  linkProductName={linkProductName}
                  onChangeLinkProductName={setLinkProductName}
                  createReprint={createReprint}
                  onChangeCreateReprint={setCreateReprint}
                  addLinkProgress={addLinkProgress}
                  addLinkError={addLinkError}
                  onClearAddLinkError={() => setAddLinkError(null)}
                  onSubmit={handleAddLink}
                  isSubmitting={addingLink}
                  canSubmit={!!selectedPrintingId && !!linkProductUrl.trim()}
                  quickContext={quickResult ? { ...quickResult, source_url: quickUrl.trim() } : null}
                  trigger={(
                    <Button size="sm" onClick={openAddLink}>
                      <Plus className="mr-1 h-3 w-3" />Agregar Link
                    </Button>
                  )}
                />
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
