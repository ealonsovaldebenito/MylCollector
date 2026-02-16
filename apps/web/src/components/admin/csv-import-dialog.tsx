'use client';

import { useState, useRef } from 'react';
import type { CsvImportResult } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'importing' | 'result';

export function CsvImportDialog({ open, onOpenChange, onSuccess }: CsvImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStep('upload');
    setFile(null);
    setPreview([]);
    setResult(null);
    setError(null);
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleFile(f: File) {
    setFile(f);
    setError(null);

    const text = await f.text();
    const lines = text.split('\n').filter((l) => l.trim());
    setPreview(lines.slice(0, 6)); // header + 5 rows max
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      handleFile(f);
    }
  }

  async function handleImport() {
    if (!file) return;
    setStep('importing');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/cards/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'Error en la importacion');
        setStep('upload');
        return;
      }

      setResult(json.data);
      setStep('result');

      if (json.data.created > 0) {
        onSuccess();
      }
    } catch {
      setError('Error de conexion');
      setStep('upload');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Cartas desde CSV
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con las cartas a importar. Las columnas deben coincidir con el
            formato de exportacion.
          </DialogDescription>
        </DialogHeader>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {!file ? (
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8',
                  'transition-colors hover:border-accent/50 hover:bg-muted/30 cursor-pointer',
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <FileText className="h-10 w-10 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Arrastra un archivo CSV o haz click para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Formato: name, card_type_code, race_code, cost, ally_strength, ...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* File info */}
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB · {preview.length - 1} filas detectadas
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">Vista previa:</p>
                    <div className="overflow-x-auto rounded-md border border-border bg-background">
                      <pre className="p-3 text-xs font-mono whitespace-pre overflow-x-auto max-h-40">
                        {preview.map((line, i) => (
                          <div key={i} className={cn(i === 0 && 'font-bold text-primary')}>
                            {line}
                          </div>
                        ))}
                        {preview.length < 6 ? null : (
                          <div className="text-muted-foreground">...</div>
                        )}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importando cartas...</p>
          </div>
        )}

        {/* Step: Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.created}
                </p>
                <p className="text-xs text-muted-foreground">Creadas</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Omitidas</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{result.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errores</p>
              </div>
            </div>

            {/* Success message */}
            {result.created > 0 && result.errors.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                Importacion completada exitosamente
              </div>
            )}

            {/* Errors detail */}
            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Errores ({result.errors.length}):
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2 text-xs"
                    >
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Fila {err.row}
                      </Badge>
                      <span className="text-destructive">
                        {err.field && <span className="font-mono">{err.field}: </span>}
                        {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!file}>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={() => handleClose(false)}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
