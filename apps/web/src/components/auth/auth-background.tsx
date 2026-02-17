/**
 * AuthBackground — Fondo animado para páginas de auth.
 * Usa colores del tema (tokens CSS) para respetar dark/light mode.
 *
 * Changelog:
 *   2026-02-17 — Migrado de colores hardcoded a tokens del tema
 */

'use client';

export function AuthBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-background">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />

      {/* Animated blobs using theme colors */}
      <div className="animate-blob absolute -left-20 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="animate-blob animation-delay-2000 absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
      <div className="animate-blob animation-delay-4000 absolute left-1/2 top-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
    </div>
  );
}
