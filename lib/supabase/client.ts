import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso no navegador (Client Components).
 *
 * Utiliza a chave pública (anon key) e respeita as políticas de Row Level
 * Security (RLS) configuradas no banco, garantindo o isolamento multi-tenant
 * por `empresa_id`. Use este cliente apenas em componentes marcados com
 * "use client" (login, formulários interativos, etc.).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
