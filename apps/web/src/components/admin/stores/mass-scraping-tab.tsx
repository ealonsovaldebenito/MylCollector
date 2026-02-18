/**
 * File: apps/web/src/components/admin/stores/mass-scraping-tab.tsx
 *
 * Mass Scraping Tab
 * -----------------
 * Additional admin tab for bulk store scraping + bulk association workflow.
 *
 * Flow:
 * 1) Scan many store seeds and build a pending queue (existing DB URLs are ignored).
 * 2) Validate in batches (default 10).
 * 3) Associate each pending URL to a card printing.
 * 4) Import the current batch in one call.
 *
 * Changelog:
 * - 2026-02-18 - Initial tab implementation.
 * - 2026-02-18 - Added batch processing (10 by default) and per-row assignment dialog.
 * - 2026-02-18 - Added optional store override when a scanned row has no store_id.
 * - 2026-02-18 - Added max_new_products control (default 100) and stop-notification in UI.
 * - 2026-02-18 - Added store selection via checkboxes before running scan.
 * - 2026-02-18 - Added progressive product hydration (image/name/edition/price/stock).
 * - 2026-02-18 - Replaced assignment modal with inline editor per row for faster workflow.
 * - 2026-02-18 - Added inline custom reprint-name input for manual variant naming.
 * - 2026-02-18 - Bulk import now reports per-item progress and executes price scrape per item.
 *
 * Bugfix notes:
 * - Keeps current stores page flow untouched by running as an isolated tab component.
 * - Import endpoint enforces image safety (no image replacement when printing already has image).
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Link2, Loader2, RefreshCw, Search, Store, Wand2 } from 'lucide-react';

import { AppAlert } from '@/components/ui/app-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface StoreRow {
  store_id: string;
  name: string;
  url: string | null;
  scraper_config: Record<string, unknown>;
  is_active: boolean;
}

interface ScanStoreConfig {
  store_id: string | null;
  store_name: string;
  seeds: Array<{
    url: string;
    label: string;
    pagination_mode?: 'woo_path' | 'query_page';
    extract_mode?: 'anchor_hint' | 'generic_cards';
    href_hint?: string | null;
    max_pages?: number;
  }>;
}

interface ScanPayload {
  stores: ScanStoreConfig[];
  request_delay_ms?: number;
  max_new_products?: number;
}

interface ScanItem {
  candidate_id: string;
  store_id: string | null;
  store_name: string;
  seed_label: string;
  seed_url: string;
  product_url: string;
  product_name: string | null;
  image_url: string | null;
  normalized_url: string;
}

interface ScanStoreSummary {
  store_id: string | null;
  store_name: string;
  seeds_total: number;
  candidates_found: number;
}

interface ScanResponse {
  summary: {
    scanned_total: number;
    pending_total: number;
    ignored_existing: number;
    duplicates_ignored: number;
    max_new_products?: number;
    limit_reached?: boolean;
  };
  stores: ScanStoreSummary[];
  items: ScanItem[];
}

interface CardSearchResult {
  card_printing_id: string;
  image_url: string | null;
  card: { card_id: string; name: string };
  edition: { name: string; code: string };
  rarity_tier: { name: string } | null;
  printing_variant: string | null;
}

interface PrintingOption {
  card_printing_id: string;
  card_id: string;
  edition_id: string;
  rarity_tier_id?: string | null;
  image_url: string | null;
  collector_number: string | null;
  legal_status: string;
  printing_variant: string | null;
  edition: { name: string; code: string };
  rarity_tier?: { name: string; code: string } | null;
}

interface Assignment {
  card_printing_id: string;
  card_name: string;
  edition_name: string;
}

interface ImportProgressState {
  total: number;
  done: number;
  created: number;
  duplicates: number;
  errors: number;
  current_label: string;
}

interface ScrapePreviewData {
  name: string | null;
  price: number | null;
  currency: string;
  available: boolean;
  image_url: string | null;
  stock: number | null;
  original_price: number | null;
  platform?: string;
  category?: string | null;
}

interface HydrationState {
  status: 'pending' | 'loading' | 'done' | 'error';
  data?: ScrapePreviewData;
  error?: string;
}

interface MassScrapingTabProps {
  stores: StoreRow[];
}

const DEFAULT_BATCH_SIZE = 10;

const STORE_BLUEPRINTS = [
  {
    key: 'mercaderesstore',
    match_names: ['mercaderesstore'],
    seeds: [
      {
        url: 'https://mercaderesstore.cl/productos/',
        label: 'Catalogo',
        pagination_mode: 'woo_path' as const,
        extract_mode: 'anchor_hint' as const,
        href_hint: '/productos/',
      },
    ],
  },
  {
    key: 'arkanogames',
    match_names: ['arkanogames', 'arkano'],
    seeds: [
      { url: 'https://arkanogames.cl/categoria-producto/dominios-de-ra/', label: 'Dominios de Ra', pagination_mode: 'woo_path' as const },
      { url: 'https://arkanogames.cl/categoria-producto/espada-sagrada/', label: 'Espada Sagrada', pagination_mode: 'woo_path' as const },
      { url: 'https://arkanogames.cl/categoria-producto/helenica-2/', label: 'Helenica', pagination_mode: 'woo_path' as const },
      { url: 'https://arkanogames.cl/categoria-producto/hijos-de-danaa/', label: 'Hijos de Daana', pagination_mode: 'woo_path' as const },
    ],
  },
  {
    key: 'camelotcg',
    match_names: ['camelotcg', 'camelot'],
    seeds: [
      { url: 'https://camelotcg.cl/categoria-producto/singles-pb-primer-bloque-re-edit/', label: 'Primer Bloque (Reedit)', pagination_mode: 'woo_path' as const },
      { url: 'https://camelotcg.cl/producto/', label: 'Catalogo', pagination_mode: 'woo_path' as const },
    ],
  },
  {
    key: 'pandorastore',
    match_names: ['pandorastore', 'pandora'],
    seeds: [
      { url: 'https://www.pandorastore.cl/singles-primer-bloque-myl', label: 'Singles Primer Bloque', pagination_mode: 'query_page' as const },
    ],
  },
  {
    key: 'oneupstore',
    match_names: ['oneupstore', 'oneup'],
    seeds: [
      { url: 'https://www.oneupstore.cl/collection/singles-primer-bloque', label: 'Singles Primer Bloque', pagination_mode: 'query_page' as const },
    ],
  },
  {
    key: 'mylserena',
    match_names: ['mylserena'],
    seeds: [
      { url: 'https://mylserena.cl/singles-pb-1', label: 'Singles Primer Bloque', pagination_mode: 'query_page' as const },
    ],
  },
  {
    key: 'minimarketcg',
    match_names: ['minimarketcg', 'minimarke'],
    seeds: [
      { url: 'https://minimarketcg.cl/mitos-y-leyendas-singles/', label: 'Mitos y Leyendas (Singles)', pagination_mode: 'woo_path' as const },
    ],
  },
  {
    key: 'laira',
    match_names: ['laira'],
    seeds: [
      { url: 'https://laira.cl/categoria-producto/singles/singles-primer-bloque/', label: 'Singles Primer Bloque', pagination_mode: 'woo_path' as const },
    ],
  },
  {
    key: 'gorilatcg',
    match_names: ['gorilatcg', 'gorila'],
    seeds: [
      { url: 'https://www.gorilatcg.cl/collection/single-primer-bloque', label: 'Singles Primer Bloque', pagination_mode: 'query_page' as const },
    ],
  },
];

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStoreToken(store: Pick<ScanStoreConfig, 'store_id' | 'store_name'>): string {
  return `${store.store_id ?? 'none'}::${store.store_name.toLowerCase()}`;
}

function isManagedCardImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/card-images/');
}

function buildDefaultPayload(stores: StoreRow[]): ScanPayload {
  const activeStores = stores.filter((store) => store.is_active);

  const mapped: ScanStoreConfig[] = STORE_BLUEPRINTS.map((blueprint) => {
    const found = activeStores.find((store) => {
      const storeName = normalizeText(store.name);
      return blueprint.match_names.some((name) => storeName.includes(name));
    });

    return {
      store_id: found?.store_id ?? null,
      store_name: found?.name ?? blueprint.key,
      seeds: blueprint.seeds,
    };
  });

  return {
    stores: mapped,
    request_delay_ms: 700,
    max_new_products: 100,
  };
}

export function MassScrapingTab({ stores }: MassScrapingTabProps) {
  const [payloadText, setPayloadText] = useState('');
  const [payloadDirty, setPayloadDirty] = useState(false);

  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSummary, setScanSummary] = useState<ScanResponse['summary'] | null>(null);
  const [storeSummary, setStoreSummary] = useState<ScanStoreSummary[]>([]);
  const [items, setItems] = useState<ScanItem[]>([]);

  const [batchSize, setBatchSize] = useState(DEFAULT_BATCH_SIZE);
  const [batchIndex, setBatchIndex] = useState(0);

  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [storeOverrides, setStoreOverrides] = useState<Record<string, string>>({});
  const [selectedStoreTokens, setSelectedStoreTokens] = useState<string[]>([]);

  const [hydrationByCandidate, setHydrationByCandidate] = useState<Record<string, HydrationState>>({});
  const [hydrationRunning, setHydrationRunning] = useState(false);
  const hydrationRunIdRef = useRef(0);

  const [activeCandidate, setActiveCandidate] = useState<ScanItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CardSearchResult[]>([]);
  const [selectedResultPrintingId, setSelectedResultPrintingId] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<CardSearchResult | null>(null);
  const [printings, setPrintings] = useState<PrintingOption[]>([]);
  const [loadingPrintings, setLoadingPrintings] = useState(false);
  const [selectedPrintingId, setSelectedPrintingId] = useState<string | null>(null);
  const [createReprint, setCreateReprint] = useState(false);
  const [reprintName, setReprintName] = useState('');
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [applyingAssignment, setApplyingAssignment] = useState(false);

  const [importLoading, setImportLoading] = useState(false);
  const [importAlert, setImportAlert] = useState<{ variant: 'success' | 'warning' | 'error'; title: string; description?: string } | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgressState | null>(null);
  const searchCacheRef = useRef<Map<string, CardSearchResult[]>>(new Map());
  const printingsCacheRef = useRef<Map<string, PrintingOption[]>>(new Map());

  useEffect(() => {
    if (payloadDirty) return;
    const payload = buildDefaultPayload(stores);
    setPayloadText(JSON.stringify(payload, null, 2));
  }, [stores, payloadDirty]);

  const parsedPayload = useMemo(() => {
    try {
      return JSON.parse(payloadText) as ScanPayload;
    } catch {
      return null;
    }
  }, [payloadText]);

  const selectableStores = parsedPayload?.stores ?? [];

  useEffect(() => {
    if (selectableStores.length === 0) {
      setSelectedStoreTokens([]);
      return;
    }

    const tokens = selectableStores.map((store) => getStoreToken(store));
    setSelectedStoreTokens((prev) => {
      const allowed = new Set(tokens);
      const kept = prev.filter((token) => allowed.has(token));
      return kept.length > 0 ? kept : tokens;
    });
  }, [selectableStores]);

  const totalBatches = useMemo(() => {
    return items.length === 0 ? 1 : Math.max(1, Math.ceil(items.length / batchSize));
  }, [items.length, batchSize]);

  useEffect(() => {
    if (batchIndex < totalBatches) return;
    setBatchIndex(Math.max(0, totalBatches - 1));
  }, [batchIndex, totalBatches]);

  const currentBatchItems = useMemo(() => {
    const start = batchIndex * batchSize;
    return items.slice(start, start + batchSize);
  }, [items, batchIndex, batchSize]);

  const getResolvedStoreId = useCallback((item: ScanItem): string | null => {
    if (item.store_id) return item.store_id;
    return storeOverrides[item.candidate_id] ?? null;
  }, [storeOverrides]);

  const getCandidateProductName = useCallback((item: ScanItem): string => {
    const hydrated = hydrationByCandidate[item.candidate_id];
    const hydratedName = hydrated?.status === 'done' ? hydrated.data?.name : null;
    return (hydratedName ?? item.product_name ?? '').trim();
  }, [hydrationByCandidate]);

  const hydrateScannedItems = useCallback(async (rows: ScanItem[]) => {
    if (rows.length === 0) {
      setHydrationByCandidate({});
      setHydrationRunning(false);
      return;
    }

    const runId = Date.now();
    hydrationRunIdRef.current = runId;
    setHydrationRunning(true);
    setHydrationByCandidate(
      Object.fromEntries(rows.map((item) => [item.candidate_id, { status: 'pending' as const }])),
    );

    const queue = [...rows];
    const workers = Math.min(3, rows.length);
    const hostLastRequest = new Map<string, number>();
    const hostDelayMs = 500;

    const waitForHost = async (url: string) => {
      try {
        const host = new URL(url).hostname;
        const now = Date.now();
        const last = hostLastRequest.get(host) ?? 0;
        const nextAt = last + hostDelayMs;
        if (nextAt > now) {
          await new Promise((resolve) => setTimeout(resolve, nextAt - now));
        }
        hostLastRequest.set(host, Date.now());
      } catch {
        // ignore malformed URL timing
      }
    };

    const runWorker = async () => {
      while (queue.length > 0 && hydrationRunIdRef.current === runId) {
        const item = queue.shift();
        if (!item) return;

        setHydrationByCandidate((prev) => ({
          ...prev,
          [item.candidate_id]: { status: 'loading' },
        }));

        await waitForHost(item.product_url);

        try {
          const res = await fetch('/api/v1/admin/scrape/preview', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ url: item.product_url }),
          });
          const json = await res.json();

          if (hydrationRunIdRef.current !== runId) return;

          if (!json.ok) {
            setHydrationByCandidate((prev) => ({
              ...prev,
              [item.candidate_id]: {
                status: 'error',
                error: json.error?.message ?? 'No se pudo extraer data de producto',
              },
            }));
            continue;
          }

          const result = json.data?.result as ScrapePreviewData | undefined;
          setHydrationByCandidate((prev) => ({
            ...prev,
            [item.candidate_id]: {
              status: 'done',
              data: result,
            },
          }));
        } catch (error) {
          if (hydrationRunIdRef.current !== runId) return;
          setHydrationByCandidate((prev) => ({
            ...prev,
            [item.candidate_id]: {
              status: 'error',
              error: error instanceof Error ? error.message : 'Error al hidratar producto',
            },
          }));
        }
      }
    };

    await Promise.all(Array.from({ length: workers }, () => runWorker()));

    if (hydrationRunIdRef.current === runId) {
      setHydrationRunning(false);
    }
  }, []);

  const loadCardSearch = useCallback(async (value: string) => {
    const query = value.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const cached = searchCacheRef.current.get(query.toLowerCase());
    if (cached) {
      setSearchResults(cached);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/v1/cards?q=${encodeURIComponent(query)}&limit=10`);
      const json = await res.json();
      if (!json.ok) {
        setSearchResults([]);
        return;
      }

      const baseItems = (json.data.items ?? []) as CardSearchResult[];
      const byCard = new Map<string, CardSearchResult>();
      for (const item of baseItems) {
        if (!byCard.has(item.card.card_id)) byCard.set(item.card.card_id, item);
      }

      const expanded = await Promise.all(
        [...byCard.values()].map(async (item) => {
          try {
            const rp = await fetch(`/api/v1/cards/${item.card.card_id}/printings`);
            const jp = await rp.json();
            if (!jp.ok) return [];
            const rows = (jp.data ?? []) as PrintingOption[];
            return rows.map((printing) => ({
              card_printing_id: printing.card_printing_id,
              image_url: printing.image_url ?? item.image_url,
              card: { card_id: item.card.card_id, name: item.card.name },
              edition: {
                name: printing.edition?.name ?? item.edition.name,
                code: printing.edition?.code ?? item.edition.code,
              },
              rarity_tier: printing.rarity_tier ? { name: printing.rarity_tier.name } : item.rarity_tier,
              printing_variant: printing.printing_variant ?? null,
            })) as CardSearchResult[];
          } catch {
            return [item];
          }
        }),
      );

      const flattened = expanded.flat();
      const nextResults = flattened.length > 0 ? flattened : baseItems;
      searchCacheRef.current.set(query.toLowerCase(), nextResults);
      setSearchResults(nextResults);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!activeCandidate) return;
    const term = searchTerm.trim();
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      void loadCardSearch(term);
    }, 150);
    return () => clearTimeout(timeout);
  }, [activeCandidate, searchTerm, loadCardSearch]);

  const loadPrintings = useCallback(async (cardId: string, preferredPrintingId?: string) => {
    const cached = printingsCacheRef.current.get(cardId);
    if (cached) {
      setPrintings(cached);
      setSelectedPrintingId(
        preferredPrintingId && cached.some((row) => row.card_printing_id === preferredPrintingId)
          ? preferredPrintingId
          : (cached[0]?.card_printing_id ?? null),
      );
      return;
    }

    setLoadingPrintings(true);
    try {
      const res = await fetch(`/api/v1/cards/${cardId}/printings`);
      const json = await res.json();
      if (!json.ok) {
        setPrintings([]);
        setSelectedPrintingId(null);
        return;
      }
      const rows = (json.data ?? []) as PrintingOption[];
      printingsCacheRef.current.set(cardId, rows);
      setPrintings(rows);
      setSelectedPrintingId(
        preferredPrintingId && rows.some((row) => row.card_printing_id === preferredPrintingId)
          ? preferredPrintingId
          : (rows[0]?.card_printing_id ?? null),
      );
    } catch {
      setPrintings([]);
      setSelectedPrintingId(null);
    } finally {
      setLoadingPrintings(false);
    }
  }, []);

  function resetAssignmentDialog() {
    setSearchTerm('');
    setSearching(false);
    setSearchResults([]);
    setSelectedResultPrintingId('');
    setSelectedCard(null);
    setPrintings([]);
    setSelectedPrintingId(null);
    setCreateReprint(false);
    setReprintName('');
    setAssignmentError(null);
    setApplyingAssignment(false);
  }

  function openAssignmentDialog(item: ScanItem) {
    resetAssignmentDialog();
    setActiveCandidate(item);
    const productName = getCandidateProductName(item);
    setReprintName(productName);
    const quickTerm = productName.slice(0, 8).trim();
    if (quickTerm.length >= 2) {
      setSearchTerm(quickTerm);
    }
  }

  function closeAssignmentDialog() {
    setActiveCandidate(null);
    resetAssignmentDialog();
  }

  async function applyAssignment() {
    if (!activeCandidate || !selectedCard || !selectedPrintingId) return;
    setApplyingAssignment(true);
    setAssignmentError(null);

    try {
      let resolvedPrintingId = selectedPrintingId;
      const selectedPrinting = printings.find((row) => row.card_printing_id === selectedPrintingId);

      const productName = getCandidateProductName(activeCandidate);
      const customReprintName = reprintName.trim();
      const variantSource = customReprintName || productName;
      const shouldCreateReprint = createReprint
        || (variantSource.length > 0 && normalizeText(variantSource) !== normalizeText(selectedCard.card.name));

      if (shouldCreateReprint) {
        const basePrinting = selectedPrinting ?? printings[0];
        if (!basePrinting) throw new Error('No hay impresion base para crear reimpresion');

        const variant = (variantSource || 'reprint').slice(0, 50);
        const existingReprint = printings.find(
          (row) => normalizeText(row.printing_variant ?? '') === normalizeText(variant),
        );

        if (existingReprint) {
          resolvedPrintingId = existingReprint.card_printing_id;
        } else {
          const res = await fetch(`/api/v1/cards/${basePrinting.card_id}/printings`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              edition_id: basePrinting.edition_id,
              rarity_tier_id: basePrinting.rarity_tier_id ?? undefined,
              image_url: isManagedCardImageUrl(basePrinting.image_url) ? basePrinting.image_url : undefined,
              collector_number: basePrinting.collector_number ?? undefined,
              legal_status: basePrinting.legal_status ?? 'LEGAL',
              printing_variant: variant,
            }),
          });
          const json = await res.json();
          if (!json.ok) {
            throw new Error(json.error?.message ?? 'No se pudo crear reimpresion');
          }
          resolvedPrintingId = json.data?.card_printing_id as string;

          const nextRow: PrintingOption = {
            ...basePrinting,
            card_printing_id: resolvedPrintingId,
            printing_variant: variant,
          };
          setPrintings((prev) => [...prev, nextRow]);
          printingsCacheRef.current.set(basePrinting.card_id, [...printings, nextRow]);
        }
      }

      const resolvedPrinting = printings.find((row) => row.card_printing_id === resolvedPrintingId) ?? selectedPrinting;
      setAssignments((prev) => ({
        ...prev,
        [activeCandidate.candidate_id]: {
          card_printing_id: resolvedPrintingId,
          card_name: selectedCard.card.name,
          edition_name: resolvedPrinting?.edition?.name ?? selectedCard.edition.name,
        },
      }));

      closeAssignmentDialog();
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : 'No se pudo aplicar la asociacion');
    } finally {
      setApplyingAssignment(false);
    }
  }

  async function handleRunScan() {
    setScanLoading(true);
    setScanError(null);
    setImportAlert(null);
    hydrationRunIdRef.current = Date.now();
    setHydrationRunning(false);
    setHydrationByCandidate({});

    try {
      const payload = JSON.parse(payloadText) as ScanPayload;
      const selected = new Set(selectedStoreTokens);
      const filteredStores = payload.stores.filter((store) => selected.has(getStoreToken(store)));
      if (filteredStores.length === 0) {
        setScanError('Selecciona al menos una tienda para ejecutar el scan.');
        return;
      }

      const res = await fetch('/api/v1/admin/stores/bulk/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          stores: filteredStores,
        }),
      });
      const json = await res.json();

      if (!json.ok) {
        setScanError(json.error?.message ?? 'No se pudo ejecutar el scan masivo');
        return;
      }

      const data = json.data as ScanResponse;
      setScanSummary(data.summary);
      setStoreSummary(data.stores ?? []);
      setItems(data.items ?? []);
      setAssignments({});
      setStoreOverrides({});
      setBatchIndex(0);
      void hydrateScannedItems(data.items ?? []);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setScanError('JSON invalido. Revisa la configuracion del scan.');
      } else {
        setScanError('No se pudo ejecutar el scan masivo.');
      }
    } finally {
      setScanLoading(false);
    }
  }

  async function handleImportCurrentBatch() {
    const ready = currentBatchItems
      .map((item) => {
        const assignment = assignments[item.candidate_id];
        const resolvedStoreId = getResolvedStoreId(item);
        if (!assignment || !resolvedStoreId) return null;
        const hydrated = hydrationByCandidate[item.candidate_id];
        const hydratedData = hydrated?.status === 'done' ? hydrated.data : undefined;

        return {
          candidate_id: item.candidate_id,
          store_id: resolvedStoreId,
          card_printing_id: assignment.card_printing_id,
          product_url: item.product_url,
          product_name: hydratedData?.name ?? item.product_name,
          scraped_image_url: hydratedData?.image_url ?? item.image_url,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (ready.length === 0) {
      setImportAlert({
        variant: 'warning',
        title: 'No hay filas listas para importar en este lote.',
        description: 'Asigna impresion y tienda (si falta) antes de importar.',
      });
      return;
    }

    setImportLoading(true);
    setImportAlert(null);
    setImportProgress({
      total: ready.length,
      done: 0,
      created: 0,
      duplicates: 0,
      errors: 0,
      current_label: 'Iniciando importacion...',
    });

    try {
      const removable = new Set<string>();
      let created = 0;
      let duplicates = 0;
      let errors = 0;

      for (let idx = 0; idx < ready.length; idx += 1) {
        const row = ready[idx]!;
        const label = row.product_name ?? row.product_url;
        setImportProgress((prev) => prev ? {
          ...prev,
          current_label: `Procesando ${idx + 1}/${ready.length}: ${label}`,
        } : prev);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45_000);
        try {
          const res = await fetch('/api/v1/admin/stores/bulk/import', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ items: [row], run_scrape: true }),
            signal: controller.signal,
          });
          const json = await res.json();

          if (!json.ok) {
            errors += 1;
          } else {
            const result = (json.data?.results?.[0] ?? null) as {
              candidate_id?: string | null;
              status?: 'created' | 'skipped_duplicate' | 'error';
            } | null;

            if (result?.status === 'created') {
              created += 1;
              if (result.candidate_id) removable.add(result.candidate_id);
            } else if (result?.status === 'skipped_duplicate') {
              duplicates += 1;
              if (result.candidate_id) removable.add(result.candidate_id);
            } else {
              errors += 1;
            }
          }
        } catch {
          errors += 1;
        } finally {
          clearTimeout(timeout);
        }

        setImportProgress((prev) => prev ? {
          ...prev,
          done: idx + 1,
          created,
          duplicates,
          errors,
        } : prev);
      }

      if (removable.size > 0) {
        setItems((prev) => prev.filter((item) => !removable.has(item.candidate_id)));
        setAssignments((prev) => {
          const next = { ...prev };
          for (const id of removable) delete next[id];
          return next;
        });
        setStoreOverrides((prev) => {
          const next = { ...prev };
          for (const id of removable) delete next[id];
          return next;
        });
      }

      setImportAlert({
        variant: errors > 0 ? 'warning' : 'success',
        title: `Lote importado: ${created} creados, ${duplicates} duplicados, ${errors} con error.`,
      });
    } catch {
      setImportAlert({
        variant: 'error',
        title: 'No se pudo importar el lote.',
        description: 'Error de conexion',
      });
    } finally {
      setImportProgress((prev) => prev ? { ...prev, current_label: 'Importacion finalizada' } : prev);
      setImportLoading(false);
    }
  }

  const readyInCurrentBatch = useMemo(() => {
    return currentBatchItems.filter((item) => {
      const assignment = assignments[item.candidate_id];
      const storeId = getResolvedStoreId(item);
      return Boolean(assignment && storeId);
    }).length;
  }, [currentBatchItems, assignments, getResolvedStoreId]);

  const hydrationStats = useMemo(() => {
    const values = Object.values(hydrationByCandidate);
    const total = values.length;
    const done = values.filter((row) => row.status === 'done').length;
    const errors = values.filter((row) => row.status === 'error').length;
    const loading = values.filter((row) => row.status === 'loading').length;
    const completed = done + errors;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, done, errors, loading, completed, percent };
  }, [hydrationByCandidate]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border/60 bg-card/70 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Scrapping Masivo</h2>
            <p className="text-xs text-muted-foreground">
              Escanea seeds de multiples tiendas, ignora URLs ya existentes y valida el pendiente en lotes.
              El scan se corta al llegar al maximo de productos nuevos configurado (default 100).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPayloadDirty(false);
                setPayloadText(JSON.stringify(buildDefaultPayload(stores), null, 2));
              }}
              disabled={scanLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cargar plantilla
            </Button>
            <Button onClick={handleRunScan} disabled={scanLoading}>
              {scanLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Escanear tiendas
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-payload">Configuracion JSON del scan</Label>
          <Textarea
            id="bulk-payload"
            className="min-h-56 font-mono text-xs"
            value={payloadText}
            onChange={(event) => {
              setPayloadDirty(true);
              setPayloadText(event.target.value);
            }}
          />
        </div>

        <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tiendas incluidas en el scan</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStoreTokens(selectableStores.map((store) => getStoreToken(store)))}
              >
                Marcar todas
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStoreTokens([])}>
                Limpiar
              </Button>
            </div>
          </div>
          {selectableStores.length === 0 ? (
            <p className="text-xs text-muted-foreground">Configura un JSON valido para habilitar seleccion.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {selectableStores.map((store) => {
                const token = getStoreToken(store);
                const checked = selectedStoreTokens.includes(token);
                return (
                  <label key={token} className="flex items-center gap-2 rounded border border-border/60 bg-background px-2 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedStoreTokens((prev) => (prev.includes(token) ? prev : [...prev, token]));
                          return;
                        }
                        setSelectedStoreTokens((prev) => prev.filter((item) => item !== token));
                      }}
                    />
                    <span className="font-medium">{store.store_name}</span>
                    <span className="text-muted-foreground">({store.seeds.length} seeds)</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {scanError ? (
        <AppAlert
          variant="error"
          title="No se pudo completar el scan masivo."
          description={scanError}
          onClose={() => setScanError(null)}
        />
      ) : null}

      {importAlert ? (
        <AppAlert
          variant={importAlert.variant}
          title={importAlert.title}
          description={importAlert.description}
          onClose={() => setImportAlert(null)}
        />
      ) : null}

      {importProgress ? (
        <div className="rounded-lg border border-border/60 bg-card/70 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Carga masiva en progreso</p>
            <p className="text-xs text-muted-foreground">
              {importProgress.done}/{importProgress.total} · creados {importProgress.created} · duplicados {importProgress.duplicates} · errores {importProgress.errors}
            </p>
          </div>
          <Progress value={importProgress.total > 0 ? Math.round((importProgress.done / importProgress.total) * 100) : 0} />
          <p className="text-xs text-muted-foreground truncate">{importProgress.current_label}</p>
        </div>
      ) : null}

      {hydrationStats.total > 0 ? (
        <div className="rounded-lg border border-border/60 bg-card/70 p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Enriqueciendo data de productos</p>
            <p className="text-xs text-muted-foreground">
              {hydrationStats.completed}/{hydrationStats.total} · ok {hydrationStats.done} · error {hydrationStats.errors}
              {hydrationRunning ? ` · en curso ${hydrationStats.loading}` : ''}
            </p>
          </div>
          <Progress value={hydrationStats.percent} />
        </div>
      ) : null}

      {scanSummary ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Detectados</p>
            <p className="text-2xl font-bold">{scanSummary.scanned_total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold">{scanSummary.pending_total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Ignorados por DB</p>
            <p className="text-2xl font-bold">{scanSummary.ignored_existing}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Duplicados internos</p>
            <p className="text-2xl font-bold">{scanSummary.duplicates_ignored}</p>
          </div>
        </div>
      ) : null}

      {scanSummary?.limit_reached ? (
        <AppAlert
          variant="info"
          title={`Scan detenido al alcanzar ${scanSummary.max_new_products ?? 100} productos nuevos.`}
          description="Si necesitas mas resultados, aumenta max_new_products en la configuracion JSON y vuelve a escanear."
          onClose={() => setScanSummary((prev) => (prev ? { ...prev, limit_reached: false } : prev))}
        />
      ) : null}

      {storeSummary.length > 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Resumen por tienda</p>
          </div>
          <div className="divide-y divide-border">
            {storeSummary.map((row) => (
              <div key={`${row.store_id ?? row.store_name}`} className="flex items-center justify-between px-4 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span>{row.store_name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Seeds: {row.seeds_total}</Badge>
                  <Badge variant="secondary">Detectados: {row.candidates_found}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Cola pendiente</p>
            <p className="text-xs text-muted-foreground">
              Lote {Math.min(batchIndex + 1, totalBatches)} de {totalBatches} · {currentBatchItems.length} filas visibles · {readyInCurrentBatch} listas para importar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="batch-size" className="text-xs">Tamano lote</Label>
            <Select
              value={String(batchSize)}
              onValueChange={(value) => {
                setBatchSize(Number(value));
                setBatchIndex(0);
              }}
            >
              <SelectTrigger id="batch-size" className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchIndex((prev) => Math.max(0, prev - 1))}
              disabled={batchIndex === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBatchIndex((prev) => Math.min(totalBatches - 1, prev + 1))}
              disabled={batchIndex >= totalBatches - 1}
            >
              Siguiente
            </Button>
            <Button size="sm" onClick={handleImportCurrentBatch} disabled={importLoading || readyInCurrentBatch === 0}>
              {importLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Importar lote
            </Button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {currentBatchItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No hay URLs pendientes en este lote.
            </div>
          ) : currentBatchItems.map((item) => {
            const assignment = assignments[item.candidate_id];
            const resolvedStoreId = getResolvedStoreId(item);
            const needsStore = !resolvedStoreId;
            const hydrated = hydrationByCandidate[item.candidate_id];
            const hydratedData = hydrated?.status === 'done' ? hydrated.data : undefined;
            const displayName = hydratedData?.name ?? item.product_name ?? 'Sin nombre detectado';
            const displayImage = hydratedData?.image_url ?? item.image_url;
            const displayEdition = hydratedData?.category ?? item.seed_label;
            const displayPrice = hydratedData?.price;
            const displayStock = hydratedData?.stock;
            const displayCurrency = hydratedData?.currency ?? 'CLP';
            const displayAvailability = hydratedData?.available;
            const isEditing = activeCandidate?.candidate_id === item.candidate_id;

            return (
              <div key={item.candidate_id} className="space-y-2 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{item.store_name}</Badge>
                  <Badge variant="secondary">{item.seed_label}</Badge>
                  {assignment ? (
                    <Badge variant="default">Asociada</Badge>
                  ) : (
                    <Badge variant="outline">Sin asociar</Badge>
                  )}
                  {needsStore ? (
                    <Badge variant="destructive">Sin tienda DB</Badge>
                  ) : null}
                  {hydrated?.status === 'loading' ? (
                    <Badge variant="outline" className="gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Cargando data
                    </Badge>
                  ) : null}
                  {hydrated?.status === 'error' ? (
                    <Badge variant="destructive">Error data</Badge>
                  ) : null}
                </div>

                <div className="flex gap-3">
                  <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded border border-border/60 bg-muted/20">
                    {displayImage ? (
                      <img src={displayImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Edicion: {displayEdition}
                      {hydratedData?.platform ? ` · ${hydratedData.platform}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Precio: {displayPrice !== null && displayPrice !== undefined ? formatCLP(displayPrice) : 'No detectado'}
                      {' · '}
                      Moneda: {displayCurrency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: {displayStock !== null && displayStock !== undefined ? displayStock : 'No detectado'}
                      {displayAvailability !== undefined ? ` · ${displayAvailability ? 'Disponible' : 'Sin stock'}` : ''}
                    </p>
                    <a
                      href={item.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {item.product_url}
                    </a>
                  </div>
                </div>

                {item.store_id ? null : (
                  <div className="max-w-xs space-y-1">
                    <Label className="text-xs">Asociar tienda</Label>
                    <Select
                      value={storeOverrides[item.candidate_id] ?? '__none__'}
                      onValueChange={(value) => {
                        setStoreOverrides((prev) => {
                          const next = { ...prev };
                          if (value === '__none__') {
                            delete next[item.candidate_id];
                            return next;
                          }
                          next[item.candidate_id] = value;
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tienda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {stores.filter((store) => store.is_active).map((store) => (
                          <SelectItem key={store.store_id} value={store.store_id}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        closeAssignmentDialog();
                        return;
                      }
                      openAssignmentDialog(item);
                    }}
                  >
                    <Search className="mr-1 h-3 w-3" />
                    {isEditing ? 'Cerrar editor' : assignment ? 'Cambiar asociacion' : 'Asociar carta/impresion'}
                  </Button>
                  {assignment ? (
                    <p className="text-xs text-muted-foreground">
                      {assignment.card_name} · {assignment.edition_name}
                    </p>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="grid gap-4 rounded-lg border border-primary/20 bg-primary/5 p-3 lg:grid-cols-12">
                    <div className="space-y-3 lg:col-span-7">
                      <div className="space-y-2">
                        <Label>Buscar carta</Label>
                        <Input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Nombre carta (se autocompleta con 8 caracteres)"
                        />
                        {searching ? <p className="text-xs text-muted-foreground">Buscando...</p> : null}
                      </div>

                      <div className="space-y-1">
                        <Label>Resultados rapidos</Label>
                        <Select
                          value={selectedResultPrintingId || '__none__'}
                          onValueChange={(value) => {
                            if (value === '__none__') {
                              setSelectedResultPrintingId('');
                              setSelectedCard(null);
                              setPrintings([]);
                              setSelectedPrintingId(null);
                              return;
                            }
                            const row = searchResults.find((result) => result.card_printing_id === value);
                            if (!row) return;
                            setSelectedResultPrintingId(value);
                            setSelectedCard(row);
                            void loadPrintings(row.card.card_id, row.card_printing_id);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar carta / impresion..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Sin seleccionar</SelectItem>
                            {searchResults.map((row) => (
                              <SelectItem key={row.card_printing_id} value={row.card_printing_id}>
                                {row.card.name} · {row.edition.name}
                                {row.rarity_tier ? ` · ${row.rarity_tier.name}` : ''}
                                {row.printing_variant ? ` · ${row.printing_variant}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedCard ? (
                        <div className="space-y-2 rounded-md border border-primary/30 bg-background/70 p-3">
                          <p className="text-sm font-semibold">{selectedCard.card.name}</p>
                          <p className="text-xs text-muted-foreground">Selecciona impresion:</p>

                          {loadingPrintings ? (
                            <p className="text-xs text-muted-foreground">Cargando impresiones...</p>
                          ) : (
                            <Select
                              value={selectedPrintingId ?? '__none__'}
                              onValueChange={(value) => setSelectedPrintingId(value === '__none__' ? null : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona impresion" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Sin seleccionar</SelectItem>
                                {printings.map((printing) => (
                                  <SelectItem key={printing.card_printing_id} value={printing.card_printing_id}>
                                    {printing.edition.name}
                                    {printing.collector_number ? ` · #${printing.collector_number}` : ''}
                                    {printing.printing_variant ? ` · ${printing.printing_variant}` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <label className="flex items-start gap-2 rounded-md border border-border/50 bg-background px-2 py-2">
                            <input
                              type="checkbox"
                              checked={createReprint}
                              onChange={(event) => setCreateReprint(event.target.checked)}
                              disabled={!selectedPrintingId}
                              className="mt-0.5 h-4 w-4 accent-primary"
                            />
                            <span className="text-xs text-muted-foreground">
                              Crear impresion nueva usando el nombre del producto cuando no coincide con la carta.
                            </span>
                          </label>

                          <div className="space-y-1">
                            <Label className="text-xs">Nombre para impresion</Label>
                            <Input
                              value={reprintName}
                              onChange={(event) => setReprintName(event.target.value)}
                              placeholder="Nombre de variante/reimpresion"
                              disabled={!selectedPrintingId}
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Si queda vacio, se usa el nombre del producto scrapeado.
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2 lg:col-span-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL pendiente</p>
                      <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                        <p className="text-sm font-medium">{getCandidateProductName(item) || 'Sin nombre detectado'}</p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{item.product_url}</p>
                      </div>
                    </div>

                    {assignmentError ? (
                      <div className="lg:col-span-12">
                        <AppAlert
                          variant="error"
                          title="No se pudo aplicar la asociacion."
                          description={assignmentError}
                          onClose={() => setAssignmentError(null)}
                        />
                      </div>
                    ) : null}

                    <div className="flex justify-end gap-2 lg:col-span-12">
                      <Button variant="outline" onClick={closeAssignmentDialog} disabled={applyingAssignment}>
                        Cancelar
                      </Button>
                      <Button onClick={applyAssignment} disabled={!selectedPrintingId || !selectedCard || applyingAssignment}>
                        {applyingAssignment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Aplicar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

