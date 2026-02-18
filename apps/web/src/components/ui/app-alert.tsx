/**
 * AppAlert - Reusable in-app alert/callout component.
 *
 * Use cases:
 * - Inline page feedback (success/error/warning/info)
 * - Replace native browser `alert()` with branded UI
 *
 * Changelog:
 *   2026-02-18 - Initial creation.
 */

'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export type AppAlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AppAlertProps {
  variant?: AppAlertVariant;
  title: string;
  description?: string | null;
  actions?: ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantClasses: Record<AppAlertVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  error: 'border-destructive/40 bg-destructive/10 text-destructive',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  info: 'border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300',
};

function resolveIcon(variant: AppAlertVariant) {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />;
    case 'error':
      return <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />;
    case 'warning':
      return <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />;
    default:
      return <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />;
  }
}

export function AppAlert({
  variant = 'info',
  title,
  description,
  actions,
  onClose,
  className,
}: AppAlertProps) {
  return (
    <div className={cn('rounded-lg border p-3 text-sm', variantClasses[variant], className)}>
      <div className="flex items-start gap-2">
        {resolveIcon(variant)}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-5">{title}</p>
          {description ? <p className="text-xs opacity-90">{description}</p> : null}
          {actions ? <div className="pt-1">{actions}</div> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Cerrar alerta"
            onClick={onClose}
            className="text-current/70 transition hover:text-current"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
