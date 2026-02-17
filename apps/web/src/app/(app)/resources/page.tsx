/**
 * /resources — Hub público de recursos de MYL.
 * Oráculos, Ban Lists, Reglas, Glosario, Novedades.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ScrollText, BookOpenCheck, ShieldX, Scale, BookA, Newspaper,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Recursos | MYL',
  description: 'Oráculos, ban lists, reglas y glosario oficial de Mitos y Leyendas',
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-amber-500">
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
        {sections.map((section) => {
          const Icon = section.icon;
          const isEnabled = !section.comingSoon;

          const card = (
            <Card
              key={section.href}
              className={`relative overflow-hidden transition-all ${
                isEnabled
                  ? 'cursor-pointer border-2 hover:border-primary hover:shadow-lg'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-${section.color}-500/10 blur-2xl`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${section.color}-100 dark:bg-${section.color}-900/30`}>
                    <Icon className={`h-6 w-6 text-${section.color}-600 dark:text-${section.color}-400`} />
                  </div>
                  {!isEnabled && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
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
      <div className="rounded-lg border bg-muted/30 p-6">
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
