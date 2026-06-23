"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface DownloadContrachequeParams {
  contrachequeId: string;
  tenantSlug: string;
}

interface DownloadContrachequeResult {
  success: boolean;
  url?: string;
  message?: string;
}

/**
 * Gera URL assinada (válida por 60s) do contracheque no Storage
 * e registra log de auditoria do download na tabela audit_logs.
 */
export async function gerarDownloadContracheque(
  params: DownloadContrachequeParams
): Promise<DownloadContrachequeResult> {
  const { contrachequeId } = params;
  const supabase = createClient();

  // 1. Valida usuário autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "Sessão expirada. Faça login novamente." };
  }

  // 2. Busca o contracheque (RLS garante que só o dono ou RH veja)
  const { data: contracheque, error: ccError } = await supabase
    .from("contracheques")
    .select("id, perfil_id, empresa_id, mes_ano, url_documento")
    .eq("id", contrachequeId)
    .single();

  if (ccError || !contracheque) {
    return {
      success: false,
      message: "Contracheque não encontrado ou acesso negado.",
    };
  }

  // 3. Gera URL assinada do bucket "contracheques"
  const { data: signed, error: signedError } = await supabase.storage
    .from("contracheques")
    .createSignedUrl(contracheque.url_documento, 60); // 60 segundos

  if (signedError || !signed?.signedUrl) {
    return {
      success: false,
      message: "Falha ao gerar link de download. Tente novamente.",
    };
  }

  // 4. Registra log de auditoria (LGPD/Compliance)
  const { error: logError } = await supabase.from("audit_logs").insert({
    acao: "DOWNLOAD_CONTRACHEQUE",
    usuario_id: user.id,
    empresa_id: contracheque.empresa_id,
    metadados: {
      contracheque_id: contracheque.id,
      mes_ano: contracheque.mes_ano,
      ip_user_agent: "server-action",
    },
  });

  if (logError) {
    console.error("[audit_logs] Falha ao registrar:", logError.message);
    // Não bloqueia o download, apenas registra erro
  }

  revalidatePath(`/c/${params.tenantSlug}/portal/contracheques`);

  return { success: true, url: signed.signedUrl };
}
