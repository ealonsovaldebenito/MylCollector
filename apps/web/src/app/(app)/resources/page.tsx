/**
 * /resources — Hub público de recursos de MYL.
 * Oráculos, Ban Lists, Reglas, Glosario, Novedades.
 *
 * Changelog:
 *   2026-02-17 — Fix dynamic Tailwind classes, glass cards, theme-aware
 *   2026-02-16 — Initial creation
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ScrollText, BookOpenCheck, ShieldX, Scale, BookA, Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Recursos | MYL',
  description: 'Oráculos, ban lists, reglas y glosario oficial de Mitos y Leyendas',
};

const SECTION_STYLES: Record<string, { bg: string; icon: string; glow: string }> = {
  violet: {
    bg: 'bg-violet-500/10',
    icon: 'text-violet-500',
    glow: 'bg-violet-500/10',
  },
  rose: {
    bg: 'bg-rose-500/10',
    icon: 'text-rose-500',
    glow: 'bg-rose-500/10',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    glow: 'bg-blue-500/10',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    glow: 'bg-emerald-500/10',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    glow: 'bg-amber-500/10',
  },
};

export default function ResourcesPage() {
  const sections = [
    {
      title: 'Oráculos',
      description: 'Rulings oficiales, erratas y aclaraciones de habilidades por carta',
      href: '/resources/oracles',
      icon: BookOpenCheck,
      color: 'violet',
    },
    {
      title: 'Ban Lists',
      description: 'Restricciones de cartas por formato: prohibidas, limitadas a 1 y a 2 copias',
      href: '/resources/banlist',
      icon: ShieldX,
      color: 'rose',
    },
    {
      title: 'Reglas',
      description: 'Reglas oficiales del juego, fases de turno y mecánicas generales',
      href: '/resources/rules',
      icon: Scale,
      color: 'blue',
    },
    {
      title: 'Glosario',
      description: 'Términos, tipos de habilidad, zonas de juego y conceptos clave',
      href: '/resources/glossary',
      icon: BookA,
      color: 'emerald',
    },
    {
      title: 'Novedades',
      description: 'Últimas noticias, productos nuevos y cambios al formato',
      href: '/resources/news',
      icon: Newspaper,
      color: 'amber',
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
          <ScrollText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Recursos</h1>
          <p className="text-muted-foreground">
            Documentación oficial, reglas y referencias para Mitos y Leyendas
          </p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, i) => {
          const Icon = section.icon;
          const isEnabled = !section.comingSoon;
          const styles = SECTION_STYLES[section.color]!;

          const card = (
            <Card
              key={section.href}
              className={cn(
                'relative overflow-hidden transition-all duration-300',
                'animate-stagger-fade-in',
                isEnabled
                  ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                  : 'cursor-not-allowed opacity-50',
              )}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={cn('absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full blur-2xl', styles.glow)} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', styles.bg)}>
                    <Icon className={cn('h-6 w-6', styles.icon)} />
                  </div>
                  {!isEnabled && (
                    <span className="rounded-lg bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
                      Próximamente
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          );

          return isEnabled ? (
            <Link key={section.href} href={section.href}>
              {card}
            </Link>
          ) : (
            <div key={section.href}>{card}</div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
        <h3 className="mb-2 font-semibold">Fuentes Oficiales</h3>
        <p className="text-sm text-muted-foreground">
          Toda la información de esta sección proviene de documentos oficiales de Mitos y Leyendas
          y del equipo de Juego Organizado. Los oráculos y ban lists son actualizados periódicamente
          según las publicaciones oficiales del juego.
        </p>
      </div>
    </div>
  );
}
