"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  solicitacaoFeriasSchema,
  type SolicitacaoFeriasInput,
} from "@/lib/schemas/ferias.schema";

interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function criarSolicitacaoFerias(
  tenantSlug: string,
  input: SolicitacaoFeriasInput
): Promise<ActionResult> {
  const supabase = createClient();

  // 1. Autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Sessão expirada. Faça login novamente." };
  }

  // 2. Validação Zod (server-side, defensivo)
  const parsed = solicitacaoFeriasSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos. Revise o formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 3. Busca empresa_id do perfil (multi-tenant)
  const { data: perfil, error: perfilError } = await supabase
    .from("perfis")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  if (perfilError || !perfil) {
    return { success: false, message: "Perfil não encontrado." };
  }

  // 4. Checa sobreposição com solicitações pendentes/aprovadas
  const { data: conflitos } = await supabase
    .from("ferias_solicitacoes")
    .select("id, data_inicio, data_fim, status")
    .eq("perfil_id", user.id)
    .in("status", ["pendente", "aprovada"])
    .or(
      `and(data_inicio.lte.${parsed.data.data_fim},data_fim.gte.${parsed.data.data_inicio})`
    );

  if (conflitos && conflitos.length > 0) {
    return {
      success: false,
      message:
        "Já existe uma solicitação pendente ou aprovada que conflita com este período.",
    };
  }

  // 5. Insere solicitação
  const { error: insertError } = await supabase
    .from("ferias_solicitacoes")
    .insert({
      perfil_id: user.id,
      empresa_id: perfil.empresa_id, // contexto multi-tenant garantido
      data_inicio: parsed.data.data_inicio,
      data_fim: parsed.data.data_fim,
      status: "pendente",
    });

  if (insertError) {
    console.error("[ferias] insert error:", insertError.message);
    return {
      success: false,
      message: "Erro ao registrar solicitação. Tente novamente.",
    };
  }

  // 6. Audit log
  await supabase.from("audit_logs").insert({
    acao: "SOLICITAR_FERIAS",
    usuario_id: user.id,
    empresa_id: perfil.empresa_id,
    metadados: {
      data_inicio: parsed.data.data_inicio,
      data_fim: parsed.data.data_fim,
      abono_pecuniario: parsed.data.abono_pecuniario,
      dias_abono: parsed.data.dias_abono,
      observacoes: parsed.data.observacoes,
    },
  });

  revalidatePath(`/c/${tenantSlug}/portal/ferias`);

  return {
    success: true,
    message: "Solicitação enviada! Aguarde a aprovação do gestor.",
  };
}

export async function cancelarSolicitacaoFerias(
  tenantSlug: string,
  solicitacaoId: string
): Promise<ActionResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Sessão expirada." };
  }

  // Só permite cancelar se ainda estiver pendente e for do próprio usuário (RLS reforça)
  const { error } = await supabase
    .from("ferias_solicitacoes")
    .update({ status: "cancelada" })
    .eq("id", solicitacaoId)
    .eq("perfil_id", user.id)
    .eq("status", "pendente");

  if (error) {
    return { success: false, message: "Não foi possível cancelar." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/ferias`);
  return { success: true, message: "Solicitação cancelada." };
}
