/**
 * import-oracles.ts — Importa oráculos del Lootbox Primer Bloque 2025.
 *
 * Inserta rulings en card_oracles buscando cada carta por nombre.
 *
 * Uso:
 *   pnpm --filter @myl/web tsx scripts/import-oracles.ts
 *
 * Requiere:
 *   - apps/web/.env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *
 * Changelog:
 *   2026-02-16 — Creación inicial — 24 cartas del Oráculo Lootbox PB 2025
 */

import { resolve } from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';

// ---------------------------------------------------------------------------
// 1. Cargar variables de entorno
// ---------------------------------------------------------------------------
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno requeridas');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'Falta');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'OK' : 'Falta');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Datos del oráculo
// ---------------------------------------------------------------------------

type AbilityType = 'ACTIVADA' | 'PASIVA' | 'ESPECIAL' | 'CONTINUA' | 'DISPARADA';

interface OracleRuling {
  ability_type: AbilityType | null;
  ruling: string;
}

interface OracleEntry {
  card_name: string;
  alt_names?: string[];
  rulings: OracleRuling[];
}

const SOURCE_DOCUMENT = 'Oráculo Lootbox Primer Bloque 2025';

const ORACLE_DATA: OracleEntry[] = [
  {
    card_name: 'Melchor',
    rulings: [
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'cuando entra en juego' de este Aliado, es una habilidad disparada opcional que te permite buscar una carta del tipo arma en tu mazo Castillo y ponerla en tu Cementerio. Luego de buscar el arma en tu mazo Castillo y enviarla a tu Cementerio, puedes robar 1 carta de tu mazo Castillo. Si no realizas la primera parte de la habilidad, no puedes robar 1 carta por la habilidad de esta carta.",
      },
    ],
  },
  {
    card_name: 'Gaspar',
    rulings: [
      {
        ability_type: 'ACTIVADA',
        ruling:
          "Su habilidad de 'en tu fase de vigilia, una vez por turno' es una habilidad activada, que te permite elegir entre barajar una carta de cualquier tipo de tu Cementerio en tu mazo Castillo o barajar 2 cartas del tipo aliado y de raza dragón de tu Cementerio en tu mazo Castillo. Para poder activar esta habilidad, deberás cumplir con los requisitos, por lo tanto, deberás tener al menos una carta en tu cementerio.",
      },
    ],
  },
  {
    card_name: 'Baltasar',
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          "Su habilidad de 'solo puedes tener un Baltasar en juego' es una habilidad continua, que te condiciona a solo poder tener una copia de esta carta en juego.",
      },
      {
        ability_type: 'CONTINUA',
        ruling:
          'Su habilidad IMBLOQUEABLE es una habilidad Continua que no permite que este aliado sea bloqueado por Aliados oponentes (solo puede ser bloqueado por aliados que puedan bloquear aliados imbloqueables).',
      },
      {
        ability_type: 'ACTIVADA',
        ruling:
          "La habilidad 'una vez por turno' es una habilidad activada opcional, que te pide como requisito desterrar un aliado de raza faerie que controles para cancelar la habilidad activada o disparada de una carta oponente en juego que no sea oro. Esta habilidad puedes utilizarla en cualquier momento del juego, siempre y cuando tu oponente active o dispare la habilidad de una carta del tipo aliado, arma o tótem.",
      },
    ],
  },
  {
    card_name: 'Estrella de Belén',
    alt_names: ['Estrella de Belen'],
    rulings: [
      {
        ability_type: 'DISPARADA',
        ruling:
          "Su Habilidad de 'cuando entra en juego', es una habilidad disparada opcional que te permite mostrar a tu oponente las primeras 3 cartas de tu mazo castillo. Si entre las cartas mostradas hay una carta de tipo oro, puedes ponerla en tu mano. Luego, debes barajar todas las demás cartas en tu mazo castillo. Si entre las cartas mostradas no hay cartas del tipo oro, deberás barajar todas las cartas en tu mazo castillo.",
      },
    ],
  },
  {
    card_name: 'Epicuro de Samos',
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          "Su habilidad de 'sólo puedes tener un Epicuro de Samos en juego' es una habilidad continua, que te condiciona a solo poder tener una copia de esta carta en juego.",
      },
      {
        ability_type: 'ACTIVADA',
        ruling:
          "La habilidad de 'En tu Fase de Vigilia, una vez por turno' de este aliado es una habilidad activada que tiene como requisito subir a la mano de su dueño una carta de tipo aliado que controles para que tu oponente bote 3 cartas. No puedes seleccionar a este aliado por la regla de autorreferencia. Si una carta de aliado que controles no puede salir del juego o no puede ser subida a la mano de su dueño, no puedes seleccionar a dicho aliado por esta habilidad.",
      },
    ],
  },
  {
    card_name: 'Comus',
    rulings: [
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'Cuando entra en juego' de este aliado es una habilidad disparada opcional, que te permite elegir una carta de tipo aliado o tótem de tu cementerio que tenga un coste de 3 o menos, para ponerla en la parte superior de tu mazo castillo.",
      },
    ],
  },
  {
    card_name: 'Dione',
    rulings: [
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'Cuando entra en juego' de este aliado es una habilidad disparada opcional, que tiene como requisito desterrar una carta de tu cementerio para robar 1 carta de tu mazo castillo. Si no tienes cartas en tu cementerio, no puedes disparar la habilidad de este aliado.",
      },
    ],
  },
  {
    card_name: 'Vino de la Eternidad',
    rulings: [
      {
        ability_type: 'ACTIVADA',
        ruling:
          "Su habilidad de 'en tu fase de vigilia, una vez por turno' es una habilidad activada que tiene como requisito desterrar este oro de tu reserva de oros y pagar 2 oros para elegir un talismán de coste 3 o menos de tu cementerio y ponerlo en tu mano. Si no tienes una carta del tipo talismán y de coste 3 o menos en tu cementerio, no puedes activar la habilidad de esta carta.",
      },
    ],
  },
  {
    card_name: 'San Patricio',
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling: "Su habilidad de 'puede atacar cuando entra en juego' es una habilidad continua.",
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'cuando este aliado sea movido de tu línea de defensa a tu línea de ataque' es una habilidad disparada opcional, que requiere que sea movido por un efecto o una habilidad de una carta que controles. Si esto ocurre, puedes destruir una carta de tipo aliado de tu oponente de fuerza 3 o menos. Esta habilidad puede ser disparada más de una vez por turno.",
      },
    ],
  },
  {
    card_name: 'Gancanagh',
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          'Su habilidad IMBLOQUEABLE es una habilidad Continua que no permite que este aliado sea bloqueado por Aliados oponentes.',
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'cuando entra en juego' es una habilidad disparada opcional que permite buscar una copia de este Aliado en tu mazo castillo y ponerlo en tu Mano. Luego de buscar la carta, debes barajar tu Mazo Castillo.",
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'cuando sea descartado de tu mano' es una habilidad disparada opcional que permite buscar una copia de este Aliado en tu mazo castillo y ponerlo en tu Mano. Esta habilidad sólo se cumple si la carta es descartada por el efecto de una carta y no se ve afectada por el descarte por exceso de cartas.",
      },
    ],
  },
  {
    card_name: 'Oillipheist',
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          'Su habilidad IMBLOQUEABLE es una habilidad Continua que no permite que este aliado sea bloqueado por Aliados oponentes.',
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'cuando entra en juego' es una habilidad disparada obligatoria que te permite mirar las 3 primeras cartas del mazo castillo oponente. De entre esas cartas, deberás elegir una y desterrarla. Luego, tu oponente debe barajar su mazo castillo.",
      },
    ],
  },
  {
    card_name: 'Cerveza Verde',
    rulings: [
      {
        ability_type: 'ACTIVADA',
        ruling:
          "Su habilidad de 'en tu fase de vigilia, una vez por turno' es una habilidad activada que tiene como requisito pagar este oro y otro oro que controles para que tu oponente destierre la primera carta de su mazo castillo.",
      },
    ],
  },
  {
    card_name: 'Renpet',
    rulings: [
      {
        ability_type: 'DISPARADA',
        ruling:
          "Su habilidad de 'Cuando Entra en Juego', es una habilidad disparada opcional, que te permite mirar las 2 primeras cartas de tu mazo castillo. De entre esas cartas debes elegir una de ellas y ponerla en tu mano, y la otra deberás dejarla en la parte inferior de tu mazo castillo. Si tienes 1 carta en tu mazo castillo, no podrás disparar la habilidad.",
      },
    ],
  },
  {
    card_name: 'Ramsés IX',
    alt_names: ['Ramses IX', 'Ramsés Ix'],
    rulings: [
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'Cuando es declarado atacante' es una habilidad disparada que obliga a ambos jugadores a botar 1 carta de su mazo castillo. Si entre las cartas botadas hay una carta de tipo oro o de tipo aliado, tu oponente debe botar 2 cartas adicionales.",
      },
    ],
  },
  {
    card_name: 'Amenhotep',
    rulings: [
      {
        ability_type: 'ACTIVADA',
        ruling:
          "La habilidad de 'en tu fase de vigilia, una vez por turno' es una habilidad activada que te permite generar 1 oro para jugar cartas de tipo tótem o de tipo aliado de raza sacerdote. Este oro generado podrá ser utilizado sólo hasta el final del turno.",
      },
    ],
  },
  {
    card_name: 'Wep Renpet',
    rulings: [
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'Cuando entra en juego' es una habilidad disparada opcional que tiene como requisito que controles uno o más cartas de tipo tótem para poder robar 1 carta de tu mazo castillo.",
      },
    ],
  },
  {
    card_name: 'Moroi',
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          "Su habilidad de 'solo puedes tener un Moroi en juego' es una habilidad continua, que te condiciona a solo poder tener una copia de esta carta en juego. Esta carta será válida para los formatos Racial Libre o Libre de Primer Bloque Extendido.",
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'cuando entra en juego' de este aliado, es una habilidad disparada opcional que te permite buscar una carta con la palabra Drácula en su nombre en tu cementerio y jugarla sin pagar su coste. Los oros no tienen coste y no pueden ser jugados sin pagar su coste.",
      },
    ],
  },
  {
    card_name: 'Danza de Sangre',
    rulings: [
      {
        ability_type: null,
        ruling:
          "El efecto de 'no puede ser anulado' no permite que tu oponente juegue cartas del tipo anulación que puedan afectar esta carta. Esta carta será válida para los formatos Racial Libre o Libre de Primer Bloque Extendido.",
      },
      {
        ability_type: null,
        ruling:
          'Para resolver este talismán, debes elegir un aliado en juego de fuerza 3 o menos o una carta de coste 3 o más. Luego, destruyes esa carta. Si no existen objetivos válidos o son indestructibles, no puedes jugar este talismán.',
      },
    ],
  },
  {
    card_name: 'Luna de Sangre',
    rulings: [
      {
        ability_type: 'ACTIVADA',
        ruling:
          "La habilidad de este oro es una habilidad activada, que tiene como requisito pagar este oro y otro oro que controles para robar una carta. Esta habilidad puede ser utilizada en tu turno en fase de vigilia o guerra de talismanes, como también en el turno oponente en guerra de talismanes. Sólo puedes activar una habilidad de 'Luna de Sangre' por turno. Esta carta será válida para los formatos Racial Libre o Libre de Primer Bloque Extendido.",
      },
    ],
  },
  {
    card_name: 'Draco Pútrido',
    alt_names: ['Draco Putrido'],
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling: "Su habilidad de 'puede atacar cuando entra en juego' es una habilidad continua.",
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "Su habilidad de 'cuando salga del juego' es una habilidad disparada opcional que te permite desterrar un aliado oponente de coste 4 o menos. Si tu oponente controla un aliado de coste 4 o menos que no pueda salir del juego o sea indesterrable, no puedes seleccionarlo.",
      },
    ],
  },
  {
    card_name: 'Asterión el Minotauro',
    alt_names: ['Asterion el Minotauro'],
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          "Su habilidad de 'sólo puedes tener un Asterión el Minotauro en juego' es una habilidad continua.",
      },
      {
        ability_type: 'CONTINUA',
        ruling:
          "Su habilidad de 'indesterrable' es una habilidad continua que no permite que esta carta sea desterrada del juego por habilidad o efectos de cartas.",
      },
      {
        ability_type: 'CONTINUA',
        ruling:
          "La habilidad de 'tus aliados minotauro ganan 1 a la fuerza' es una habilidad continua que permite que tus aliados con la palabra minotauro en su nombre reciban un bono de 1 a la fuerza mientras esta carta esté en juego.",
      },
    ],
  },
  {
    card_name: 'Uaisle Sidhe',
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          'La primera habilidad pide como requisito que controles 2 o más cartas con la palabra Sidhe en su nombre. Si cumples, este aliado gana imbloqueable.',
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'una vez por turno' es una habilidad disparada, que tiene como requisito que hayas descartado 1 o más cartas este turno. Si cumples, este aliado gana 1 a la fuerza hasta la fase final.",
      },
    ],
  },
  {
    card_name: 'Guerrero Ptolemaico',
    alt_names: ['Guerrero Ptolemáico'],
    rulings: [
      {
        ability_type: 'CONTINUA',
        ruling:
          'Su habilidad IMBLOQUEABLE es una habilidad Continua que no permite que este aliado sea bloqueado por Aliados oponentes.',
      },
      {
        ability_type: 'DISPARADA',
        ruling:
          "La habilidad de 'cuando entra en juego' es una habilidad disparada opcional que te permite buscar una carta de aliado con la palabra guerrero en su nombre, o bien, una carta del tipo arma en tu mazo castillo y ponerla en tu mano. Luego, deberás barajar tu mazo castillo.",
      },
    ],
  },
  {
    card_name: 'Mut',
    rulings: [
      {
        ability_type: 'ACTIVADA',
        ruling:
          "Su habilidad de 'en tu fase de vigilia, una vez por turno' es una habilidad activada que obliga a cada jugador a desterrar una carta de su cementerio y a que tú robes 1 carta de tu mazo castillo.",
      },
      {
        ability_type: null,
        ruling:
          'Luego de realizar la primera parte, si cumples con el requisito de tener más cartas en el destierro que tu oponente, puedes elegir entre barajar 1 carta de tu cementerio en tu mazo castillo o robar 1 carta.',
      },
      {
        ability_type: 'ACTIVADA',
        ruling:
          'Su última habilidad es una habilidad activada, que tiene como requisito que esta carta esté en tu cementerio. Si se cumple, puedes ponerla desde tu cementerio en la parte inferior de tu mazo castillo.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 3. Función principal
// ---------------------------------------------------------------------------
async function main() {
  console.log('='.repeat(60));
  console.log('Importación de Oráculos — MYL');
  console.log(`Documento fuente: ${SOURCE_DOCUMENT}`);
  console.log(`Total de cartas: ${ORACLE_DATA.length}`);
  console.log('='.repeat(60));
  console.log('');

  const supabase = createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < ORACLE_DATA.length; i++) {
    const entry = ORACLE_DATA[i]!;
    const progress = `[${i + 1}/${ORACLE_DATA.length}]`;

    console.log(`${progress} Procesando: ${entry.card_name}`);

    // Buscar carta
    let cardId: string | null = null;
    let matchedName: string = entry.card_name;

    const { data: exact } = await supabase
      .from('cards')
      .select('card_id, name')
      .eq('name', entry.card_name)
      .limit(1);

    if (exact && exact.length > 0) {
      cardId = exact[0]!.card_id;
      matchedName = exact[0]!.name;
    }

    if (!cardId) {
      const { data: ilike } = await supabase
        .from('cards')
        .select('card_id, name')
        .ilike('name', entry.card_name)
        .limit(1);

      if (ilike && ilike.length > 0) {
        cardId = ilike[0]!.card_id;
        matchedName = ilike[0]!.name;
      }
    }

    if (!cardId && entry.alt_names) {
      for (const altName of entry.alt_names) {
        const { data: alt } = await supabase
          .from('cards')
          .select('card_id, name')
          .ilike('name', altName)
          .limit(1);

        if (alt && alt.length > 0) {
          cardId = alt[0]!.card_id;
          matchedName = alt[0]!.name;
          break;
        }
      }
    }

    if (!cardId) {
      const allNames = [entry.card_name, ...(entry.alt_names ?? [])].join(', ');
      const msg = `${progress} CARTA NO ENCONTRADA: ${allNames}`;
      console.warn(`  -> ${msg}`);
      errors.push(msg);
      totalSkipped += entry.rulings.length;
      continue;
    }

    console.log(`  -> Carta: "${matchedName}" (${cardId})`);

    for (let sortOrder = 0; sortOrder < entry.rulings.length; sortOrder++) {
      const ruling = entry.rulings[sortOrder]!;

      const { error: insertError } = await supabase
        .from('card_oracles')
        .insert({
          card_id: cardId,
          source_document: SOURCE_DOCUMENT,
          ruling_text: ruling.ruling,
          ability_type: ruling.ability_type,
          sort_order: sortOrder,
        } as never);

      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`  -> Ruling #${sortOrder} ya existe, omitido`);
          totalSkipped++;
        } else {
          const msg = `${progress} ERROR ruling #${sortOrder}: ${insertError.message}`;
          console.error(`  -> ${msg}`);
          errors.push(msg);
        }
      } else {
        console.log(`  -> Ruling #${sortOrder} insertado (${ruling.ability_type ?? 'sin tipo'})`);
        totalInserted++;
      }
    }
  }

  // Resumen
  console.log('');
  console.log('='.repeat(60));
  console.log('Resumen de importación');
  console.log('-'.repeat(60));
  console.log(`Insertados:  ${totalInserted}`);
  console.log(`Omitidos:    ${totalSkipped}`);
  console.log(`Errores:     ${errors.length}`);
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.log('');
    console.log('Errores encontrados:');
    errors.forEach((err, idx) => console.log(`  ${idx + 1}. ${err}`));
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
