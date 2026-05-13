'use client';

import { createClient, Session } from '@supabase/supabase-js';

let _browser: ReturnType<typeof createClient> | null = null;

function getBrowserClient() {
  if (!_browser) {
    _browser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: true, storageKey: 'comebien-auth' } },
    );
  }
  return _browser;
}

/**
 * Browser-side Supabase client with session persistence.
 * Use this in Client Components for auth operations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabaseBrowser: ReturnType<typeof createClient> = new Proxy({} as any, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_, prop) { return (getBrowserClient() as any)[prop]; },
});

export type { Session };

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseBrowser.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  await supabaseBrowser.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabaseBrowser.auth.getSession();
  return data.session;
}
