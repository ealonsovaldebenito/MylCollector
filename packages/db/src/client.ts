import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Cliente Supabase para uso en browser o con anon key.
 */
export function createSupabaseClient(url: string, anonKey: string): TypedSupabaseClient {
  return createClient<Database>(url, anonKey);
}

/**
 * Cliente Supabase con service role key (server-side only).
 * Bypass RLS — usar solo en server/workers.
 */
export function createSupabaseServiceClient(
  url: string,
  serviceRoleKey: string,
): TypedSupabaseClient {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
