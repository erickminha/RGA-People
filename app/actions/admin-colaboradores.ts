"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { checkRhAdmin } from "@/lib/auth/guards";
import {
  convidarColaboradorSchema,
  editarColaboradorSchema,
  type ConvidarColaboradorInput,
  type EditarColaboradorInput,
} from "@/lib/schemas/colaborador.schema";

interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// ============================================================
// CONVIDAR COLABORADOR
// ============================================================
export async function convidarColaborador(
  tenantSlug: string,
  input: ConvidarColaboradorInput
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) {
    return { success: false, message: "Acesso negado." };
  }

  const parsed = convidarColaboradorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createClient();
  const admin = createAdminClient();

  // Verifica se já existe perfil com esse email na empresa
  const { data: existente } = await supabase
    .from("perfis")
    .select("id")
    .eq("email", parsed.data.email)
    .eq("empresa_id", guard.empresaId)
    .maybeSingle();

  if (existente) {
    return {
      success: false,
      message: "Já existe um colaborador com este email nesta empresa.",
    };
  }

  // Verifica se já há convite pendente
  const { data: convitePendente } = await supabase
    .from("convites")
    .select("id")
    .eq("email", parsed.data.email)
    .eq("empresa_id", guard.empresaId)
    .eq("usado", false)
    .gt("expira_em", new Date().toISOString())
    .maybeSingle();

  if (convitePendente) {
    return {
      success: false,
      message: "Já há um convite pendente para este email.",
    };
  }

  // Gera token único + validade 7 dias
  const token = randomBytes(32).toString("hex");
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Insere convite
  const { error: conviteError } = await supabase.from("convites").insert({
    empresa_id: guard.empresaId,
    email: parsed.data.email,
    token,
    expira_em: expiraEm.toISOString(),
    usado: false,
  });

  if (conviteError) {
    console.error("[convite] insert:", conviteError.message);
    return { success: false, message: "Erro ao criar convite." };
  }

  // Dispara email via Supabase Auth (magic link com redirect)
  const redirectUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  }/c/${tenantSlug}/convite/${token}`;

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      redirectTo: redirectUrl,
      data: {
        nome_completo: parsed.data.nome_completo,
        empresa_id: guard.empresaId,
        cargo_id: parsed.data.cargo_id,
        convite_token: token,
      },
    }
  );

  if (inviteError) {
    console.error("[auth invite]:", inviteError.message);
    // Não falha o fluxo: o convite está na DB, RH pode reenviar manualmente
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    acao: "CONVIDAR_COLABORADOR",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: {
      email: parsed.data.email,
      cargo_id: parsed.data.cargo_id,
    },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin/colaboradores`);

  return {
    success: true,
    message: `Convite enviado para ${parsed.data.email}!`,
  };
}

// ============================================================
// EDITAR COLABORADOR (cargo, nome, salário)
// ============================================================
export async function editarColaborador(
  tenantSlug: string,
  input: EditarColaboradorInput
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const parsed = editarColaboradorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createClient();

  // Valida que o perfil é da mesma empresa
  const { data: alvo } = await supabase
    .from("perfis")
    .select("id, empresa_id")
    .eq("id", parsed.data.perfil_id)
    .single();

  if (!alvo || alvo.empresa_id !== guard.empresaId) {
    return { success: false, message: "Colaborador não encontrado." };
  }

  const updatePayload: Record<string, any> = {
    nome_completo: parsed.data.nome_completo,
    cargo_id: parsed.data.cargo_id,
  };

  // Salário só atualiza se a coluna existir (extensão opcional do schema)
  if (parsed.data.salario != null) {
    updatePayload.salario = parsed.data.salario;
  }

  const { error } = await supabase
    .from("perfis")
    .update(updatePayload)
    .eq("id", parsed.data.perfil_id)
    .eq("empresa_id", guard.empresaId); // dupla checagem multi-tenant

  if (error) {
    console.error("[editar colaborador]:", error.message);
    return { success: false, message: "Erro ao salvar alterações." };
  }

  await supabase.from("audit_logs").insert({
    acao: "EDITAR_COLABORADOR",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: {
      perfil_alvo: parsed.data.perfil_id,
      alteracoes: updatePayload,
    },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin/colaboradores`);
  return { success: true, message: "Colaborador atualizado." };
}

// ============================================================
// INATIVAR COLABORADOR (soft delete via flag ativo)
// ============================================================
export async function inativarColaborador(
  tenantSlug: string,
  perfilId: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  if (perfilId === guard.userId) {
    return {
      success: false,
      message: "Você não pode inativar a si mesmo.",
    };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("perfis")
    .update({ ativo: false })
    .eq("id", perfilId)
    .eq("empresa_id", guard.empresaId);

  if (error) {
    return { success: false, message: "Erro ao inativar." };
  }

  // Revoga sessão via admin client (boa prática)
  try {
    const admin = createAdminClient();
    await admin.auth.admin.signOut(perfilId);
  } catch {
    /* silent */
  }

  await supabase.from("audit_logs").insert({
    acao: "INATIVAR_COLABORADOR",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { perfil_alvo: perfilId },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin/colaboradores`);
  return { success: true, message: "Colaborador inativado." };
}

// ============================================================
// REATIVAR COLABORADOR
// ============================================================
export async function reativarColaborador(
  tenantSlug: string,
  perfilId: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ ativo: true })
    .eq("id", perfilId)
    .eq("empresa_id", guard.empresaId);

  if (error) return { success: false, message: "Erro ao reativar." };

  await supabase.from("audit_logs").insert({
    acao: "REATIVAR_COLABORADOR",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { perfil_alvo: perfilId },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin/colaboradores`);
  return { success: true, message: "Colaborador reativado." };
}
