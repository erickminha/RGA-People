import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com Service Role.
 * ⚠️ USAR APENAS no servidor — nunca expor ao cliente.
 * Necessário para: invites de auth, signOut forçado, operações privilegiadas.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Variáveis de ambiente SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausentes."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
