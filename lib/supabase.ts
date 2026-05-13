import { createClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  return { url, key };
}

let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const { url, key } = getSupabaseConfig();
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** @deprecated use getSupabase() instead */
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getSupabase() as any)[prop];
  },
});

export function createUserClient(token: string) {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
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
