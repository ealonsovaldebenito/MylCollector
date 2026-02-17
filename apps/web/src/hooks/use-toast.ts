/**
 * useToast — Wrapper sobre sonner para compatibilidad con API existente.
 *
 * Changelog:
 *   2026-02-16 — Placeholder original
 *   2026-02-18 — Reemplazado con wrapper de sonner
 */

'use client';

import { toast as sonnerToast } from 'sonner';

export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
  }: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, { description });
    } else {
      sonnerToast.success(title, { description });
    }
  };

  return { toast };
}

export { sonnerToast as toast };
