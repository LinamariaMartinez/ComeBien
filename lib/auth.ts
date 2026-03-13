'use client';

import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Browser-side Supabase client with session persistence.
 * Use this in Client Components for auth operations.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, storageKey: 'comebien-auth' },
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
