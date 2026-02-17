/**
 * MyDecksDashboard — Lista de mazos del usuario con filtros y estadísticas.
 *
 * Changelog:
 *   2026-02-17 — Rediseño v2: alineado con layout general
 *   2026-02-17 — v3: header sin icono (alineado con dashboard/prices),
 *                stats grid glass, filtros inline, más detalle por mazo
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Copy,
  FolderOpen,
  Globe,
  Layers,
  Lock,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ScrollText,
  Swords,
} from 'lucide-react';

import { useMyDecks } from '@/hooks/use-my-decks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type VisibilityMeta = {
  label: string;
  icon: typeof Globe;
  badgeVariant: React.ComponentProps<typeof Badge>['variant'];
};

const VISIBILITY: Record<'PUBLIC' | 'UNLISTED' | 'PRIVATE', VisibilityMeta> = {
  PUBLIC: { label: 'Público', icon: Globe, badgeVariant: 'default' },
  UNLISTED: { label: 'No listado', icon: FolderOpen, badgeVariant: 'secondary' },
  PRIVATE: { label: 'Privado', icon: Lock, badgeVariant: 'secondary' },
};

type SortKey = 'updated_desc' | 'created_desc' | 'name_asc' | 'name_desc';

export function MyDecksDashboard() {
  const router = useRouter();
  const { decks, isLoading, error, refresh } = useMyDecks();

  const [q, setQ] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'__all__' | 'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('__all__');
  const [formatFilter, setFormatFilter] = useState<'__all__' | string>('__all__');
  const [sortKey, setSortKey] = useState<SortKey>('updated_desc');

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const formatOptions = useMemo(() => {
    const map = new Map<string, { format_id: string; name: string }>();
    for (const d of decks) {
      if (d.format?.format_id && d.format?.name) map.set(d.format.format_id, { format_id: d.format.format_id, name: d.format.name });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [decks]);

  const filteredDecks = useMemo(() => {
    const query = q.trim().toLowerCase();

    let result = decks;
    if (query) result = result.filter((d) => d.name.toLowerCase().includes(query));
    if (visibilityFilter !== '__all__') result = result.filter((d) => d.visibility === visibilityFilter);
    if (formatFilter !== '__all__') result = result.filter((d) => d.format?.format_id === formatFilter);

    const sorted = [...result];
    sorted.sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name, 'es');
      if (sortKey === 'name_desc') return b.name.localeCompare(a.name, 'es');
      if (sortKey === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return sorted;
  }, [decks, formatFilter, q, sortKey, visibilityFilter]);

  const stats = useMemo(() => {
    const total = decks.length;
    const byVisibility = decks.reduce(
      (acc, d) => {
        acc[d.visibility] = (acc[d.visibility] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byFormat = decks.reduce(
      (acc, d) => {
        const key = d.format?.name ?? '—';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topFormats = Object.entries(byFormat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const formatCount = new Set(decks.map((d) => d.format?.format_id).filter(Boolean)).size;
    const lastUpdatedAt = decks[0]?.updated_at ?? null;

    return {
      total,
      public: byVisibility.PUBLIC ?? 0,
      unlisted: byVisibility.UNLISTED ?? 0,
      private: byVisibility.PRIVATE ?? 0,
      topFormats,
      formatCount,
      lastUpdatedAt,
    };
  }, [decks]);

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header — same pattern as /dashboard, /prices */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Mis Mazos</h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona tus mazos y accede al constructor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isLoading ? 'animate-spin' : '')} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button onClick={() => router.push('/decks/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo mazo
          </Button>
        </div>
      </div>

      {/* Stats grid — glass cards like /dashboard */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </>
        ) : (
          <>
            <div className="glass-card flex items-center gap-3 rounded-xl p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ScrollText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-[11px] text-muted-foreground">Total mazos</p>
              </div>
            </div>
            <div className="glass-card flex items-center gap-3 rounded-xl p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-myl-success/10">
                <Globe className="h-5 w-5 text-myl-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.public}</p>
                <p className="text-[11px] text-muted-foreground">Públicos</p>
              </div>
            </div>
            <div className="glass-card flex items-center gap-3 rounded-xl p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Layers className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.formatCount}</p>
                <p className="text-[11px] text-muted-foreground">Formatos</p>
              </div>
            </div>
            <div className="glass-card flex items-center gap-3 rounded-xl p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-myl-info/10">
                <Clock className="h-5 w-5 text-myl-info" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  {stats.lastUpdatedAt
                    ? formatDistanceToNow(new Date(stats.lastUpdatedAt), { addSuffix: true, locale: es })
                    : '—'}
                </p>
                <p className="text-[11px] text-muted-foreground">Última edición</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top formats (compact) */}
      {!isLoading && stats.topFormats.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Formatos:</span>
          {stats.topFormats.map(([name, count]) => (
            <Badge key={name} variant="outline" className="gap-1.5 rounded-full">
              {name}
              <span className="text-muted-foreground">{count}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Filters — inline, no card wrapper */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as typeof visibilityFilter)}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Visibilidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              <SelectItem value="PUBLIC">Público</SelectItem>
              <SelectItem value="UNLISTED">No listado</SelectItem>
              <SelectItem value="PRIVATE">Privado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={formatFilter} onValueChange={(v) => setFormatFilter(v as typeof formatFilter)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los formatos</SelectItem>
              {formatOptions.map((f) => (
                <SelectItem key={f.format_id} value={f.format_id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Orden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Recientes (actualización)</SelectItem>
              <SelectItem value="created_desc">Recientes (creación)</SelectItem>
              <SelectItem value="name_asc">Nombre (A → Z)</SelectItem>
              <SelectItem value="name_desc">Nombre (Z → A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result count */}
      {!isLoading && (
        <div className="text-xs text-muted-foreground">
          {filteredDecks.length} resultado{filteredDecks.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Deck list */}
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : !isLoading && filteredDecks.length === 0 ? (
        <div className="rounded-xl border border-border/30 bg-card/50 p-10 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50">
            <Layers className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">{q.trim() ? 'Sin resultados' : 'No tienes mazos aún'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {q.trim() ? 'Prueba con otro término de búsqueda o ajusta filtros.' : 'Crea tu primer mazo para empezar a construir.'}
          </p>
          {!q.trim() ? (
            <div className="mt-5">
              <Button onClick={() => router.push('/decks/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear primer mazo
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-5 space-y-3">
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-4 w-3/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-10" />
                  </div>
                </div>
              ))
            : filteredDecks.map((deck, i) => {
                const visibility =
                  (VISIBILITY as Record<string, VisibilityMeta>)[deck.visibility] ?? VISIBILITY.PRIVATE;
                const VisIcon = visibility.icon;

                return (
                  <div
                    key={deck.deck_id}
                    className="group glass-card animate-stagger-fade-in overflow-hidden rounded-xl transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="p-5 space-y-3">
                      {/* Top: Name + Menu */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-semibold">{deck.name}</h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="h-5 px-2 text-[10px]">
                              {deck.format?.name ?? '—'}
                            </Badge>
                            <Badge variant={visibility.badgeVariant} className="h-5 gap-1 px-2 text-[10px]">
                              <VisIcon className="h-3 w-3" />
                              {visibility.label}
                            </Badge>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/builder/${deck.deck_id}`)}>
                              <Swords className="mr-2 h-4 w-4" />
                              Abrir en builder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => copyToClipboard(deck.deck_id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description or strategy */}
                      {deck.description ? (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{deck.description}</p>
                      ) : deck.strategy ? (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground italic">{deck.strategy}</p>
                      ) : null}

                      {/* Meta details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        {deck.edition?.name && (
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {deck.edition.name}
                          </span>
                        )}
                        {deck.race?.name && (
                          <span className="flex items-center gap-1">
                            <Swords className="h-3 w-3" />
                            {deck.race.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(deck.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(deck.updated_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex gap-2 border-t border-border/20 px-5 py-3 bg-surface-1/30">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => router.push(`/builder/${deck.deck_id}`)}
                      >
                        <Swords className="h-3.5 w-3.5" />
                        Abrir
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-10"
                        onClick={() => copyToClipboard(deck.deck_id)}
                        title="Copiar ID"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}
