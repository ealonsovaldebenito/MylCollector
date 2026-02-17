/**
 * /prices — Dashboard de precios comunitarios.
 * Muestra precios de consenso y submissions recientes.
 *
 * Changelog:
 *   2026-02-18 — Reemplazo de placeholder con contenido real
 */

'use client';

import { DollarSign, TrendingUp, Inbox } from 'lucide-react';
import Link from 'next/link';

export default function PricesPage() {
  return (
    <div className="space-y-6 animate-page-enter">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Precios</h1>
        <p className="mt-1 text-muted-foreground">
          Precios de consenso y contribuciones de la comunidad.
        </p>
      </div>

      {/* Placeholder with proper empty state until price data APIs are connected */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="glass-card rounded-xl p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/15">
              <DollarSign className="h-7 w-7 text-accent" />
            </div>
            <h2 className="font-display text-lg font-bold">Catálogo de Precios</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Consulta precios de consenso para las cartas más valiosas. Los precios se calculan automáticamente a partir de múltiples fuentes.
            </p>
            <Link href="/catalog" className="mt-2 text-sm text-accent hover:underline">
              Buscar en el Catálogo
            </Link>
          </div>
        </div>

        <div className="glass-card rounded-xl p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
              <TrendingUp className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-display text-lg font-bold">Contribuye Precios</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Ayuda a la comunidad enviando precios desde el detalle de cada carta. La comunidad vota y el sistema calcula el consenso.
            </p>
            <Link href="/catalog" className="mt-2 text-sm text-accent hover:underline">
              Ir al Catálogo
            </Link>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="rounded-xl border border-border/30 bg-card/50 p-6 text-center backdrop-blur-sm">
        <Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Los datos de precios se mostrarán aquí cuando haya suficientes contribuciones y datos de scraping.
        </p>
      </div>
    </div>
  );
}
