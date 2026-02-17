/**
 * CommunityGallery — Layout principal de la sección comunidad.
 * Tabs: Galería / Tendencias, filtros + grid de mazos públicos.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, LayoutGrid, Flame, Loader2, Inbox } from 'lucide-react';
import { usePublicDecks } from '@/hooks/use-public-decks';
import { DeckPublicCard } from './deck-public-card';
import { TrendingSection } from './trending-section';
import type { PublicDeckSort } from '@myl/shared';

interface FormatOption { format_id: string; name: string; code: string; is_active: boolean }

export function CommunityGallery() {
  const [tab, setTab] = useState('gallery');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formatId, setFormatId] = useState<string>();
  const [sort, setSort] = useState<PublicDeckSort>('newest');

  // Load formats from API
  const [activeFormats, setActiveFormats] = useState<FormatOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/formats')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          const items = (json.data?.items ?? json.data ?? []) as FormatOption[];
          setActiveFormats(items.filter((f) => f.is_active));
        }
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  // Debounce search
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout>>();
  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setDebouncedSearch(val), 400));
  };

  const { decks, isLoading, totalCount, hasMore, loadMore } = usePublicDecks({
    q: debouncedSearch || undefined,
    format_id: formatId,
    sort,
  });

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Hero header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Comunidad</h1>
        <p className="mt-1 text-muted-foreground">
          Explora mazos públicos, descubre estrategias y conecta con otros jugadores.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="gallery" className="gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Galería
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-1.5">
            <Flame className="h-3.5 w-3.5" />
            Tendencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar mazos..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {!catalogLoading && activeFormats.length > 0 && (
              <Select value={formatId ?? 'all'} onValueChange={(v) => setFormatId(v === 'all' ? undefined : v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los formatos</SelectItem>
                  {activeFormats.map((f) => (
                    <SelectItem key={f.format_id} value={f.format_id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={sort} onValueChange={(v) => setSort(v as PublicDeckSort)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="most_liked">Más gustados</SelectItem>
                <SelectItem value="most_viewed">Más vistos</SelectItem>
              </SelectContent>
            </Select>

            {totalCount > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {totalCount} mazo{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Grid */}
          {isLoading && decks.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Inbox className="h-12 w-12 opacity-30" />
              <p className="text-sm font-medium">No se encontraron mazos</p>
              <p className="text-xs">Intenta cambiar los filtros o busca otra cosa.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {decks.map((deck, i) => (
                  <div key={deck.deck_id} className="animate-stagger-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <DeckPublicCard deck={deck} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Cargar más
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <TrendingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
