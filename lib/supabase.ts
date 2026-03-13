import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

/** Anonymous server client (no user context). */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates a Supabase client scoped to the authenticated user.
 * Pass the Bearer token from the request Authorization header.
 * RLS automatically filters data to that user's rows.
 */
export function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
}

/**
 * Extracts the Bearer token from an Authorization header string.
 * Returns null if missing or malformed.
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
