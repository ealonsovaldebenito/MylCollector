'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Loader2, FileText, Table, Code, FileImage } from 'lucide-react';
import type { ExportFormat } from '@myl/shared';

interface ExportDeckDialogProps {
  versionId: string | null;
  deckName: string;
  trigger?: React.ReactNode;
}

export function ExportDeckDialog({ versionId, deckName, trigger }: ExportDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('txt');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!versionId) return;

    setIsExporting(true);

    try {
      const response = await fetch(`/api/v1/deck-versions/${versionId}/export?format=${format}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al exportar el mazo');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+?)"/);
      const filename = filenameMatch?.[1] || `${deckName}.${format}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Error al exportar el mazo');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!versionId}>
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar mazo</DialogTitle>
          <DialogDescription>Selecciona el formato de exportación para tu mazo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="txt" id="format-txt" />
              <Label htmlFor="format-txt" className="flex flex-1 cursor-pointer items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Texto plano (.txt)</p>
                  <p className="text-xs text-muted-foreground">
                    Lista simple de cartas, fácil de leer y compartir
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="format-csv" />
              <Label htmlFor="format-csv" className="flex flex-1 cursor-pointer items-center gap-2">
                <Table className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">CSV (.csv)</p>
                  <p className="text-xs text-muted-foreground">
                    Datos estructurados, compatible con Excel
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="format-json" />
              <Label htmlFor="format-json" className="flex flex-1 cursor-pointer items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">JSON (.json)</p>
                  <p className="text-xs text-muted-foreground">
                    Formato completo con validación y estadísticas
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="format-pdf" disabled />
              <Label
                htmlFor="format-pdf"
                className="flex flex-1 cursor-pointer items-center gap-2 opacity-50"
              >
                <FileImage className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">PDF (.pdf)</p>
                  <p className="text-xs text-muted-foreground">Proximamente</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !versionId} className="gap-1.5">
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                Descargar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
