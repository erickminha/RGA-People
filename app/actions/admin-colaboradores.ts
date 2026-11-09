"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";
import {
  editarColaboradorSchema,
  type EditarColaboradorInput,
} from "@/lib/schemas/colaborador.schema";

interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// ============================================================
// EDITAR COLABORADOR (cargo, nome, salário)
// ============================================================
export async function editarColaborador(
  tenantSlug: string,
  input: EditarColaboradorInput
): Promise<ActionResult> {
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const parsed = editarColaboradorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

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
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  if (perfilId === guard.userId) {
    return {
      success: false,
      message: "Você não pode inativar a si mesmo.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("perfis")
    .update({ ativo: false })
    .eq("id", perfilId)
    .eq("empresa_id", guard.empresaId);

  if (error) {
    return { success: false, message: "Erro ao inativar." };
  }

  const admin = createAdminClient();
  const { error: banError } = await admin.auth.admin.updateUserById(perfilId, {
    ban_duration: "876000h",
  });
  if (banError) {
    const { error: restoreError } = await supabase
      .from("perfis")
      .update({ ativo: true })
      .eq("id", perfilId)
      .eq("empresa_id", guard.empresaId);
    if (restoreError) console.error("[inativar colaborador] rollback:", restoreError.message);
    console.error("[inativar colaborador] bloquear login:", banError.message);
    return { success: false, message: "Não foi possível bloquear o acesso. Tente novamente." };
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
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({ ativo: true })
    .eq("id", perfilId)
    .eq("empresa_id", guard.empresaId);

  if (error) return { success: false, message: "Erro ao reativar." };

  const admin = createAdminClient();
  const { error: unbanError } = await admin.auth.admin.updateUserById(perfilId, {
    ban_duration: "none",
  });
  if (unbanError) {
    const { error: restoreError } = await supabase
      .from("perfis")
      .update({ ativo: false })
      .eq("id", perfilId)
      .eq("empresa_id", guard.empresaId);
    if (restoreError) console.error("[reativar colaborador] rollback:", restoreError.message);
    console.error("[reativar colaborador] liberar login:", unbanError.message);
    return { success: false, message: "Não foi possível reativar o acesso. Tente novamente." };
  }

  await supabase.from("audit_logs").insert({
    acao: "REATIVAR_COLABORADOR",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { perfil_alvo: perfilId },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin/colaboradores`);
  return { success: true, message: "Colaborador reativado." };
}
