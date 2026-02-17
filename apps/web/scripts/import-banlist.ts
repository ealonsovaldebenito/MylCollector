/**
 * import-banlist.ts — Importa el ban list de Racial Edición Primer Bloque (Feb 2026).
 *
 * Crea una revisión en ban_list_revisions y upserts en format_card_limits.
 *
 * Uso:
 *   pnpm --filter @myl/web tsx scripts/import-banlist.ts
 *
 * Requiere:
 *   - apps/web/.env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *
 * Changelog:
 *   2026-02-16 — Creación inicial — Ban List Racial Edición PB Febrero 2026
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
// 2. Datos del ban list — Racial Edición Primer Bloque (Febrero 2026)
// ---------------------------------------------------------------------------

const FORMAT_CODE = 'EDICION_RACIAL'; // Código del formato en la DB

interface BanEntry {
  card_name: string;
  alt_names?: string[];
  max_qty: number; // 0=prohibida, 1=limitada a 1, 2=limitada a 2
  notes?: string;
}

const REVISION_NAME = 'Ban List Racial Edición PB — Febrero 2026';
const REVISION_DESCRIPTION =
  'Actualización de la lista de cartas prohibidas y restringidas para el formato ' +
  'Racial Edición Primer Bloque. Vigente desde el 05 de febrero de 2026.';
const EFFECTIVE_DATE = '2026-02-05';

// Cartas prohibidas (0 copias)
const BANNED: BanEntry[] = [
  // Espada Sagrada
  { card_name: 'Dagda', max_qty: 0, notes: 'Espada Sagrada — Prohibida' },
  { card_name: 'El Morrígan', alt_names: ['El Morrigan'], max_qty: 0, notes: 'Espada Sagrada — Prohibida' },
  { card_name: 'Nuada', max_qty: 0, notes: 'Espada Sagrada — Prohibida' },
  { card_name: 'Bruja Nocturna', max_qty: 0, notes: 'Espada Sagrada — Prohibida' },
  // Helénica
  { card_name: 'Tifón', alt_names: ['Tifon'], max_qty: 0, notes: 'Helénica — Prohibida' },
  // Hijos de Daana
  { card_name: 'Diancecht', max_qty: 0, notes: 'Hijos de Daana — Prohibida' },
  // Dominios de Ra
  { card_name: 'Ramsés II', alt_names: ['Ramses II', 'Ramsés Ii', 'Ramses Ii'], max_qty: 0, notes: 'Dominios de Ra — Prohibida' },
];

// Limitadas a 1 copia
const LIMITED_1: BanEntry[] = [
  // Espada Sagrada
  { card_name: 'Lugh', max_qty: 1, notes: 'Espada Sagrada — Limitada a 1' },
  { card_name: 'Excalibur', max_qty: 1, notes: 'Espada Sagrada — Limitada a 1' },
  { card_name: 'Merlín', alt_names: ['Merlin'], max_qty: 1, notes: 'Espada Sagrada — Limitada a 1' },
  { card_name: 'La Dama del Lago', max_qty: 1, notes: 'Espada Sagrada — Limitada a 1' },
  // Helénica
  { card_name: 'Zeus', max_qty: 1, notes: 'Helénica — Limitada a 1' },
  { card_name: 'Aquiles', max_qty: 1, notes: 'Helénica — Limitada a 1' },
  { card_name: 'Teseo', max_qty: 1, notes: 'Helénica — Limitada a 1' },
  { card_name: 'Odiseo', max_qty: 1, notes: 'Helénica — Limitada a 1' },
  // Hijos de Daana
  { card_name: 'Banshee', max_qty: 1, notes: 'Hijos de Daana — Limitada a 1' },
  { card_name: 'Dagda Renacido', max_qty: 1, notes: 'Hijos de Daana — Limitada a 1' },
  // Dominios de Ra
  { card_name: 'Nefertiti', max_qty: 1, notes: 'Dominios de Ra — Limitada a 1' },
  { card_name: 'Cleopatra', max_qty: 1, notes: 'Dominios de Ra — Limitada a 1' },
  { card_name: 'Anubis', max_qty: 1, notes: 'Dominios de Ra — Limitada a 1' },
];

// Limitadas a 2 copias
const LIMITED_2: BanEntry[] = [
  // Espada Sagrada
  { card_name: 'Morgana', max_qty: 2, notes: 'Espada Sagrada — Limitada a 2' },
  { card_name: 'Hada Madrina', max_qty: 2, notes: 'Espada Sagrada — Limitada a 2' },
  // Helénica
  { card_name: 'Hermes', max_qty: 2, notes: 'Helénica — Limitada a 2' },
  { card_name: 'Minotauro de Creta', max_qty: 2, notes: 'Helénica — Limitada a 2' },
  { card_name: 'Medusa', max_qty: 2, notes: 'Helénica — Limitada a 2' },
  // Hijos de Daana
  { card_name: 'Cú Chulainn', alt_names: ['Cu Chulainn', 'Cú Chulainn'], max_qty: 2, notes: 'Hijos de Daana — Limitada a 2' },
  { card_name: 'Sidhe', max_qty: 2, notes: 'Hijos de Daana — Limitada a 2' },
  // Dominios de Ra
  { card_name: 'Horus', max_qty: 2, notes: 'Dominios de Ra — Limitada a 2' },
  { card_name: 'Isis', max_qty: 2, notes: 'Dominios de Ra — Limitada a 2' },
  { card_name: 'Seth', max_qty: 2, notes: 'Dominios de Ra — Limitada a 2' },
];

const ALL_ENTRIES = [...BANNED, ...LIMITED_1, ...LIMITED_2];

// ---------------------------------------------------------------------------
// 3. Función principal
// ---------------------------------------------------------------------------
async function main() {
  console.log('='.repeat(60));
  console.log('Importación de Ban List — MYL');
  console.log(`Revisión: ${REVISION_NAME}`);
  console.log(`Fecha efectiva: ${EFFECTIVE_DATE}`);
  console.log(`Total de entradas: ${ALL_ENTRIES.length}`);
  console.log('='.repeat(60));
  console.log('');

  const supabase = createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // -----------------------------------------------------------------------
  // 3a. Encontrar el formato
  // -----------------------------------------------------------------------
  console.log('Buscando formato...');
  const { data: formats, error: fmtErr } = await supabase
    .from('formats')
    .select('format_id, name, code')
    .or(`code.eq.${FORMAT_CODE},name.ilike.%racial%edición%primer%`);

  if (fmtErr) {
    console.error('Error buscando formato:', fmtErr.message);
    process.exit(1);
  }

  if (!formats || formats.length === 0) {
    console.error(`Formato "${FORMAT_CODE}" no encontrado. Formatos disponibles:`);
    const { data: allFormats } = await supabase.from('formats').select('format_id, name, code');
    if (allFormats) {
      for (const f of allFormats) {
        console.log(`  - ${f.code ?? '(sin código)'}: ${f.name} (${f.format_id})`);
      }
    }
    console.log('');
    console.log('Tip: Modifica FORMAT_CODE en el script para que coincida con tu base de datos.');
    process.exit(1);
  }

  const format = formats[0]!;
  console.log(`  -> Formato: "${format.name}" (${format.format_id})\n`);

  // -----------------------------------------------------------------------
  // 3b. Crear revisión
  // -----------------------------------------------------------------------
  console.log('Creando revisión de ban list...');
  const { data: revision, error: revErr } = await supabase
    .from('ban_list_revisions')
    .insert({
      format_id: format.format_id,
      name: REVISION_NAME,
      description: REVISION_DESCRIPTION,
      effective_date: EFFECTIVE_DATE,
    } as never)
    .select('*')
    .single();

  if (revErr || !revision) {
    console.error('Error creando revisión:', revErr?.message ?? 'Desconocido');
    process.exit(1);
  }

  const revisionId = (revision as { revision_id: string }).revision_id;
  console.log(`  -> Revisión creada: ${revisionId}\n`);

  // -----------------------------------------------------------------------
  // 3c. Procesar cada entrada
  // -----------------------------------------------------------------------
  let totalApplied = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < ALL_ENTRIES.length; i++) {
    const entry = ALL_ENTRIES[i]!;
    const progress = `[${i + 1}/${ALL_ENTRIES.length}]`;
    const label = entry.max_qty === 0 ? 'PROHIBIDA' : `LIMITADA A ${entry.max_qty}`;

    console.log(`${progress} ${entry.card_name} → ${label}`);

    // Buscar carta
    let cardId: string | null = null;
    let matchedName: string = entry.card_name;

    // Match exacto
    const { data: exact } = await supabase
      .from('cards')
      .select('card_id, name')
      .eq('name', entry.card_name)
      .limit(1);

    if (exact && exact.length > 0) {
      cardId = exact[0]!.card_id;
      matchedName = exact[0]!.name;
    }

    // Match case-insensitive
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

    // Nombres alternativos
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
      const msg = `${progress} CARTA NO ENCONTRADA: ${entry.card_name}`;
      console.warn(`  -> ${msg}`);
      errors.push(msg);
      totalSkipped++;
      continue;
    }

    console.log(`  -> Carta: "${matchedName}" (${cardId})`);

    // Obtener límite actual
    const { data: currentLimit } = await supabase
      .from('format_card_limits')
      .select('format_card_limit_id, max_qty')
      .eq('format_id', format.format_id)
      .eq('card_id', cardId)
      .single();

    const previousQty = currentLimit
      ? (currentLimit as { max_qty: number }).max_qty
      : null;

    // Determinar change_type
    let changeType: string;
    if (previousQty === null) {
      changeType = entry.max_qty === 0 ? 'BANNED' : 'RESTRICTED';
    } else if (entry.max_qty < previousQty) {
      changeType = entry.max_qty === 0 ? 'BANNED' : 'RESTRICTED';
    } else {
      changeType = 'RESTRICTED';
    }

    // Crear entrada en ban_list_entries
    const { error: entryErr } = await supabase
      .from('ban_list_entries')
      .insert({
        revision_id: revisionId,
        card_id: cardId,
        max_qty: entry.max_qty,
        previous_qty: previousQty,
        change_type: changeType,
        notes: entry.notes ?? null,
      } as never);

    if (entryErr) {
      const msg = `${progress} ERROR creando entry: ${entryErr.message}`;
      console.error(`  -> ${msg}`);
      errors.push(msg);
    }

    // Upsert en format_card_limits
    if (currentLimit) {
      const limitId = (currentLimit as { format_card_limit_id: string }).format_card_limit_id;
      const { error: updErr } = await supabase
        .from('format_card_limits')
        .update({
          max_qty: entry.max_qty,
          revision_id: revisionId,
          notes: entry.notes ?? null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('format_card_limit_id', limitId);

      if (updErr) {
        const msg = `${progress} ERROR actualizando límite: ${updErr.message}`;
        console.error(`  -> ${msg}`);
        errors.push(msg);
      } else {
        console.log(`  -> Límite actualizado: ${previousQty} → ${entry.max_qty}`);
        totalApplied++;
      }
    } else {
      const { error: insErr } = await supabase
        .from('format_card_limits')
        .insert({
          format_id: format.format_id,
          card_id: cardId,
          max_qty: entry.max_qty,
          revision_id: revisionId,
          notes: entry.notes ?? null,
        } as never);

      if (insErr) {
        const msg = `${progress} ERROR creando límite: ${insErr.message}`;
        console.error(`  -> ${msg}`);
        errors.push(msg);
      } else {
        console.log(`  -> Límite creado: max_qty=${entry.max_qty}`);
        totalApplied++;
      }
    }
  }

  // -----------------------------------------------------------------------
  // 4. Resumen
  // -----------------------------------------------------------------------
  console.log('');
  console.log('='.repeat(60));
  console.log('Resumen de importación');
  console.log('-'.repeat(60));
  console.log(`Aplicados:   ${totalApplied}`);
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
