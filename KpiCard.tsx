"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";

interface ActionResult {
  success: boolean;
  message: string;
}

export async function aprovarSolicitacaoFerias(
  tenantSlug: string,
  solicitacaoId: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = createClient();

  const { data: solicitacao } = await supabase
    .from("ferias_solicitacoes")
    .select("id, empresa_id, perfil_id, status")
    .eq("id", solicitacaoId)
    .single();

  if (!solicitacao || solicitacao.empresa_id !== guard.empresaId) {
    return { success: false, message: "Solicitação não encontrada." };
  }

  if (solicitacao.status !== "pendente") {
    return { success: false, message: "Solicitação já foi processada." };
  }

  const { error } = await supabase
    .from("ferias_solicitacoes")
    .update({ status: "aprovada" })
    .eq("id", solicitacaoId);

  if (error) return { success: false, message: "Erro ao aprovar." };

  await supabase.from("audit_logs").insert({
    acao: "APROVAR_FERIAS",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { solicitacao_id: solicitacaoId, perfil_alvo: solicitacao.perfil_id },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin`);
  return { success: true, message: "Férias aprovadas!" };
}

export async function rejeitarSolicitacaoFerias(
  tenantSlug: string,
  solicitacaoId: string,
  motivo: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  if (!motivo || motivo.trim().length < 5) {
    return { success: false, message: "Informe um motivo (mín. 5 caracteres)." };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("ferias_solicitacoes")
    .update({ status: "rejeitada" })
    .eq("id", solicitacaoId)
    .eq("empresa_id", guard.empresaId)
    .eq("status", "pendente");

  if (error) return { success: false, message: "Erro ao rejeitar." };

  await supabase.from("audit_logs").insert({
    acao: "REJEITAR_FERIAS",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { solicitacao_id: solicitacaoId, motivo },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin`);
  return { success: true, message: "Solicitação rejeitada." };
}
