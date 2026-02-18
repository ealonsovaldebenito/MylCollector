/**
 * /resources/glossary - Glosario oficial de terminos de MYL.
 * Terminos, tipos de carta, zonas de juego y mecanicas base.
 *
 * Changelog:
 *   2026-02-16 - Initial creation
 *   2026-02-18 - Contenido corregido con reglas reales de Mitos y Leyendas.
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { BookA } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Glosario | MYL',
  description: 'Glosario oficial de terminos del juego Mitos y Leyendas',
};

interface GlossaryEntry {
  term: string;
  category: 'mecanica' | 'zona' | 'tipo' | 'habilidad' | 'estado' | 'general';
  definition: string;
}

const CATEGORY_CONFIG = {
  mecanica: {
    label: 'Mecanica',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  zona: {
    label: 'Zona',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  tipo: {
    label: 'Tipo',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  habilidad: {
    label: 'Habilidad',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  estado: {
    label: 'Estado',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  general: {
    label: 'General',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300',
  },
} as const;

const GLOSSARY: GlossaryEntry[] = [
  // Tipos de carta
  {
    term: 'Aliado',
    category: 'tipo',
    definition:
      'Carta principal de combate. Puede atacar Castillo y bloquear. Tiene Fuerza, Raza y habilidad.',
  },
  {
    term: 'Arma',
    category: 'tipo',
    definition:
      'Carta que se anexa a un Aliado para darle bonos o habilidades. Si el portador sale del juego, el Arma se destruye.',
  },
  {
    term: 'Oro',
    category: 'tipo',
    definition:
      'Recurso para pagar costes. Se juega en Reserva de Oro y al pagar pasa a Oro Pagado.',
  },
  {
    term: 'Talisman',
    category: 'tipo',
    definition: 'Carta de efecto inmediato. Al resolverse se envia al Cementerio.',
  },
  {
    term: 'Totem',
    category: 'tipo',
    definition:
      'Carta permanente que modifica el juego mientras permanezca en Linea de Apoyo.',
  },

  // Zonas
  {
    term: 'Castillo',
    category: 'zona',
    definition:
      'Mazo de 50 cartas que representa tus defensas. Si se queda sin cartas, pierdes la partida.',
  },
  {
    term: 'Cementerio',
    category: 'zona',
    definition: 'Zona donde van cartas destruidas, descartadas o botadas desde Castillo.',
  },
  {
    term: 'Destierro',
    category: 'zona',
    definition: 'Zona fuera de juego. Normalmente no se recuperan cartas desde aqui.',
  },
  {
    term: 'Linea de Apoyo',
    category: 'zona',
    definition: 'Zona donde entran y permanecen los Totem.',
  },
  {
    term: 'Linea de Ataque',
    category: 'zona',
    definition:
      'Zona a la que se mueven tus Aliados al atacar. Mientras estan aqui, no pueden bloquear.',
  },
  {
    term: 'Linea de Defensa',
    category: 'zona',
    definition: 'Zona base de tus Aliados. Desde aqui se declaran bloqueadores.',
  },
  {
    term: 'Mano',
    category: 'zona',
    definition: 'Cartas disponibles para jugar. El maximo al finalizar turno es 8.',
  },
  {
    term: 'Oro Pagado',
    category: 'zona',
    definition: 'Zona temporal donde quedan los Oros usados para pagar costes.',
  },
  {
    term: 'Reserva de Oro',
    category: 'zona',
    definition: 'Zona de Oros disponibles para pagar cartas y habilidades.',
  },

  // Habilidades
  {
    term: 'Habilidad',
    category: 'habilidad',
    definition:
      'Texto de efecto de la carta. Puede requerir condiciones, objetivos o pago de costes.',
  },
  {
    term: 'Habilidad Avanzada',
    category: 'habilidad',
    definition:
      'Texto complementario para juego mas experto, adicional a la habilidad inicial.',
  },
  {
    term: 'Habilidad Inicial',
    category: 'habilidad',
    definition: 'Texto simplificado para facilitar aprendizaje en partidas introductorias.',
  },
  {
    term: 'Imbloqueable',
    category: 'habilidad',
    definition: 'Ese Aliado no puede ser bloqueado.',
  },
  {
    term: 'Indesterrable',
    category: 'habilidad',
    definition: 'Esa carta no puede ser desterrada mientras este en juego.',
  },
  {
    term: 'Indestructible',
    category: 'habilidad',
    definition: 'Esa carta no puede ser destruida mientras este en juego.',
  },

  // Mecanicas
  {
    term: 'Agrupar',
    category: 'mecanica',
    definition:
      'Mover Oros de Oro Pagado a Reserva de Oro y Aliados de Ataque a Defensa al inicio del turno.',
  },
  {
    term: 'Asignacion de Dano',
    category: 'mecanica',
    definition:
      'Paso final de la Batalla Mitologica donde se compara Fuerza y se determina destruccion y dano al Castillo.',
  },
  {
    term: 'Atacar',
    category: 'mecanica',
    definition:
      'Mover uno o mas Aliados de Linea de Defensa a Linea de Ataque para iniciar Batalla Mitologica.',
  },
  {
    term: 'Batalla Mitologica',
    category: 'mecanica',
    definition:
      'Secuencia de combate: declarar atacantes, declarar bloqueadores, guerra de talismanes y asignacion de dano.',
  },
  {
    term: 'Bloquear',
    category: 'mecanica',
    definition:
      'Asignar un Aliado en Linea de Defensa a un atacante no bloqueado para intentar detener dano.',
  },
  {
    term: 'Botar',
    category: 'mecanica',
    definition:
      'Enviar cartas desde el tope del Castillo al Cementerio. Cada punto de dano al Castillo bota 1 carta.',
  },
  {
    term: 'Carta Unica',
    category: 'mecanica',
    definition: 'Carta con limite de 1 copia en mazo, segun reglamento o formato.',
  },
  {
    term: 'Coste',
    category: 'mecanica',
    definition: 'Cantidad de Oros que debes pagar para jugar una carta o activar una habilidad.',
  },
  {
    term: 'Declarar Atacantes',
    category: 'mecanica',
    definition: 'Subpaso donde eliges que Aliados atacan.',
  },
  {
    term: 'Declarar Bloqueadores',
    category: 'mecanica',
    definition: 'Subpaso donde el defensor asigna bloqueos a atacantes.',
  },
  {
    term: 'Descartar',
    category: 'mecanica',
    definition: 'Enviar una carta desde la mano al Cementerio.',
  },
  {
    term: 'Desterrar',
    category: 'mecanica',
    definition: 'Enviar una carta desde cualquier zona al Destierro.',
  },
  {
    term: 'Destruir',
    category: 'mecanica',
    definition: 'Sacar una carta del juego y enviarla al Cementerio.',
  },
  {
    term: 'Guerra de Talismanes',
    category: 'mecanica',
    definition:
      'Subpaso de combate donde ambos jugadores juegan talismanes o habilidades de forma alternada, iniciando el defensor.',
  },
  {
    term: 'Oro Inicial',
    category: 'mecanica',
    definition: 'Oro con el que empiezas la partida en Reserva de Oro, antes de robar mano.',
  },
  {
    term: 'Robar',
    category: 'mecanica',
    definition: 'Tomar la carta superior del Castillo y ponerla en la mano.',
  },

  // Estados
  {
    term: 'Legal',
    category: 'estado',
    definition: 'Carta permitida sin restricciones extra en el formato consultado.',
  },
  {
    term: 'Prohibida',
    category: 'estado',
    definition: 'Carta no permitida en el formato (0 copias).',
  },
  {
    term: 'Restringida',
    category: 'estado',
    definition: 'Carta con limite inferior al estandar de copias (ejemplo: 1 o 2).',
  },

  // General
  {
    term: 'Bloque',
    category: 'general',
    definition: 'Conjunto de ediciones relacionadas por ambientacion y mecanicas.',
  },
  {
    term: 'Edicion',
    category: 'general',
    definition: 'Set de cartas publicado en una fecha especifica.',
  },
  {
    term: 'Formato',
    category: 'general',
    definition:
      'Reglas de construccion y juego que determinan cartas permitidas, limites y banlist.',
  },
  {
    term: 'Frecuencia',
    category: 'general',
    definition:
      'Nivel de aparicion de una carta (ej: Vasalla, Cortesana, Real), asociado a su distribucion en producto.',
  },
  {
    term: 'Fuerza',
    category: 'general',
    definition: 'Valor de dano que un Aliado asigna en combate o al Castillo.',
  },
  {
    term: 'Raza',
    category: 'general',
    definition:
      'Atributo propio de Aliados que interactua con habilidades y restricciones de formato.',
  },
];

export default function GlossaryPage() {
  const grouped = new Map<string, GlossaryEntry[]>();
  for (const entry of GLOSSARY.sort((a, b) => a.term.localeCompare(b.term, 'es'))) {
    const letter = entry.term[0]!.toUpperCase();
    const existing = grouped.get(letter);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(letter, [entry]);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/resources" className="text-muted-foreground hover:text-foreground">
          Recursos
        </Link>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <BookA className="h-5 w-5 text-emerald-600" />
          <h1 className="font-display text-2xl font-bold">Glosario</h1>
        </div>
      </div>

      <p className="text-muted-foreground">
        Referencia rapida de terminos y mecanicas del juego Mitos y Leyendas.
      </p>

      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Badge key={key} className={config.className}>
            {config.label}
          </Badge>
        ))}
      </div>

      <Separator />

      <nav className="flex flex-wrap gap-1">
        {Array.from(grouped.keys()).map((letter) => (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-accent/20"
          >
            {letter}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([letter, entries]) => (
          <section key={letter} id={`letter-${letter}`}>
            <h2 className="mb-3 font-display text-2xl font-bold text-accent">{letter}</h2>
            <div className="space-y-2">
              {entries.map((entry) => {
                const catConfig = CATEGORY_CONFIG[entry.category];
                return (
                  <div key={entry.term} className="flex gap-3 rounded-lg border bg-card p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{entry.term}</span>
                        <Badge className={`${catConfig.className} px-1.5 py-0 text-[10px]`}>
                          {catConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{entry.definition}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          Este glosario se alinea con reglas base. Para interacciones especificas de cartas, revisa{' '}
          <Link href="/resources/oracles" className="text-accent hover:underline">
            Oraculos
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
