/**
 * /resources/rules — Reglas oficiales de MYL.
 * Muestra las reglas básicas del juego, fases de turno y mecánicas generales.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { Scale, Swords, Coins, Shield, Layers, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Reglas | MYL',
  description: 'Reglas oficiales del juego Mitos y Leyendas',
};

const TURN_PHASES = [
  {
    name: 'Fase de Robo',
    description: 'Al inicio de tu turno, robas una carta de tu mazo.',
    note: 'El jugador que va primero no roba en su primer turno.',
  },
  {
    name: 'Fase de Oro',
    description: 'Puedes bajar una carta de Oro de tu mano a tu Zona de Oro (boca abajo).',
    note: 'Solo una carta de Oro por turno.',
  },
  {
    name: 'Fase Principal',
    description:
      'Puedes jugar Aliados, Armas, Talismanes y Tótems pagando su coste. También puedes activar habilidades y equipar armas.',
    note: 'No hay límite de cartas a jugar si tienes oro disponible.',
  },
  {
    name: 'Fase de Ataque',
    description:
      'Declara atacantes girando tus Aliados. El defensor puede bloquear con sus Aliados sin girar.',
    note: 'Los Aliados con enfermedad de invocación (recién jugados) no pueden atacar.',
  },
  {
    name: 'Fase Final',
    description: 'Se resuelven efectos de fin de turno. Si tienes más de 7 cartas en mano, descarta hasta tener 7.',
    note: null,
  },
];

const ZONES = [
  { name: 'Mazo', description: 'Tu mazo de 50 cartas. Robas de aquí cada turno.' },
  { name: 'Mano', description: 'Cartas que tienes disponibles para jugar. Máximo 7 al final del turno.' },
  { name: 'Zona de Oro', description: 'Cartas de Oro boca abajo que producen recursos para pagar costes.' },
  { name: 'Arena', description: 'Zona donde se colocan Aliados, Armas, Talismanes y Tótems en juego.' },
  { name: 'Cementerio', description: 'Pila de descarte. Cartas destruidas o usadas van aquí.' },
  { name: 'Exilio', description: 'Zona removida del juego. Las cartas exiliadas no pueden recuperarse normalmente.' },
];

const CARD_TYPES = [
  {
    name: 'Oro',
    icon: Coins,
    description:
      'Recurso fundamental del juego. Se colocan boca abajo en la Zona de Oro para producir puntos de recurso y pagar el coste de otras cartas.',
  },
  {
    name: 'Aliado',
    icon: Swords,
    description:
      'Criaturas que luchan por ti. Tienen Fuerza (ataque y vida). Pueden atacar y bloquear. Muchos tienen habilidades especiales.',
  },
  {
    name: 'Arma',
    icon: Shield,
    description:
      'Se equipa a un Aliado para aumentar su Fuerza. Un Aliado solo puede tener una Arma equipada a la vez.',
  },
  {
    name: 'Talismán',
    icon: Layers,
    description:
      'Cartas de efecto inmediato. Se juegan, resuelven su efecto y van al Cementerio.',
  },
  {
    name: 'Tótem',
    icon: Layers,
    description:
      'Permanentes que otorgan efectos continuos. Permanecen en juego hasta ser destruidos.',
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/resources" className="text-muted-foreground hover:text-foreground">
          Recursos
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-blue-600" />
          <h1 className="font-display text-2xl font-bold">Reglas del Juego</h1>
        </div>
      </div>

      <p className="text-muted-foreground">
        Guía de referencia rápida de las reglas oficiales de Mitos y Leyendas.
        Para el reglamento completo, consulta el documento oficial de MYL.
      </p>

      <Separator />

      {/* Objetivo del juego */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Objetivo del Juego</h2>
        <div className="rounded-lg border bg-card p-5">
          <p className="text-sm leading-relaxed">
            El objetivo de MYL es reducir los puntos de vida de tu oponente a <strong>0</strong>.
            Cada jugador comienza con un mazo de <strong>50 cartas</strong> y roba <strong>8 cartas</strong> al inicio.
            Tu mazo es tu vida: cuando un Aliado ataca directamente y no es bloqueado, el defensor descarta
            cartas de su mazo igual a la Fuerza del atacante. Si un jugador no puede robar carta al inicio de
            su turno, pierde la partida.
          </p>
        </div>
      </section>

      {/* Tipos de carta */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Tipos de Carta</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CARD_TYPES.map((ct) => {
            const Icon = ct.icon;
            return (
              <div key={ct.name} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">{ct.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ct.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Fases del turno */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Fases del Turno</h2>
        <div className="space-y-3">
          {TURN_PHASES.map((phase, i) => (
            <div key={phase.name} className="flex gap-4 rounded-lg border bg-card p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                {i + 1}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">{phase.name}</h3>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
                {phase.note && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Nota: {phase.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Zonas de juego */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Zonas de Juego</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ZONES.map((zone) => (
            <div key={zone.name} className="rounded-lg border bg-card p-4 space-y-1">
              <h3 className="font-semibold text-sm">{zone.name}</h3>
              <p className="text-xs text-muted-foreground">{zone.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Conceptos clave */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Conceptos Clave</h2>
        <div className="space-y-2">
          {[
            { term: 'Enfermedad de invocación', def: 'Un Aliado recién jugado no puede atacar ni usar habilidades activadas hasta tu próximo turno.' },
            { term: 'Girar', def: 'Rotar una carta 90° para indicar que ha sido usada (atacar, pagar coste, activar habilidad).' },
            { term: 'Carta Única', def: 'Solo puedes tener 1 copia en tu mazo. Se indica con un símbolo especial.' },
            { term: 'Oro inicial', def: 'La primera carta de Oro que colocas al inicio de la partida antes de robar.' },
            { term: 'Bloquear', def: 'Asignar un Aliado sin girar para recibir el ataque de un Aliado enemigo. El daño es simultáneo.' },
          ].map((item) => (
            <div key={item.term} className="flex gap-3 rounded-lg border bg-card p-3">
              <Badge variant="outline" className="shrink-0 h-fit">
                {item.term}
              </Badge>
              <p className="text-sm text-muted-foreground">{item.def}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Link to glossary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <Link href="/resources/glossary" className="flex items-center gap-2 text-sm font-medium text-accent hover:underline">
          Ver Glosario completo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
