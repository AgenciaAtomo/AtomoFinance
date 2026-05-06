// ═══════════════════════════════════════════════════════════════════════
// Cliente Supabase para componentes React (browser-side).
// Usa anon key — RLS aplica.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase env vars não configuradas no browser');
  }

  client = createClient(url, key);
  return client;
}
