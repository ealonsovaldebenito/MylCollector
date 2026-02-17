/**
 * ThemeToggle — Botón para alternar entre tema dark/light.
 * Usa next-themes para persistir la preferencia del usuario.
 *
 * Changelog:
 *   2026-02-17 — Creación inicial
 */

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, size = 'sm' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn(
        'rounded-lg bg-secondary/50',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        className,
      )} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative flex items-center justify-center rounded-lg transition-all duration-200',
        'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground',
        'active:scale-95',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        className,
      )}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <Sun className={cn(
        'absolute h-4 w-4 transition-all duration-300',
        isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
      )} />
      <Moon className={cn(
        'absolute h-4 w-4 transition-all duration-300',
        isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
      )} />
    </button>
  );
}
