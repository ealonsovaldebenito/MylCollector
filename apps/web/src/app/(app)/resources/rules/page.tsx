/**
 * /resources/rules - Reglas oficiales de MYL.
 * Guia publica de reglas base (Castillo de 50 cartas, turnos, combate y zonas).
 *
 * Changelog:
 *   2026-02-16 - Initial creation
 *   2026-02-18 - Contenido corregido segun reglas reales de Mitos y Leyendas.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Coins,
  Landmark,
  Layers,
  Scale,
  Shield,
  Swords,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Reglas | MYL',
  description: 'Reglas oficiales del juego Mitos y Leyendas',
};

const CARD_TYPES = [
  {
    name: 'Aliado',
    icon: Swords,
    description:
      'Son las cartas que atacan y bloquean. Tienen Fuerza, Raza y habilidades. Permanecen en juego hasta salir por combate o efecto.',
  },
  {
    name: 'Talisman',
    icon: Layers,
    description:
      'Hechizos o eventos de efecto inmediato. Tras resolver, van al Cementerio.',
  },
  {
    name: 'Arma',
    icon: Shield,
    description:
      'Se anexan a un Aliado y le dan bonos o habilidades. Si el portador sale del juego, el arma se destruye.',
  },
  {
    name: 'Totem',
    icon: Landmark,
    description:
      'Altares, monumentos o locaciones con efectos continuos. Permanecen en la Linea de Apoyo.',
  },
  {
    name: 'Oro',
    icon: Coins,
    description:
      'Recurso para pagar costes. Los Oros usados pasan a Oro Pagado y se recuperan al agrupar.',
  },
];

const GAME_ZONES = [
  {
    name: 'Castillo (Mazo)',
    description:
      'Baraja de 50 cartas. Cuando recibes dano, botas cartas desde aqui al Cementerio. Si se queda sin cartas, pierdes.',
  },
  {
    name: 'Mano',
    description:
      'Inicias con 8 cartas. Al final de tu turno, si tienes mas de 8, descartas hasta quedar en 8.',
  },
  {
    name: 'Cementerio',
    description:
      'Van cartas destruidas, descartadas o botadas desde el Castillo.',
  },
  {
    name: 'Destierro',
    description:
      'Zona fuera de juego. Normalmente las cartas desterradas no se recuperan.',
  },
  {
    name: 'Linea de Defensa',
    description:
      'Aqui entran los Aliados. Desde esta linea pueden bloquear.',
  },
  {
    name: 'Linea de Ataque',
    description:
      'Cuando un Aliado ataca se mueve aqui. Mientras esta aqui, no puede bloquear.',
  },
  {
    name: 'Linea de Apoyo',
    description:
      'Zona de juego de los Totem.',
  },
  {
    name: 'Reserva de Oro',
    description:
      'Oros disponibles para pagar costes.',
  },
  {
    name: 'Oro Pagado',
    description:
      'Zona temporal de los Oros usados para pagar costes.',
  },
];

const TURN_PHASES = [
  {
    name: '1) Fase de Agrupacion',
    description:
      'Mueve todos los Oros de Oro Pagado a tu Reserva de Oro y todos los Aliados de Linea de Ataque a Linea de Defensa.',
  },
  {
    name: '2) Fase de Vigilia',
    description:
      'Al inicio puedes poner 1 Oro desde tu mano a la Reserva de Oro. Luego puedes jugar cartas y habilidades pagando sus costes.',
  },
  {
    name: '3) Batalla Mitologica',
    description:
      'Declaras atacantes, el defensor declara bloqueadores, se juega Guerra de Talismanes y luego se asigna dano.',
  },
  {
    name: '4) Fase Final',
    description:
      'Se resuelven efectos de termino de turno.',
  },
  {
    name: '5) Fase de Robar',
    description:
      'Robas 1 carta. Si superas 8 cartas en mano, descartas hasta quedar en 8.',
  },
];

const BATTLE_STEPS = [
  {
    name: 'A. Declarar Atacantes',
    description:
      'El jugador activo mueve los Aliados que atacaran desde Defensa a Ataque. Los Aliados que entraron este turno no pueden atacar.',
  },
  {
    name: 'B. Declarar Bloqueadores',
    description:
      'El defensor asigna Aliados de su Linea de Defensa para bloquear atacantes no bloqueados.',
  },
  {
    name: 'C. Guerra de Talismanes',
    description:
      'Empieza el defensor y luego alternan jugando Talismanes o habilidades.',
  },
  {
    name: 'D. Asignacion de Dano',
    description:
      'Se compara Fuerza entre atacante y bloqueador. Si sobra dano del atacante, ese excedente se bota del Castillo defensor.',
  },
];

const BATTLE_RESULTS = [
  'Si el bloqueador tiene mas Fuerza que el atacante, se destruye el atacante.',
  'Si tienen la misma Fuerza, ambos se destruyen.',
  'Si el atacante tiene mas Fuerza, se destruye el bloqueador y la diferencia dania el Castillo.',
  'Si un atacante no es bloqueado, toda su Fuerza dania el Castillo defensor.',
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/resources" className="text-muted-foreground hover:text-foreground">
          Recursos
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-accent" />
          <h1 className="font-display text-2xl font-bold">Reglas de Juego</h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Esta guia resume las reglas base de Mitos y Leyendas segun manual iniciatico y
        reglamento oficial: objetivo, tipos de carta, zonas, fases y combate.
      </p>

      <Separator />

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Objetivo del Juego</h2>
        <div className="rounded-lg border bg-card p-5 text-sm leading-relaxed">
          Derribar las defensas del <strong>Castillo</strong> oponente. Tu Castillo es tu mazo de
          <strong> 50 cartas</strong>: cuando recibes dano botas cartas desde el tope al Cementerio.
          Si tu Castillo se queda sin cartas, pierdes la partida.
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Preparacion de la Partida</h2>
        <div className="rounded-lg border bg-card p-5">
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
            <li>Definan al azar quien empieza.</li>
            <li>
              Pon un <strong>Oro inicial</strong> (normalmente sin habilidad) en tu Reserva de Oro.
            </li>
            <li>Baraja tu Castillo y roba 8 cartas.</li>
            <li>
              Mulligan opcional: puedes cambiar tu mano, pero cada nuevo mulligan roba 1 carta menos.
            </li>
            <li>Cuando ambos confirman mano, inicia la partida.</li>
          </ol>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Tipos de Carta</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CARD_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.name} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold">{type.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Zonas del Juego</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_ZONES.map((zone) => (
            <div key={zone.name} className="rounded-lg border bg-card p-4 space-y-1">
              <h3 className="font-semibold text-sm">{zone.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{zone.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Fases del Turno</h2>
        <div className="space-y-3">
          {TURN_PHASES.map((phase) => (
            <div key={phase.name} className="rounded-lg border bg-card p-4 space-y-1">
              <h3 className="font-semibold">{phase.name}</h3>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Batalla Mitologica</h2>
        <div className="space-y-3">
          {BATTLE_STEPS.map((step) => (
            <div key={step.name} className="rounded-lg border bg-card p-4 space-y-1">
              <h3 className="font-semibold">{step.name}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-2">Resolucion rapida de combate</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {BATTLE_RESULTS.map((line) => (
              <li key={line}>- {line}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Conceptos Clave</h2>
        <div className="space-y-2">
          {[
            {
              term: 'Fuerza',
              def: 'Cantidad de dano que inflige un Aliado en combate y al Castillo.',
            },
            {
              term: 'Raza',
              def: 'Atributo exclusivo de Aliados. Muchas habilidades interactuan con la Raza.',
            },
            {
              term: 'Botar cartas',
              def: 'Por cada punto de dano al Castillo, se envia 1 carta del tope al Cementerio.',
            },
            {
              term: 'Oro por turno',
              def: 'Solo puedes poner 1 Oro al inicio de tu Fase de Vigilia.',
            },
          ].map((item) => (
            <div key={item.term} className="flex gap-3 rounded-lg border bg-card p-3">
              <Badge variant="outline" className="h-fit shrink-0">
                {item.term}
              </Badge>
              <p className="text-sm text-muted-foreground">{item.def}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-lg border bg-muted/30 p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Para terminos avanzados, formatos y palabras clave, revisa el glosario.
        </p>
        <Link
          href="/resources/glossary"
          className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
        >
          Ver glosario
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
