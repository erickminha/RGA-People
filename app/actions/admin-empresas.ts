"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { checkSuperAdmin } from "@/lib/auth/guards";

interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
  slug?: string;
}

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

/**
 * Cria uma nova empresa (tenant) no sistema.
 *
 * Só Super Admin pode criar empresas. Isso necessariamente cruza os limites
 * de RLS por tenant (a tabela `empresas` não tem policy de INSERT, e
 * `cargos` só permite INSERT para a própria empresa do usuário — de
 * propósito, para isolar tenants). Por isso usamos o client com Service
 * Role aqui, como já é feito para convites de colaboradores.
 */
export async function criarEmpresa(formData: FormData): Promise<ActionResult> {
  const guard = await checkSuperAdmin();
  if (!guard) {
    return { success: false, error: "Sem permissão para criar empresas." };
  }

  const nome = (formData.get("nome") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim() || null;

  if (!nome) {
    return { success: false, error: "Nome da empresa é obrigatório." };
  }

  const slug = gerarSlug(nome);
  if (!slug) {
    return {
      success: false,
      error: "Não foi possível gerar um slug válido a partir desse nome.",
    };
  }

  try {
    const admin = createAdminClient();

    // Verifica duplicidade de slug em TODAS as empresas (o client comum não
    // serviria aqui: RLS restringe leitura de `empresas` só à própria linha).
    const { data: empresaExistente } = await admin
      .from("empresas")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (empresaExistente) {
      return {
        success: false,
        error: `Já existe uma empresa com o slug "${slug}". Escolha um nome diferente.`,
      };
    }

    const { data: novaEmpresa, error: erroEmpresa } = await admin
      .from("empresas")
      .insert({ nome, slug, descricao, ativo: true })
      .select()
      .single();

    if (erroEmpresa || !novaEmpresa) {
      console.error("Erro ao criar empresa:", erroEmpresa);
      return {
        success: false,
        error: "Erro ao criar empresa: " + (erroEmpresa?.message ?? "desconhecido"),
      };
    }

    // Cargos padrão para a nova empresa
    const cargosPadrao = [
      {
        nome: "Super Administrador",
        empresa_id: novaEmpresa.id,
        permissoes: { super_admin: true, rh_admin: true, gestor: true },
      },
      {
        nome: "RH",
        empresa_id: novaEmpresa.id,
        permissoes: { rh_admin: true, gestor: true },
      },
      { nome: "Gestor", empresa_id: novaEmpresa.id, permissoes: { gestor: true } },
      { nome: "Colaborador", empresa_id: novaEmpresa.id, permissoes: {} },
    ];

    const { error: erroCargos } = await admin.from("cargos").insert(cargosPadrao);

    if (erroCargos) {
      console.error("Erro ao criar cargos padrão:", erroCargos);
      // A empresa já foi criada — não desfazemos, mas avisamos claramente,
      // já que sem cargos ninguém consegue ser convidado para ela ainda.
      return {
        success: true,
        message: `Empresa "${nome}" criada, mas houve um erro ao criar os cargos padrão. Configure os cargos manualmente antes de convidar colaboradores.`,
        slug,
      };
    }

    return {
      success: true,
      message: `Empresa "${nome}" criada com sucesso.`,
      slug,
    };
  } catch (error) {
    console.error("Erro inesperado ao criar empresa:", error);
    return { success: false, error: "Erro interno ao criar empresa." };
  }
}
