"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";
import {
  pesquisaClimaSchema,
  respostaClimaSchema,
  type PesquisaClimaInput,
  type RespostaClimaInput,
} from "@/lib/schemas/clima.schema";

interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// ============================================================
// RH: criar pesquisa de clima
// ============================================================
export async function criarPesquisaClima(
  tenantSlug: string,
  input: PesquisaClimaInput
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const parsed = pesquisaClimaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos do formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("pesquisas_clima").insert({
    empresa_id: guard.empresaId,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao,
    data_abertura: parsed.data.data_abertura || null,
    data_fechamento: parsed.data.data_fechamento || null,
    perguntas: parsed.data.perguntas,
    status: "rascunho",
    criado_por: guard.userId,
  });

  if (error) {
    console.error("[clima] criar:", error.message);
    return { success: false, message: "Erro ao criar a pesquisa." };
  }

  await supabase.from("audit_logs").insert({
    acao: "CRIAR_PESQUISA_CLIMA",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { titulo: parsed.data.titulo },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin/clima`);
  return { success: true, message: "Pesquisa criada como rascunho." };
}

// ============================================================
// RH: alterar status (abrir / encerrar)
// ============================================================
export async function alterarStatusPesquisa(
  tenantSlug: string,
  pesquisaId: string,
  novoStatus: "aberta" | "encerrada"
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = createClient();
  const { error } = await supabase
    .from("pesquisas_clima")
    .update({ status: novoStatus })
    .eq("id", pesquisaId)
    .eq("empresa_id", guard.empresaId);

  if (error) return { success: false, message: "Erro ao atualizar status." };

  await supabase.from("audit_logs").insert({
    acao: "ALTERAR_STATUS_PESQUISA_CLIMA",
    usuario_id: guard.userId,
    empresa_id: guard.empresaId,
    metadados: { pesquisa_id: pesquisaId, status: novoStatus },
  });

  revalidatePath(`/c/${tenantSlug}/portal/admin/clima`);
  return {
    success: true,
    message:
      novoStatus === "aberta"
        ? "Pesquisa aberta para respostas!"
        : "Pesquisa encerrada.",
  };
}

// ============================================================
// Colaborador: enviar respostas (ANÔNIMO)
// ============================================================
export async function responderPesquisaClima(
  tenantSlug: string,
  input: RespostaClimaInput
): Promise<ActionResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sessão expirada." };

  const parsed = respostaClimaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Respostas inválidas.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Recupera empresa e valida pesquisa aberta
  const { data: perfil } = await supabase
    .from("perfis")
    .select("empresa_id")
    .eq("id", user.id)
    .single();
  if (!perfil) return { success: false, message: "Perfil não encontrado." };

  const { data: pesquisa } = await supabase
    .from("pesquisas_clima")
    .select("id, status, empresa_id")
    .eq("id", parsed.data.pesquisa_id)
    .single();

  if (!pesquisa || pesquisa.empresa_id !== perfil.empresa_id) {
    return { success: false, message: "Pesquisa não encontrada." };
  }
  if (pesquisa.status !== "aberta") {
    return { success: false, message: "Esta pesquisa não está aberta." };
  }

  // Evita resposta dupla via tabela de controle (sem ligar pessoa à resposta)
  const { data: jaRespondeu } = await supabase
    .from("controle_participacao_clima")
    .select("perfil_id")
    .eq("pesquisa_id", parsed.data.pesquisa_id)
    .eq("perfil_id", user.id)
    .maybeSingle();

  if (jaRespondeu) {
    return { success: false, message: "Você já respondeu esta pesquisa." };
  }

  // 1) Registra resposta ANÔNIMA (sem perfil_id)
  const { error: respErr } = await supabase.from("respostas_clima").insert({
    pesquisa_id: parsed.data.pesquisa_id,
    empresa_id: perfil.empresa_id,
    respostas: parsed.data.respostas,
    departamento: parsed.data.departamento || null,
  });
  if (respErr) {
    console.error("[clima] resposta:", respErr.message);
    return { success: false, message: "Erro ao enviar respostas." };
  }

  // 2) Marca participação (separado da resposta)
  await supabase
    .from("controle_participacao_clima")
    .insert({ pesquisa_id: parsed.data.pesquisa_id, perfil_id: user.id });

  revalidatePath(`/c/${tenantSlug}/portal/clima`);
  return {
    success: true,
    message: "Obrigado! Sua resposta anônima foi registrada.",
  };
}
