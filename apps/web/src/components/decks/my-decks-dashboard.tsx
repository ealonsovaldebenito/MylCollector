'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Copy,
  FolderOpen,
  Globe,
  Layers,
  Lock,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

import { useMyDecks } from '@/hooks/use-my-decks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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

    const lastUpdatedAt = decks[0]?.updated_at ?? null; // API orders by updated_at desc

    return {
      total,
      public: byVisibility.PUBLIC ?? 0,
      unlisted: byVisibility.UNLISTED ?? 0,
      private: byVisibility.PRIVATE ?? 0,
      topFormats,
      lastUpdatedAt,
    };
  }, [decks]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-6 px-6 py-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-amber-500 shadow-sm">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-bold tracking-tight">Mis Mazos</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Visualiza tus mazos y entra al constructor en un click.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="h-6 gap-1.5 rounded-full px-2.5">
                <span className="font-medium text-foreground">{isLoading ? '—' : stats.total}</span> mazos
              </Badge>
              <Badge variant="outline" className="h-6 gap-1.5 rounded-full px-2.5">
                <Globe className="h-3.5 w-3.5" />
                {isLoading ? '—' : stats.public} públicos
              </Badge>
              <Badge variant="outline" className="h-6 gap-1.5 rounded-full px-2.5">
                <FolderOpen className="h-3.5 w-3.5" />
                {isLoading ? '—' : stats.unlisted} no listados
              </Badge>
              <Badge variant="outline" className="h-6 gap-1.5 rounded-full px-2.5">
                <Lock className="h-3.5 w-3.5" />
                {isLoading ? '—' : stats.private} privados
              </Badge>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Button variant="outline" onClick={refresh} disabled={isLoading} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', isLoading ? 'animate-spin' : '')} />
              Actualizar
            </Button>
            <Button onClick={() => router.push('/decks/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo mazo
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
          <div className="grid gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Búsqueda y filtros</CardTitle>
                <CardDescription>Encuentra rápido por nombre, formato o visibilidad.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none sm:items-center">
                    <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as typeof visibilityFilter)}>
                      <SelectTrigger className="h-9 w-full sm:w-[180px]">
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
                      <SelectTrigger className="h-9 w-full sm:w-[220px]">
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
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-muted px-2 py-1">
                      {isLoading ? 'Cargando…' : `${filteredDecks.length} resultado(s)`}
                    </span>
                    {stats.lastUpdatedAt ? (
                      <span className="hidden sm:inline">
                        Última actualización{' '}
                        {formatDistanceToNow(new Date(stats.lastUpdatedAt), { addSuffix: true, locale: es })}
                      </span>
                    ) : null}
                  </div>

                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="h-8 w-[220px] text-xs">
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
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top formatos</CardTitle>
                <CardDescription>Distribución rápida de tus mazos.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-4/6" />
                  </div>
                ) : stats.topFormats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aún no hay mazos.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topFormats.map(([name, count]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <span className="truncate text-sm">{name}</span>
                        <Badge variant="secondary" className="h-5">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : !isLoading && filteredDecks.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <Layers className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{q.trim() ? 'Sin resultados' : 'No tienes mazos aún'}</h3>
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
                    <Card key={i}>
                      <CardHeader className="space-y-2">
                        <Skeleton className="h-5 w-5/6" />
                        <Skeleton className="h-4 w-3/6" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Skeleton className="h-4 w-4/6" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-10" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : filteredDecks.map((deck) => {
                    const visibility =
                      (VISIBILITY as Record<string, VisibilityMeta>)[deck.visibility] ?? VISIBILITY.PRIVATE;
                    const VisIcon = visibility.icon;

                    return (
                      <Card
                        key={deck.deck_id}
                        className="group overflow-hidden transition-all hover:border-primary/50 hover:shadow-md"
                      >
                        <CardHeader className="space-y-3 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <CardTitle className="truncate text-base">{deck.name}</CardTitle>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
                                  className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/builder/${deck.deck_id}`)}>
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

                          {deck.description ? (
                            <CardDescription className="line-clamp-2 text-xs leading-relaxed">{deck.description}</CardDescription>
                          ) : (
                            <CardDescription className="text-xs">Sin descripción</CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Actualizado{' '}
                              {formatDistanceToNow(new Date(deck.updated_at), { addSuffix: true, locale: es })}
                            </span>
                            <span className="font-mono">{deck.deck_id.slice(0, 8)}…</span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(`/builder/${deck.deck_id}`)}
                            >
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
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
