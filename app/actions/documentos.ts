"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";
import {
  documentoCorpSchema,
  aceiteDocSchema,
  type DocumentoCorpInput,
  type AceiteDocInput,
} from "@/lib/schemas/documento.schema";
import { headers } from "next/headers";

interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// ============================================================
// RH: criar ou atualizar documento
// ============================================================
export async function salvarDocumento(
  tenantSlug: string,
  id: string | null,
  input: DocumentoCorpInput
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const parsed = documentoCorpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os campos do formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = createClient();
  
  if (id) {
    // Atualização (incrementa versão se o conteúdo mudar, opcionalmente)
    const { error } = await supabase
      .from("documentos_corporativos")
      .update({
        ...parsed.data,
        // Lógica simples: se mudar conteúdo ou arquivo, podemos forçar nova versão aqui se desejado
      })
      .eq("id", id)
      .eq("empresa_id", guard.empresaId);

    if (error) return { success: false, message: "Erro ao atualizar documento." };
  } else {
    // Criação
    const { error } = await supabase.from("documentos_corporativos").insert({
      ...parsed.data,
      empresa_id: guard.empresaId,
      criado_por: guard.userId,
    });

    if (error) return { success: false, message: "Erro ao criar documento." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/documentos`);
  revalidatePath(`/c/${tenantSlug}/portal/documentos`);
  return { success: true, message: "Documento salvo com sucesso." };
}

// ============================================================
// Colaborador: registrar aceite eletrônico
// ============================================================
export async function registrarAceiteDocumento(
  tenantSlug: string,
  input: AceiteDocInput
): Promise<ActionResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sessão expirada." };

  const parsed = aceiteDocSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Dados inválidos." };

  // Captura metadados de rede
  const headerList = headers();
  const ip = headerList.get("x-forwarded-for") || "0.0.0.0";
  const ua = headerList.get("user-agent") || "unknown";

  // Busca empresa_id do perfil
  const { data: perfil } = await supabase
    .from("perfis")
    .select("empresa_id")
    .eq("id", user.id)
    .single();
  if (!perfil) return { success: false, message: "Perfil não encontrado." };

  const { error } = await supabase.from("aceites_documentos").insert({
    documento_id: parsed.data.documento_id,
    perfil_id: user.id,
    empresa_id: perfil.empresa_id,
    versao_aceita: parsed.data.versao,
    ip_origem: ip,
    user_agent: ua,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true, message: "Você já aceitou esta versão." };
    }
    return { success: false, message: "Erro ao registrar aceite." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/documentos`);
  return { success: true, message: "Aceite registrado com sucesso." };
}
