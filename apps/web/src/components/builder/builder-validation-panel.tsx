'use client';

import type { ValidationResult } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, XCircle, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuilderValidationPanelProps {
  validation: ValidationResult | null;
  isValidating: boolean;
}

const SEVERITY_CONFIG = {
  BLOCK: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Error' },
  WARN: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-500/10', label: 'Aviso' },
  INFO: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Info' },
} as const;

export function BuilderValidationPanel({ validation, isValidating }: BuilderValidationPanelProps) {
  if (!validation && !isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Info className="mb-2 h-6 w-6 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">
          Agrega cartas para ver la validacion
        </p>
      </div>
    );
  }

  if (isValidating && !validation) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!validation) return null;

  const blocks = validation.messages.filter((m) => m.severity === 'BLOCK');
  const warns = validation.messages.filter((m) => m.severity === 'WARN');
  const infos = validation.messages.filter((m) => m.severity === 'INFO');

  return (
    <div className="flex flex-col">
      {/* Status header */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 border-b border-border',
          validation.is_valid ? 'bg-green-500/5' : 'bg-destructive/5',
        )}
      >
        {isValidating ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : validation.is_valid ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <span className="text-xs font-semibold">
          {validation.is_valid ? 'Mazo valido' : `${blocks.length} error(es)`}
        </span>
        {warns.length > 0 && (
          <Badge variant="outline" className="ml-auto h-4 px-1.5 text-[10px] text-yellow-600 border-yellow-500/30">
            {warns.length} aviso(s)
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-1 p-2">
          {validation.messages.map((msg, i) => {
            const config = SEVERITY_CONFIG[msg.severity];
            const Icon = config.icon;
            return (
              <div
                key={`${msg.rule_id}-${i}`}
                className={cn('flex items-start gap-2 rounded-md px-2.5 py-2', config.bg)}
              >
                <Icon className={cn('mt-0.5 h-3.5 w-3.5 flex-shrink-0', config.color)} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-xs font-medium', config.color)}>{msg.message}</p>
                  {msg.hint && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{msg.hint}</p>
                  )}
                </div>
              </div>
            );
          })}

          {validation.messages.length === 0 && validation.is_valid && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Sin errores ni advertencias
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
