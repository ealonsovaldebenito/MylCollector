/**
 * /decks/new - Wizard rápido para crear mazo.
 *
 * Bugfixes / Notas:
 * - Si se selecciona edición, el selector de raza se restringe a razas presentes en esa edición.
 * - UI refresh: layout en dos paneles con resumen dinámico y ayudas contextuales.
 *
 * Changelog:
 * - 2026-02-18 — Upgrade visual UX/UI del formulario de creación de mazos.
 * - 2026-02-18 — Restricción de razas por edición seleccionada.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormats } from '@/hooks/use-formats';
import { useEditions, useRaces } from '@/hooks/use-catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Sparkles, Shield, Eye, Layers, type LucideIcon } from 'lucide-react';

export default function NewDeckPage() {
  const router = useRouter();
  const { formats, isLoading } = useFormats();
  const { editions, isLoading: editionsLoading } = useEditions();
  const { races, isLoading: racesLoading } = useRaces();
  const [name, setName] = useState('');
  const [formatId, setFormatId] = useState('');
  const [editionId, setEditionId] = useState<string>('');
  const [raceId, setRaceId] = useState<string>('');
  const [availableRaceIds, setAvailableRaceIds] = useState<Set<string> | null>(null);
  const [isLoadingEditionRaces, setIsLoadingEditionRaces] = useState(false);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('PRIVATE');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFormat = useMemo(
    () => formats.find((f) => f.format_id === formatId) ?? null,
    [formats, formatId],
  );
  const selectedEdition = useMemo(
    () => editions.find((e) => e.edition_id === editionId) ?? null,
    [editions, editionId],
  );
  const selectedRace = useMemo(
    () => races.find((r) => r.race_id === raceId) ?? null,
    [races, raceId],
  );

  const formatParams = (selectedFormat?.params_json ?? {}) as Record<string, unknown>;
  const deckSize =
    typeof formatParams.deck_size === 'number' && formatParams.deck_size > 0
      ? Math.floor(formatParams.deck_size)
      : 50;
  const defaultCardLimit =
    typeof formatParams.default_card_limit === 'number' && formatParams.default_card_limit > 0
      ? Math.floor(formatParams.default_card_limit)
      : 3;

  const canCreate = !!name.trim() && !!formatId && !isCreating;

  useEffect(() => {
    if (!editionId) {
      setAvailableRaceIds(null);
      setIsLoadingEditionRaces(false);
      return;
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setIsLoadingEditionRaces(true);
      try {
        const res = await fetch(`/api/v1/catalog/editions/${editionId}/races`, { signal: ctrl.signal });
        const json = await res.json();
        if (!json.ok) {
          setAvailableRaceIds(null);
          return;
        }
        const next = new Set<string>((json.data.items ?? []) as string[]);
        setAvailableRaceIds(next);
      } catch {
        setAvailableRaceIds(null);
      } finally {
        setIsLoadingEditionRaces(false);
      }
    }, 120);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [editionId]);

  const racesForEdition = useMemo(() => {
    if (!editionId || !availableRaceIds) return races;
    return races.filter((r) => availableRaceIds.has(r.race_id));
  }, [editionId, availableRaceIds, races]);

  useEffect(() => {
    if (!raceId) return;
    if (!editionId || !availableRaceIds) return;
    if (!availableRaceIds.has(raceId)) {
      setRaceId('');
    }
  }, [editionId, raceId, availableRaceIds]);

  const handleCreate = async () => {
    if (!name.trim() || !formatId) return;

    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          format_id: formatId,
          edition_id: editionId || null,
          race_id: raceId || null,
          visibility,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'Error al crear mazo');
        return;
      }
      router.push(`/builder/${json.data.deck_id}`);
    } catch {
      setError('Error de conexion');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading || editionsLoading || racesLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Crear Nuevo Mazo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define formato, edición y raza para arrancar directo en el builder.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} disabled={isCreating}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                Configuración base
              </span>
            </div>
            <CardTitle>Datos del mazo</CardTitle>
            <CardDescription>
              El mazo se crea y te lleva al constructor con estos filtros aplicados.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del mazo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Elfos Rapidos"
                disabled={isCreating}
                className="h-11"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="format">Formato</Label>
                <Select value={formatId || '__none__'} onValueChange={(v) => setFormatId(v === '__none__' ? '' : v)} disabled={isCreating}>
                  <SelectTrigger id="format" className="h-11">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Seleccionar formato</SelectItem>
                    {formats.map((f) => (
                      <SelectItem key={f.format_id} value={f.format_id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFormat?.description ? (
                  <p className="text-xs text-muted-foreground">{selectedFormat.description}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edition">Edición (opcional)</Label>
                <Select
                  value={editionId || '__all__'}
                  onValueChange={(v) => setEditionId(v === '__all__' ? '' : v)}
                  disabled={isCreating}
                >
                  <SelectTrigger id="edition" className="h-11">
                    <SelectValue placeholder="Todas las ediciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las ediciones</SelectItem>
                    {editions.map((e) => (
                      <SelectItem key={e.edition_id} value={e.edition_id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="race">Raza (opcional)</Label>
                <Select
                  value={raceId || '__all__'}
                  onValueChange={(v) => setRaceId(v === '__all__' ? '' : v)}
                  disabled={isCreating || isLoadingEditionRaces}
                >
                  <SelectTrigger id="race" className="h-11">
                    <SelectValue
                      placeholder={
                        isLoadingEditionRaces
                          ? 'Cargando razas...'
                          : editionId
                            ? 'Razas de la edición'
                            : 'Todas las razas'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las razas</SelectItem>
                    {racesForEdition.map((r) => (
                      <SelectItem key={r.race_id} value={r.race_id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {editionId
                    ? `${racesForEdition.length} raza(s) disponibles para esta edición`
                    : 'Si eliges edición, la raza se filtra automáticamente.'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilidad</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)} disabled={isCreating}>
                <SelectTrigger id="visibility" className="h-11">
                  <SelectValue placeholder="Seleccionar visibilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">Privado</SelectItem>
                  <SelectItem value="UNLISTED">No listado</SelectItem>
                  <SelectItem value="PUBLIC">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={isCreating} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!canCreate} className="flex-1">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear y abrir Builder
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-surface-2 to-surface-1">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-4 w-4 text-primary" />
              Resumen previo
            </CardTitle>
            <CardDescription>
              Vista rápida de reglas y filtros antes de crear el mazo.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border border-border/60 bg-card/60 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Nombre</p>
              <p className="mt-1 font-medium">{name.trim() || 'Mazo sin nombre'}</p>
            </div>

            <div className="grid gap-2">
              <SummaryRow icon={Shield} label="Formato" value={selectedFormat?.name ?? 'Sin seleccionar'} />
              <SummaryRow icon={Layers} label="Edición" value={selectedEdition?.name ?? 'Todas'} />
              <SummaryRow icon={Sparkles} label="Raza" value={selectedRace?.name ?? 'Todas'} />
              <SummaryRow
                icon={Eye}
                label="Visibilidad"
                value={visibility === 'PRIVATE' ? 'Privado' : visibility === 'UNLISTED' ? 'No listado' : 'Público'}
              />
            </div>

            <Separator />

            <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/8 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Reglas del formato</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Tamaño: {deckSize}</Badge>
                <Badge variant="outline">Límite base: {defaultCardLimit} copias</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                En builder se aplican límites reales por banlist/formato y se exige 1 Oro inicial.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/50 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
