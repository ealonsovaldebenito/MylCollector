import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@myl/db';

/**
 * Cliente Supabase con service_role key para operaciones administrativas.
 * BYPASS RLS - usar solo en server-side para operaciones admin.
 *
 * ⚠️ NUNCA exponer este cliente al frontend.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
