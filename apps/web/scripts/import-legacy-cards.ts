import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';
import { importLegacyCards } from '../src/lib/services/import-legacy-cards.service';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), 'apps/web/.env.local') });

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: tsx scripts/import-legacy-cards.ts <path-to-json-file>');
  process.exit(1);
}

async function main() {
  console.log('🚀 Iniciando importación de cartas...\n');

  // Read JSON file
  let cards;
  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    cards = JSON.parse(fileContent);
    console.log(`📄 Archivo cargado: ${cards.length} cartas encontradas\n`);
  } catch (error) {
    console.error('❌ Error leyendo el archivo:', error);
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Import cards with progress
  console.log('⏳ Importando cartas...\n');

  let lastProgress = 0;
  const result = await importLegacyCards(supabase, cards, (current, total, cardName) => {
    const progress = Math.floor((current / total) * 100);
    if (progress !== lastProgress || current === total) {
      // Clear line and show progress
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      const bar = '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
      process.stdout.write(`[${bar}] ${progress}% (${current}/${total}) - ${cardName.substring(0, 30)}`);
      lastProgress = progress;
    }
  });

  console.log('\n'); // New line after progress

  // Display results
  console.log('\n📊 Resultados de la importación:');
  console.log('─'.repeat(50));
  console.log(`✅ Importadas: ${result.imported}`);
  console.log(`⏭️  Omitidas: ${result.skipped}`);
  console.log(`❌ Errores: ${result.errors.length}`);
  console.log('─'.repeat(50));

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errores encontrados:');
    result.errors.slice(0, 20).forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });

    if (result.errors.length > 20) {
      console.log(`... y ${result.errors.length - 20} errores más`);
    }
  }

  console.log('\n✨ Importación finalizada\n');
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
