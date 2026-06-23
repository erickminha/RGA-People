"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  autoAvaliacaoCompletaSchema,
  type AutoAvaliacaoCompleta,
} from "@/lib/schemas/avaliacao.schema";

interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export async function enviarAutoAvaliacao(
  tenantSlug: string,
  periodo: string,
  payload: AutoAvaliacaoCompleta
): Promise<ActionResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Sessão expirada." };
  }

  // Validação Zod server-side
  const parsed = autoAvaliacaoCompletaSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos. Revise o formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Busca empresa_id (multi-tenant)
  const { data: perfil } = await supabase
    .from("perfis")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    return { success: false, message: "Perfil não encontrado." };
  }

  // Checa se já existe avaliação enviada para este período
  const { data: existente } = await supabase
    .from("avaliacoes_desempenho")
    .select("id, auto_avaliacao")
    .eq("avaliado_id", user.id)
    .eq("periodo", periodo)
    .maybeSingle();

  if (existente?.auto_avaliacao) {
    return {
      success: false,
      message: "Você já enviou sua auto-avaliação para este período.",
    };
  }

  const autoAvaliacaoJson = JSON.stringify({
    ...parsed.data,
    enviado_em: new Date().toISOString(),
  });

  // Insert ou update
  const upsertPayload = {
    avaliado_id: user.id,
    empresa_id: perfil.empresa_id,
    periodo,
    auto_avaliacao: autoAvaliacaoJson,
    nota_final: parsed.data.nota_auto_avaliacao,
  };

  const { error } = existente
    ? await supabase
        .from("avaliacoes_desempenho")
        .update(upsertPayload)
        .eq("id", existente.id)
    : await supabase.from("avaliacoes_desempenho").insert(upsertPayload);

  if (error) {
    console.error("[avaliacao] insert error:", error.message);
    return {
      success: false,
      message: "Erro ao salvar avaliação. Tente novamente.",
    };
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    acao: "ENVIAR_AUTO_AVALIACAO",
    usuario_id: user.id,
    empresa_id: perfil.empresa_id,
    metadados: { periodo, nota: parsed.data.nota_auto_avaliacao },
  });

  revalidatePath(`/c/${tenantSlug}/portal/avaliacao`);

  return {
    success: true,
    message: "Auto-avaliação enviada com sucesso!",
  };
}
