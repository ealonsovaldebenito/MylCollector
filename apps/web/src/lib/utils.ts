import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility para combinar clases Tailwind (requerido por shadcn/ui).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
