'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormats } from '@/hooks/use-formats';
import { useEditions, useRaces } from '@/hooks/use-catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function NewDeckPage() {
  const router = useRouter();
  const { formats, isLoading } = useFormats();
  const { editions, isLoading: editionsLoading } = useEditions();
  const { races, isLoading: racesLoading } = useRaces();
  const [name, setName] = useState('');
  const [formatId, setFormatId] = useState('');
  const [editionId, setEditionId] = useState<string>('');
  const [raceId, setRaceId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nuevo Mazo</CardTitle>
          <CardDescription>Ingresa los detalles para crear tu nuevo mazo</CardDescription>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Formato</Label>
            <Select value={formatId} onValueChange={setFormatId} disabled={isCreating}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                {formats.map((f) => (
                  <SelectItem key={f.format_id} value={f.format_id}>
                    <div className="flex flex-col">
                      <span>{f.name}</span>
                      {f.description && (
                        <span className="text-xs text-muted-foreground">{f.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edition">Edición (opcional)</Label>
            <Select value={editionId} onValueChange={setEditionId} disabled={isCreating}>
              <SelectTrigger id="edition">
                <SelectValue placeholder="Todas las ediciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las ediciones</SelectItem>
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
            <Select value={raceId} onValueChange={setRaceId} disabled={isCreating}>
              <SelectTrigger id="race">
                <SelectValue placeholder="Todas las razas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las razas</SelectItem>
                {races.map((r) => (
                  <SelectItem key={r.race_id} value={r.race_id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={isCreating} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !formatId || isCreating}
            className="flex-1"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Mazo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
