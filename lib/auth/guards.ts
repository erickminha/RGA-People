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
  const supabase = await createClient();

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
      ativo,
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
  if (perfil.ativo !== true) redirect(`/c/${tenantSlug}/login`);

  const { data: empresa } = await supabase
    .from("empresas")
    .select("slug, ativo")
    .eq("id", perfil.empresa_id)
    .maybeSingle();
  if (!empresa || empresa.slug !== tenantSlug || empresa.ativo !== true) {
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
export async function checkRhAdmin(tenantSlug?: string): Promise<AuthGuardResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select(
      `id, empresa_id, ativo, nome_completo, cargo:cargos!perfis_cargo_id_fkey(permissoes)`
    )
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.ativo !== true) return null;
  if (tenantSlug) {
    const { data: empresa } = await supabase
      .from("empresas")
      .select("slug, ativo")
      .eq("id", perfil.empresa_id)
      .maybeSingle();
    if (!empresa || empresa.slug !== tenantSlug || empresa.ativo !== true) return null;
  }
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
 * Garante que o usuário está autenticado e é SUPER ADMIN.
 * Caso contrário, redireciona para o portal do colaborador.
 * Usado em páginas de gestão global (ex.: empresas/tenants).
 */
export async function requireSuperAdmin(
  tenantSlug: string
): Promise<AuthGuardResult> {
  const supabase = await createClient();

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
      ativo,
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
  if (perfil.ativo !== true) redirect(`/c/${tenantSlug}/login`);

  const { data: empresa } = await supabase
    .from("empresas")
    .select("slug, ativo")
    .eq("id", perfil.empresa_id)
    .maybeSingle();
  if (!empresa || empresa.slug !== tenantSlug || empresa.ativo !== true) {
    redirect(`/c/${tenantSlug}/portal`);
  }

  const permissoes = (perfil.cargo as any)?.permissoes ?? {};

  if (permissoes.super_admin !== true) {
    redirect(`/c/${tenantSlug}/portal`);
  }

  return {
    userId: user.id,
    empresaId: perfil.empresa_id,
    role: "super_admin",
    nomeCompleto: perfil.nome_completo,
  };
}

/**
 * Versão "boolean" do guard acima para Server Actions.
 * Retorna o perfil apenas para super admin; caso contrário, null.
 */
export async function checkSuperAdmin(tenantSlug?: string): Promise<AuthGuardResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select(
      `id, empresa_id, ativo, nome_completo, cargo:cargos!perfis_cargo_id_fkey(permissoes)`
    )
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.ativo !== true) return null;
  if (tenantSlug) {
    const { data: empresa } = await supabase
      .from("empresas")
      .select("slug, ativo")
      .eq("id", perfil.empresa_id)
      .maybeSingle();
    if (!empresa || empresa.slug !== tenantSlug || empresa.ativo !== true) return null;
  }
  const p = (perfil.cargo as any)?.permissoes ?? {};
  if (p.super_admin !== true) return null;

  return {
    userId: user.id,
    empresaId: perfil.empresa_id,
    role: "super_admin",
    nomeCompleto: perfil.nome_completo,
  };
}
