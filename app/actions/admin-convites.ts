"use server";

import { createClient } from "@/lib/supabase/server";

export async function enviarConvite(formData: FormData) {
  const supabase = createClient();

  // Validar sessão
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: "Não autenticado" };
  }

  // Validar permissões
  const { data: perfil } = await supabase
    .from("perfis")
    .select("*, cargo:cargos(*)")
    .eq("id", session.user.id)
    .single();

  if (!perfil?.cargo?.permissoes?.rh_admin && !perfil?.cargo?.permissoes?.super_admin) {
    return { success: false, error: "Sem permissão para enviar convites" };
  }

  const email = formData.get("email") as string;
  const nomeCompleto = formData.get("nomeCompleto") as string;
  const cargoId = formData.get("cargoId") as string;
  const tenantSlug = formData.get("tenantSlug") as string;

  // Validações
  if (!email || !nomeCompleto || !cargoId) {
    return { success: false, error: "Preencha todos os campos obrigatórios" };
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "E-mail inválido" };
  }

  try {
    // Buscar a empresa
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (!empresa) {
      return { success: false, error: "Empresa não encontrada" };
    }

    // Verificar se o convite já existe
    const { data: conviteExistente } = await supabase
      .from("convites")
      .select("id")
      .eq("email", email)
      .eq("empresa_id", empresa.id)
      .eq("status", "pendente")
      .single();

    if (conviteExistente) {
      return { success: false, error: "Este e-mail já possui um convite pendente" };
    }

    // Criar o convite
    const { data: novoConvite, error: erroConvite } = await supabase
      .from("convites")
      .insert({
        email: email.toLowerCase(),
        nome_completo: nomeCompleto.trim(),
        cargo_id: cargoId,
        empresa_id: empresa.id,
        status: "pendente",
        token: crypto.getRandomValues(new Uint8Array(32)).toString(),
      })
      .select()
      .single();

    if (erroConvite) {
      console.error("Erro ao criar convite:", erroConvite);
      return { success: false, error: "Erro ao enviar convite: " + erroConvite.message };
    }

    // TODO: Enviar e-mail com o link de convite
    // Por enquanto, apenas retornamos sucesso
    console.log(`Convite criado para ${email} na empresa ${empresa.id}`);

    return {
      success: true,
      message: `Convite enviado com sucesso para ${email}`,
    };
  } catch (error) {
    console.error("Erro ao enviar convite:", error);
    return { success: false, error: "Erro ao enviar convite" };
  }
}
