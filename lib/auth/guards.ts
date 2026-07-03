import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthGuardResult {
  userId: string;
  empresaId: string;
  role: "super_admin" | "rh_admin" | "gestor" | "colaborador";
  nomeCompleto: string;
}

/**
 * Garante que o usuário está autenticado e tem permissão de RH ou Super Admin.
 * Caso contrário, redireciona para o portal do colaborador.
 */
export async function requireRhAdmin(
  tenantSlug: string
): Promise<AuthGuardResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/c/${tenantSlug}/login`);
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select(
      `
      id,
      empresa_id,
      nome_completo,
      cargo:cargos!perfis_cargo_id_fkey (
        id,
        nome,
        permissoes
      )
    `
    )
    .eq("id", user.id)
    .single();

  if (error || !perfil) {
    redirect(`/c/${tenantSlug}/portal`);
  }

  const permissoes = (perfil.cargo as any)?.permissoes ?? {};
  const isRhAdmin = permissoes.rh_admin === true;
  const isSuperAdmin = permissoes.super_admin === true;

  if (!isRhAdmin && !isSuperAdmin) {
    redirect(`/c/${tenantSlug}/portal`);
  }

  return {
    userId: user.id,
    empresaId: perfil.empresa_id,
    role: isSuperAdmin ? "super_admin" : "rh_admin",
    nomeCompleto: perfil.nome_completo,
  };
}

/**
 * Versão "boolean" para uso em Server Actions
 * (não redireciona — retorna o resultado para tratamento manual).
 */
export async function checkRhAdmin(): Promise<AuthGuardResult | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select(
      `id, empresa_id, nome_completo, cargo:cargos!perfis_cargo_id_fkey(permissoes)`
    )
    .eq("id", user.id)
    .single();

  if (!perfil) return null;
  const p = (perfil.cargo as any)?.permissoes ?? {};
  if (!p.rh_admin && !p.super_admin) return null;

  return {
    userId: user.id,
    empresaId: perfil.empresa_id,
    role: p.super_admin ? "super_admin" : "rh_admin",
    nomeCompleto: perfil.nome_completo,
  };
}

/**
 * Garante que o usuário é Super Admin (não apenas RH). Usado em páginas que
 * cruzam empresas (ex.: gestão de tenants), onde um RH admin comum não pode
 * entrar. Redireciona caso contrário.
 */
export async function requireSuperAdmin(
  tenantSlug: string
): Promise<AuthGuardResult> {
  const guard = await requireRhAdmin(tenantSlug);
  if (guard.role !== "super_admin") {
    redirect(`/c/${tenantSlug}/portal`);
  }
  return guard;
}

/**
 * Versão "boolean" de requireSuperAdmin, para uso em Server Actions.
 */
export async function checkSuperAdmin(): Promise<AuthGuardResult | null> {
  const guard = await checkRhAdmin();
  if (!guard || guard.role !== "super_admin") return null;
  return guard;
}
