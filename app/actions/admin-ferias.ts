"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";
import {
  enviarEmailFeriasAprovadas,
  enviarEmailFeriasRejeitadas,
} from "@/lib/email/resend";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActionResult {
  success: boolean;
  message: string;
}

function formatarData(data: string) {
  try {
    return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return data;
  }
}

function calcularDias(inicio: string, fim: string) {
  const d1 = new Date(inicio);
  const d2 = new Date(fim);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export async function aprovarSolicitacaoFerias(
  tenantSlug: string,
  solicitacaoId: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = createClient();

  // Buscar solicitação com dados do colaborador e empresa
  const { data: solicitacao } = await supabase
    .from("ferias_solicitacoes")
    .select(`
      id,
      empresa_id,
      perfil_id,
      status,
      data_inicio,
      data_fim,
      perfil:perfis!ferias_solicitacoes_perfil_id_fkey (
        nome_completo,
        email
      )
    `)
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

  // Buscar nome da empresa para o email
  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome")
    .eq("id", guard.empresaId)
    .single();

  await supabase.from("audit_logs").insert({
    acao: "APROVAR_FERIAS",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { solicitacao_id: solicitacaoId, perfil_alvo: solicitacao.perfil_id },
  });

  // Enviar email de notificação (não bloqueia em caso de falha)
  const perfil = solicitacao.perfil as any;
  if (perfil?.email) {
    try {
      await enviarEmailFeriasAprovadas({
        para: perfil.email,
        nomeColaborador: perfil.nome_completo ?? "Colaborador",
        dataInicio: formatarData(solicitacao.data_inicio),
        dataFim: formatarData(solicitacao.data_fim),
        diasTotal: calcularDias(solicitacao.data_inicio, solicitacao.data_fim),
        nomeEmpresa: empresa?.nome ?? "sua empresa",
      });
    } catch (emailErr) {
      console.error("[email férias aprovadas]:", emailErr);
    }
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin`);
  revalidatePath(`/c/${tenantSlug}/portal/admin/ferias`);
  return { success: true, message: "Férias aprovadas! Colaborador notificado por email." };
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

  // Buscar solicitação com dados do colaborador
  const { data: solicitacao } = await supabase
    .from("ferias_solicitacoes")
    .select(`
      id,
      empresa_id,
      perfil_id,
      data_inicio,
      data_fim,
      perfil:perfis!ferias_solicitacoes_perfil_id_fkey (
        nome_completo,
        email
      )
    `)
    .eq("id", solicitacaoId)
    .eq("empresa_id", guard.empresaId)
    .eq("status", "pendente")
    .single();

  const { error } = await supabase
    .from("ferias_solicitacoes")
    .update({ status: "rejeitada", observacoes: motivo.trim() })
    .eq("id", solicitacaoId)
    .eq("empresa_id", guard.empresaId)
    .eq("status", "pendente");

  if (error) return { success: false, message: "Erro ao rejeitar." };

  // Buscar nome da empresa
  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome")
    .eq("id", guard.empresaId)
    .single();

  await supabase.from("audit_logs").insert({
    acao: "REJEITAR_FERIAS",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { solicitacao_id: solicitacaoId, motivo },
  });

  // Enviar email de notificação (não bloqueia em caso de falha)
  const perfil = solicitacao?.perfil as any;
  if (perfil?.email) {
    try {
      await enviarEmailFeriasRejeitadas({
        para: perfil.email,
        nomeColaborador: perfil.nome_completo ?? "Colaborador",
        dataInicio: formatarData(solicitacao?.data_inicio ?? ""),
        dataFim: formatarData(solicitacao?.data_fim ?? ""),
        motivo: motivo.trim(),
        nomeEmpresa: empresa?.nome ?? "sua empresa",
      });
    } catch (emailErr) {
      console.error("[email férias rejeitadas]:", emailErr);
    }
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin`);
  revalidatePath(`/c/${tenantSlug}/portal/admin/ferias`);
  return { success: true, message: "Solicitação rejeitada. Colaborador notificado por email." };
}
