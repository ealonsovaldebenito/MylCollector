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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import type { ImportFormat, ImportResult, ImportAmbiguousLine } from '@myl/shared';
import { ImportWizard } from './import-wizard';

interface ImportDeckDialogProps {
  deckId: string | null;
  onImportSuccess: (versionId: string) => void;
  trigger?: React.ReactNode;
}

export function ImportDeckDialog({ deckId, onImportSuccess, trigger }: ImportDeckDialogProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ImportFormat>('txt');
  const [payload, setPayload] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ambiguousResult, setAmbiguousResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    if (!deckId || !payload.trim()) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/decks/${deckId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al importar el mazo');
      }

      const result: ImportResult = data.data;

      if (result.status === 'AMBIGUOUS') {
        setAmbiguousResult(result);
      } else {
        // Success - close dialog and notify parent
        onImportSuccess(result.deck_version_id);
        setOpen(false);
        setPayload('');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Error al importar el mazo');
    } finally {
      setIsImporting(false);
    }
  };

  const handleWizardComplete = (versionId: string) => {
    setAmbiguousResult(null);
    setPayload('');
    setOpen(false);
    onImportSuccess(versionId);
  };

  const handleWizardCancel = () => {
    setAmbiguousResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!deckId}>
            <Upload className="h-3.5 w-3.5" />
            Importar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        {ambiguousResult && ambiguousResult.status === 'AMBIGUOUS' ? (
          <ImportWizard
            deckId={deckId!}
            ambiguousLines={ambiguousResult.ambiguous_lines}
            resolvedCards={ambiguousResult.resolved_cards}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Importar mazo</DialogTitle>
              <DialogDescription>
                Pega el contenido de tu mazo en el formato seleccionado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <RadioGroup
                  value={format}
                  onValueChange={(v) => setFormat(v as ImportFormat)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="txt" id="import-txt" />
                    <Label htmlFor="import-txt" className="cursor-pointer text-sm font-normal">
                      Texto (.txt)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="import-csv" />
                    <Label htmlFor="import-csv" className="cursor-pointer text-sm font-normal">
                      CSV (.csv)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payload">Contenido</Label>
                <Textarea
                  id="payload"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder={
                    format === 'txt'
                      ? '1x Oro Básico [Mundo Gótico]\n3x Sombra Nocturna [Mundo Gótico]\n...'
                      : 'Qty,Card Name,Edition,Type,Cost,Starting Gold\n1,Oro Básico,Mundo Gótico,ORO,,Sí\n...'
                  }
                  className="min-h-[200px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  {format === 'txt'
                    ? 'Formato: Qx Nombre de Carta [Edición]'
                    : 'Primera fila debe ser el encabezado CSV'}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive bg-destructive/10 p-3">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || !deckId || !payload.trim()}
                className="gap-1.5"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    Importar
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
