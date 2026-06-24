"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";

interface ActionResult {
  success: boolean;
  message: string;
}

export async function salvarManual(
  tenantSlug: string,
  dados: { titulo: string; conteudo: string }
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = createClient();
  
  // Verifica se já existe um manual para atualizar ou criar novo
  const { data: existente } = await supabase
    .from("manuais")
    .select("id")
    .eq("empresa_id", guard.empresaId)
    .maybeSingle();

  let error;
  if (existente) {
    ({ error } = await supabase
      .from("manuais")
      .update({
        titulo: dados.titulo,
        conteudo: dados.conteudo,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", existente.id));
  } else {
    ({ error } = await supabase.from("manuais").insert({
      empresa_id: guard.empresaId,
      titulo: dados.titulo,
      conteudo: dados.conteudo,
    }));
  }

  if (error) return { success: false, message: "Erro ao salvar manual." };

  revalidatePath(`/c/${tenantSlug}/portal/manual`);
  return { success: true, message: "Manual salvo com sucesso!" };
}
