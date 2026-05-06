// ═══════════════════════════════════════════════════════════════════════
// Cliente Supabase para API Routes (server-side).
// Usa service_role para bypass de RLS — apenas no server, nunca no browser.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
