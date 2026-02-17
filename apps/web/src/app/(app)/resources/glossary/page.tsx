/**
 * /resources/glossary — Glosario oficial de términos de MYL.
 * Términos, tipos de habilidad, zonas de juego y conceptos clave.
 *
 * Changelog:
 *   2026-02-16 — Initial creation
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { BookA, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Glosario | MYL',
  description: 'Glosario oficial de términos del juego Mitos y Leyendas',
};

interface GlossaryEntry {
  term: string;
  category: 'mecanica' | 'zona' | 'tipo' | 'habilidad' | 'estado' | 'general';
  definition: string;
}

const CATEGORY_CONFIG = {
  mecanica: { label: 'Mecánica', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  zona: { label: 'Zona', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  tipo: { label: 'Tipo', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  habilidad: { label: 'Habilidad', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  estado: { label: 'Estado', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  general: { label: 'General', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300' },
} as const;

const GLOSSARY: GlossaryEntry[] = [
  // Tipos de carta
  { term: 'Aliado', category: 'tipo', definition: 'Carta de criatura que puede atacar y bloquear. Tiene un valor de Fuerza que representa tanto su poder de ataque como sus puntos de vida.' },
  { term: 'Arma', category: 'tipo', definition: 'Carta que se equipa a un Aliado para aumentar su Fuerza. Un Aliado solo puede tener una Arma equipada.' },
  { term: 'Oro', category: 'tipo', definition: 'Carta de recurso que se coloca boca abajo en la Zona de Oro. Se gira para pagar costes de otras cartas.' },
  { term: 'Talismán', category: 'tipo', definition: 'Carta de efecto inmediato que se resuelve y va al Cementerio.' },
  { term: 'Tótem', category: 'tipo', definition: 'Carta permanente que otorga efectos continuos mientras permanezca en juego.' },

  // Zonas
  { term: 'Arena', category: 'zona', definition: 'Zona donde se colocan los Aliados, Armas, Talismanes y Tótems en juego.' },
  { term: 'Cementerio', category: 'zona', definition: 'Pila de descarte. Las cartas destruidas, descartadas o usadas van aquí.' },
  { term: 'Exilio', category: 'zona', definition: 'Zona removida del juego. Las cartas exiliadas no pueden ser recuperadas por medios normales.' },
  { term: 'Mazo', category: 'zona', definition: 'Pila de cartas de donde robas al inicio de cada turno. Funciona como tus puntos de vida.' },
  { term: 'Mano', category: 'zona', definition: 'Cartas disponibles para jugar. Máximo 7 al final del turno.' },
  { term: 'Zona de Oro', category: 'zona', definition: 'Lugar donde se colocan boca abajo las cartas de Oro que producen recursos.' },

  // Habilidades
  { term: 'Habilidad Activada', category: 'habilidad', definition: 'Habilidad que requiere un coste para activarse (girar, pagar oro, descartar). Se activa cuando el jugador decide usarla.' },
  { term: 'Habilidad Pasiva', category: 'habilidad', definition: 'Habilidad que está siempre activa mientras la carta esté en juego. No requiere activación.' },
  { term: 'Habilidad Especial', category: 'habilidad', definition: 'Habilidad con condiciones o restricciones únicas que no encajan en las categorías estándar.' },
  { term: 'Habilidad Continua', category: 'habilidad', definition: 'Efecto permanente que modifica el estado del juego mientras la fuente esté en juego.' },
  { term: 'Habilidad Disparada', category: 'habilidad', definition: 'Habilidad que se activa automáticamente cuando ocurre un evento específico (al entrar en juego, al ser destruido, etc.).' },

  // Mecánicas
  { term: 'Atacar', category: 'mecanica', definition: 'Girar un Aliado para infligir daño al oponente o a un Aliado bloqueador. Solo durante la Fase de Ataque.' },
  { term: 'Bloquear', category: 'mecanica', definition: 'Asignar un Aliado sin girar para interceptar un ataque enemigo. El daño es simultáneo entre atacante y bloqueador.' },
  { term: 'Carta Única', category: 'mecanica', definition: 'Restricción que permite solo 1 copia de esta carta en el mazo. Se identifica con un símbolo especial.' },
  { term: 'Coste', category: 'mecanica', definition: 'Cantidad de Oro que se debe girar para jugar una carta. Aparece en la esquina superior de la carta.' },
  { term: 'Enfermedad de Invocación', category: 'mecanica', definition: 'Un Aliado recién jugado no puede atacar ni usar habilidades activadas hasta el próximo turno del controlador.' },
  { term: 'Equipar', category: 'mecanica', definition: 'Asociar un Arma a un Aliado. El Aliado obtiene la Fuerza del Arma sumada a la suya.' },
  { term: 'Fuerza', category: 'mecanica', definition: 'Valor numérico de un Aliado. Representa tanto su capacidad de ataque como su resistencia al daño.' },
  { term: 'Girar', category: 'mecanica', definition: 'Rotar una carta 90° para indicar que ha sido usada en este turno.' },
  { term: 'Oro Inicial', category: 'mecanica', definition: 'La primera carta de Oro que se coloca antes del inicio de la partida. Debe ser un Oro sin habilidad.' },
  { term: 'Robar', category: 'mecanica', definition: 'Tomar la carta superior de tu mazo y agregarla a tu mano.' },

  // Estados
  { term: 'Girado', category: 'estado', definition: 'Estado de una carta que ha sido usada (rotada 90°). No puede atacar, bloquear ni activar habilidades que requieran girar.' },
  { term: 'Derecho', category: 'estado', definition: 'Estado normal de una carta (sin girar). Puede actuar normalmente.' },
  { term: 'Legal', category: 'estado', definition: 'Estado de una carta que puede usarse sin restricciones en un formato.' },
  { term: 'Prohibida', category: 'estado', definition: 'Carta que no puede incluirse en ningún mazo del formato (0 copias permitidas).' },
  { term: 'Restringida', category: 'estado', definition: 'Carta con límite de copias menor al estándar (por ejemplo, limitada a 1 o 2 copias).' },

  // General
  { term: 'Bloque', category: 'general', definition: 'Grupo temático de ediciones que comparten ambientación y mecánicas. Las ediciones de un mismo bloque suelen tener sinergia entre sí.' },
  { term: 'Edición', category: 'general', definition: 'Conjunto de cartas publicadas juntas. Cada edición pertenece a un Bloque y tiene cartas con mecánicas propias.' },
  { term: 'Formato', category: 'general', definition: 'Conjunto de reglas que define qué cartas y ediciones se pueden usar en un mazo. Ej: Libre, Racial Edición, etc.' },
  { term: 'Raza', category: 'general', definition: 'Clasificación temática de los Aliados (Griegos, Egipcios, etc.). En formato Racial, el mazo se construye con una sola raza.' },
  { term: 'Rareza', category: 'general', definition: 'Indicador de la frecuencia de aparición de una carta en sobres. Común, Poco Común, Rara, Mítica, Ultrarara.' },
];

export default function GlossaryPage() {
  // Group by first letter
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
      {/* Header */}
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
        Referencia rápida de todos los términos, mecánicas y conceptos del juego Mitos y Leyendas.
      </p>

      {/* Category legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Badge key={key} className={config.className}>
            {config.label}
          </Badge>
        ))}
      </div>

      <Separator />

      {/* Letter index */}
      <nav className="flex flex-wrap gap-1">
        {Array.from(grouped.keys()).map((letter) => (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            {letter}
          </a>
        ))}
      </nav>

      {/* Glossary entries */}
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([letter, entries]) => (
          <section key={letter} id={`letter-${letter}`}>
            <h2 className="mb-3 font-display text-2xl font-bold text-accent">{letter}</h2>
            <div className="space-y-2">
              {entries.map((entry) => {
                const catConfig = CATEGORY_CONFIG[entry.category];
                return (
                  <div
                    key={entry.term}
                    className="flex gap-3 rounded-lg border bg-card p-3"
                  >
                    <div className="flex flex-col items-start gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{entry.term}</span>
                        <Badge className={`${catConfig.className} text-[10px] px-1.5 py-0`}>
                          {catConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {entry.definition}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">
          Este glosario se actualiza periódicamente con nuevos términos y mecánicas introducidas en
          cada nueva edición del juego. Para consultas específicas sobre interacciones de cartas,
          consulta la sección de <Link href="/resources/oracles" className="text-accent hover:underline">Oráculos</Link>.
        </p>
      </div>
    </div>
  );
}
