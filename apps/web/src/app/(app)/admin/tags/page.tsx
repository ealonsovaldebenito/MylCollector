/**
 * /admin/tags — CRUD de etiquetas (mecánicas)
 * Crear, editar, eliminar etiquetas que se asignan a cartas.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ArrowLeft, Tag } from 'lucide-react';

interface TagRow {
  tag_id: string;
  name: string;
  slug: string;
  created_at: string;
  card_count: number;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create/Edit state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRow | null>(null);
  const [tagName, setTagName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<TagRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/tags');
      const json = await res.json();
      if (json.ok) {
        setTags(json.data.tags);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const openCreate = () => {
    setEditingTag(null);
    setTagName('');
    setSaveError(null);
    setDialogOpen(true);
  };

  const openEdit = (tag: TagRow) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tagName.trim()) {
      setSaveError('El nombre es requerido');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const isEdit = !!editingTag;
      const url = isEdit ? `/api/v1/admin/tags/${editingTag.tag_id}` : '/api/v1/admin/tags';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim() }),
      });

      const json = await res.json();

      if (!json.ok) {
        setSaveError(json.error?.message ?? 'Error al guardar');
        return;
      }

      setDialogOpen(false);
      fetchTags();
    } catch {
      setSaveError('Error de conexion');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/admin/tags/${deleteTarget.tag_id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        setTags((prev) => prev.filter((t) => t.tag_id !== deleteTarget.tag_id));
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
            <h1 className="text-2xl font-bold">Etiquetas</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las etiquetas (mecanicas) que se asignan a las cartas
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva etiqueta
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Cartas</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p>No hay etiquetas creadas</p>
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.tag_id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs">{tag.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tag.card_count}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tag.created_at).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(tag)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(tag)}
                          className="text-destructive hover:text-destructive"
                          disabled={tag.card_count > 0}
                          title={tag.card_count > 0 ? 'No se puede eliminar: tiene cartas asociadas' : 'Eliminar'}
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

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Editar etiqueta' : 'Nueva etiqueta'}</DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Modifica el nombre de la etiqueta. El slug se actualiza automaticamente.'
                : 'Crea una nueva etiqueta para asignar a cartas.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nombre</Label>
              <Input
                id="tag-name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Ej: Velocidad, Destruccion, Robo..."
                disabled={isSaving}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            {saveError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {saveError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : editingTag ? 'Guardar cambios' : 'Crear etiqueta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar etiqueta</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de eliminar la etiqueta <strong>{deleteTarget?.name}</strong>?
              Esta accion no se puede deshacer.
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
