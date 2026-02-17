/**
 * /admin/printings — Vista global de impresiones
 * Lista todas las impresiones con carta, edicion, imagen, rareza.
 * Permite filtrar, editar y eliminar.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Search, ArrowLeft, ImageIcon } from 'lucide-react';
import { editionDisplayName } from '@myl/shared';
import { useCatalogData } from '@/hooks/use-catalog-data';

interface PrintingRow {
  card_printing_id: string;
  card_id: string;
  edition_id: string;
  rarity_tier_id: string | null;
  image_url: string | null;
  illustrator: string | null;
  collector_number: string | null;
  legal_status: string;
  printing_variant: string;
  card: { card_id: string; name: string; card_type: { name: string }; race: { name: string } | null };
  edition: { edition_id: string; name: string; code: string };
  rarity_tier: { name: string } | null;
}

export default function AdminPrintingsPage() {
  const { editions, isLoading: catalogLoading } = useCatalogData();
  const [printings, setPrintings] = useState<PrintingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEdition, setFilterEdition] = useState<string>('');
  const [filterLegal, setFilterLegal] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<PrintingRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrintings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (filterEdition) params.set('edition_id', filterEdition);
      if (filterLegal) params.set('legal_status', filterLegal);
      params.set('limit', '200');

      const res = await fetch(`/api/v1/cards?${params}`);
      const json = await res.json();

      if (!json.ok) return;

      // Flatten: each card's printings become rows
      const rows: PrintingRow[] = [];
      for (const card of json.data.items) {
        for (const p of card.printings ?? []) {
          rows.push({
            ...p,
            card: {
              card_id: card.card_id,
              name: card.name,
              card_type: card.card_type,
              race: card.race,
            },
          });
        }
      }

      // Apply edition filter client-side if API doesn't filter printings
      const filtered = filterEdition
        ? rows.filter((r) => r.edition?.edition_id === filterEdition)
        : rows;

      setPrintings(filtered);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [search, filterEdition, filterLegal]);

  useEffect(() => {
    const timeout = setTimeout(fetchPrintings, 300);
    return () => clearTimeout(timeout);
  }, [fetchPrintings]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/v1/cards/${deleteTarget.card.card_id}/printings/${deleteTarget.card_printing_id}`,
        { method: 'DELETE' },
      );
      const json = await res.json();
      if (json.ok) {
        setPrintings((prev) => prev.filter((p) => p.card_printing_id !== deleteTarget.card_printing_id));
      }
    } catch {
      // silent
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Impresiones</h1>
            <p className="text-sm text-muted-foreground">
              {printings.length} impresiones encontradas
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de carta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterEdition || '__all__'}
          onValueChange={(v) => setFilterEdition(v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las ediciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las ediciones</SelectItem>
            {!catalogLoading && editions.map((e) => (
              <SelectItem key={e.edition_id} value={e.edition_id}>
                {editionDisplayName(e.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLegal || '__all__'} onValueChange={(v) => setFilterLegal(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado legal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="LEGAL">Legal</SelectItem>
            <SelectItem value="RESTRICTED">Restringida</SelectItem>
            <SelectItem value="BANNED">Prohibida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Imagen</TableHead>
                <TableHead>Carta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Edicion</TableHead>
                <TableHead>Rareza</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron impresiones
                  </TableCell>
                </TableRow>
              ) : (
                printings.map((p) => (
                  <TableRow key={p.card_printing_id}>
                    <TableCell>
                      {p.image_url ? (
                        <Image
                          src={p.image_url}
                          alt={p.card.name}
                          width={40}
                          height={56}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-10 items-center justify-center rounded bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/cards/${p.card.card_id}/edit`}
                        className="font-medium hover:text-primary"
                      >
                        {p.card.name}
                      </Link>
                      {p.card.race && (
                        <p className="text-xs text-muted-foreground">{p.card.race.name}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.card.card_type.name}</Badge>
                    </TableCell>
                    <TableCell>{editionDisplayName(p.edition?.name ?? '')}</TableCell>
                    <TableCell>{p.rarity_tier?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={p.legal_status === 'LEGAL' ? 'secondary' : 'destructive'}
                      >
                        {p.legal_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/cards/${p.card.card_id}/printings/${p.card_printing_id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar impresion</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de eliminar la impresion de <strong>{deleteTarget?.card.name}</strong> en{' '}
              <strong>{deleteTarget?.edition?.name}</strong>? Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
