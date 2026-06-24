"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Função auxiliar para gerar slug a partir do nome
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .trim();
}

export async function criarEmpresa(formData: FormData) {
  const supabase = createClient();
  
  // Validar sessão
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Não autenticado");
  }

  // Validar permissões
  const { data: perfil } = await supabase
    .from("perfis")
    .select("cargo:cargos(*)")
    .eq("id", session.user.id)
    .single();

  if (!perfil?.cargo?.permissoes?.super_admin) {
    throw new Error("Sem permissão para criar empresas");
  }

  const nome = formData.get("nome") as string;
  const descricao = formData.get("descricao") as string;

  if (!nome || nome.trim().length === 0) {
    throw new Error("Nome da empresa é obrigatório");
  }

  // Gerar slug automaticamente
  const slug = gerarSlug(nome);

  // Verificar se slug já existe
  const { data: empresaExistente } = await supabase
    .from("empresas")
    .select("id")
    .eq("slug", slug)
    .single();

  if (empresaExistente) {
    throw new Error(`Uma empresa com o slug "${slug}" já existe`);
  }

  // Criar empresa
  const { data: novaEmpresa, error } = await supabase
    .from("empresas")
    .insert({
      nome: nome.trim(),
      slug,
      descricao: descricao?.trim() || null,
      ativo: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar empresa:", error);
    throw new Error("Erro ao criar empresa: " + error.message);
  }

  // Redirecionar para a página de gestão de empresas
  redirect(`/c/rga/portal/admin/empresas`);
}
