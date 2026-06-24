"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";

interface ActionResult {
  success: boolean;
  message: string;
}

export async function criarBeneficio(
  tenantSlug: string,
  dados: { nome: string; descricao?: string; url_parceiro?: string }
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = createClient();
  const { error } = await supabase.from("beneficios").insert({
    empresa_id: guard.empresaId,
    nome: dados.nome,
    descricao: dados.descricao,
    url_parceiro: dados.url_parceiro,
  });

  if (error) return { success: false, message: "Erro ao criar benefício." };

  revalidatePath(`/c/${tenantSlug}/portal/admin/beneficios`);
  revalidatePath(`/c/${tenantSlug}/portal/beneficios`);
  return { success: true, message: "Benefício criado com sucesso!" };
}

export async function excluirBeneficio(
  tenantSlug: string,
  id: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin();
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = createClient();
  const { error } = await supabase
    .from("beneficios")
    .delete()
    .eq("id", id)
    .eq("empresa_id", guard.empresaId);

  if (error) return { success: false, message: "Erro ao excluir benefício." };

  revalidatePath(`/c/${tenantSlug}/portal/admin/beneficios`);
  revalidatePath(`/c/${tenantSlug}/portal/beneficios`);
  return { success: true, message: "Benefício excluído!" };
}
