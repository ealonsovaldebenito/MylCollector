'use client';

import { useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardImage } from '@/components/catalog/card-image';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { ImportAmbiguousLine, ImportResolvedCard } from '@myl/shared';

interface ImportWizardProps {
  deckId: string;
  ambiguousLines: ImportAmbiguousLine[];
  resolvedCards: ImportResolvedCard[];
  onComplete: (versionId: string) => void;
  onCancel: () => void;
}

export function ImportWizard({
  deckId,
  ambiguousLines,
  resolvedCards,
  onComplete,
  onCancel,
}: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Map<number, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLine = ambiguousLines[currentStep];

  const handleSelectOption = (printingId: string) => {
    if (!currentLine) return;
    setSelections(new Map(selections).set(currentLine.line_number, printingId));
  };

  const handleNext = () => {
    if (currentStep < ambiguousLines.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Verify all selections are made
    if (selections.size < ambiguousLines.length) {
      setError('Por favor selecciona una opción para todas las cartas ambiguas');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectionsArray = Array.from(selections.entries()).map(([line_number, card_printing_id]) => ({
        line_number,
        card_printing_id,
      }));

      const response = await fetch(`/api/v1/decks/${deckId}/import/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolved_cards: resolvedCards,
          selections: selectionsArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Error al resolver las ambigüedades');
      }

      onComplete(data.data.deck_version_id);
    } catch (error) {
      console.error('Resolution error:', error);
      setError(error instanceof Error ? error.message : 'Error al completar la importación');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentLine) return null;

  const selectedPrintingId = selections.get(currentLine.line_number);
  const isLastStep = currentStep === ambiguousLines.length - 1;
  const canProceed = selectedPrintingId !== undefined;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Resolver ambigüedades ({currentStep + 1}/{ambiguousLines.length})</DialogTitle>
        <DialogDescription>
          Algunas cartas tienen múltiples impresiones. Selecciona la que deseas usar.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Línea {currentLine.line_number}: {currentLine.original_line}
              </p>
              <p className="text-xs text-amber-700">
                Se encontraron {currentLine.options.length} impresiones de "{currentLine.card_name}"
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          <RadioGroup value={selectedPrintingId || ''} onValueChange={handleSelectOption}>
            <div className="space-y-2">
              {currentLine.options.map((option) => (
                <div
                  key={option.card_printing_id}
                  className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <RadioGroupItem value={option.card_printing_id} id={option.card_printing_id} />
                  <Label
                    htmlFor={option.card_printing_id}
                    className="flex flex-1 cursor-pointer items-center gap-3"
                  >
                    {/* Image */}
                    <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-sm">
                      <CardImage
                        src={option.image_url}
                        alt={option.card_name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{option.card_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {option.edition_name}
                        </Badge>
                        {option.rarity_tier_name && (
                          <Badge variant="secondary" className="text-xs">
                            {option.rarity_tier_name}
                          </Badge>
                        )}
                        {option.legal_status === 'DISCONTINUED' && (
                          <Badge variant="destructive" className="text-xs">
                            Discontinuada
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </ScrollArea>

        {error && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isSubmitting}>
          Anterior
        </Button>
        {!isLastStep ? (
          <Button onClick={handleNext} disabled={!canProceed}>
            Siguiente
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canProceed || isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Importando...
              </>
            ) : (
              'Finalizar importación'
            )}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
