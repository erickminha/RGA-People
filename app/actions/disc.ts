"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";
import { randomBytes } from "crypto";
import {
  respostaTesteDiscSchema,
  type DadosPessoaisDiscInput,
} from "@/lib/schemas/disc.schema";
import { calcularScores, obterTipoDisc, validarRespostas, type RespostasDisc } from "@/lib/disc/score";
import { gerarComportamento, gerarAvaliacao } from "@/lib/ai/disc";
import { gerarParecerPdf } from "@/lib/pdf/parecerDisc";

interface ActionResult {
  success: boolean;
  message?: string;
  url?: string;
  testeId?: string;
}

type RespostasDiscInput = Record<string, Record<string, number>>;

// ============================================================
// CRIAR TESTE (RH/Super) — gera o link a ser enviado via WhatsApp
// ============================================================
export async function criarTesteDisc(
  tenantSlug: string,
  candidaturaId: string
): Promise<ActionResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) {
    return { success: false, message: "URL pública do sistema não configurada." };
  }

  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = await createClient();

  // Garante que a candidatura pertence à empresa
  const { data: cand } = await supabase
    .from("candidaturas")
    .select("id")
    .eq("id", candidaturaId)
    .eq("empresa_id", guard.empresaId)
    .maybeSingle();
  if (!cand) return { success: false, message: "Candidatura não encontrada." };

  // Impede criar duplicado se já houver teste ativo
  const { data: existente, error: existenteError } = await supabase
    .from("testes_disc")
    .select("id, token, status, expira_em, revogado_em")
    .eq("candidatura_id", candidaturaId)
    .eq("empresa_id", guard.empresaId)
    .eq("status", "enviado")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existenteError) {
    console.error("[disc] consultar teste pendente:", existenteError.message);
    return { success: false, message: "Não foi possível consultar os testes existentes." };
  }
  if (
    existente &&
    !existente.revogado_em &&
    new Date(existente.expira_em).getTime() > Date.now()
  ) {
    return {
      success: true,
      message: "Já existe um teste pendente para esta candidatura.",
      url: `${siteUrl}/c/${tenantSlug}/talentos/disc/${existente.token}`,
      testeId: existente.id,
    };
  }

  const token = randomBytes(32).toString("hex");
  const { data: novoTeste, error } = await supabase
    .from("testes_disc")
    .insert({
      empresa_id: guard.empresaId,
      candidatura_id: candidaturaId,
      token,
      status: "enviado",
      criado_por: guard.userId,
      enviado_em: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !novoTeste) {
    console.error("[disc] criarTeste:", error?.message);
    return { success: false, message: "Erro ao gerar o teste." };
  }

  const link = `${siteUrl}/c/${tenantSlug}/talentos/disc/${token}`;
  revalidatePath(`/c/${tenantSlug}/portal/talentos/${candidaturaId}`);
  return {
    success: true,
    message: "Teste criado. Copie o link e envie via WhatsApp.",
    url: link,
    testeId: novoTeste.id,
  };
}

// ============================================================
// RESPONDER TESTE (PÚBLICO, via token) — Service Role, sem RLS
// ============================================================
export async function responderTesteDisc(
  tenantSlug: string,
  raw: {
    token: string;
    dados_pessoais: DadosPessoaisDiscInput;
    respostas: RespostasDiscInput;
  }
): Promise<ActionResult> {
  const parsed = respostaTesteDiscSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: first ?? "Dados inválidos." };
  }

  // Valida a distribuição 4/3/2/1 por pergunta
  if (!validarRespostas(parsed.data.respostas as unknown as RespostasDisc)) {
    return {
      success: false,
      message: "Distribuição inválida. Use os valores 4, 3, 2 e 1 sem repetir em cada pergunta.",
    };
  }

  const admin = createAdminClient();

  const { data: empresa, error: empresaError } = await admin
    .from("empresas")
    .select("id")
    .eq("slug", tenantSlug)
    .maybeSingle();
  if (empresaError) {
    console.error("[disc] validar empresa:", empresaError.message);
    return { success: false, message: "Não foi possível validar o link." };
  }
  if (!empresa) return { success: false, message: "Link de teste inválido." };

  // Localiza o teste pelo token
  const { data: teste, error: testeError } = await admin
    .from("testes_disc")
    .select("id, empresa_id, status, expira_em, revogado_em")
    .eq("token", parsed.data.token)
    .maybeSingle();

  if (testeError) {
    console.error("[disc] consultar token:", testeError.message);
    return { success: false, message: "Não foi possível validar o teste." };
  }
  if (!teste) return { success: false, message: "Link de teste inválido." };
  if (teste.empresa_id !== empresa.id) return { success: false, message: "Link de teste inválido." };
  if (teste.revogado_em || new Date(teste.expira_em).getTime() <= Date.now()) {
    return { success: false, message: "Este link expirou. Solicite um novo ao RH." };
  }
  if (teste.status !== "enviado") {
    return { success: false, message: "Este teste já foi respondido." };
  }

  const scores = calcularScores(parsed.data.respostas as unknown as RespostasDisc);
  const tipo = obterTipoDisc(scores);

  const { data: atualizado, error } = await admin
    .from("testes_disc")
    .update({
      respostas: parsed.data.respostas,
      scores,
      dominante: tipo.dominante,
      combinado: tipo.combinado,
      dados_pessoais: parsed.data.dados_pessoais,
      status: "respondido",
      respondido_em: new Date().toISOString(),
    })
    .eq("id", teste.id)
    .eq("empresa_id", empresa.id)
    .eq("status", "enviado")
    .is("revogado_em", null)
    .gt("expira_em", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[disc] responder:", error.message);
    return { success: false, message: "Erro ao enviar as respostas." };
  }
  if (!atualizado) {
    return { success: false, message: "Este link já foi usado ou expirou." };
  }

  return { success: true, message: "Teste concluído. Obrigado!" };
}

// ============================================================
// GERAR PARECER (RH) — IA com fallback local
// ============================================================
export async function gerarParecerDisc(
  tenantSlug: string,
  testeId: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = await createClient();
  const { data: teste } = await supabase
    .from("testes_disc")
    .select("id, respostas, scores, dominante, combinado, status, dados_pessoais")
    .eq("id", testeId)
    .eq("empresa_id", guard.empresaId)
    .single();
  if (!teste) return { success: false, message: "Teste não encontrado." };
  if (teste.status !== "respondido" && teste.status !== "parecer_gerado") {
    return { success: false, message: "O candidato ainda não respondeu." };
  }

  const scores = teste.scores as { D: number; I: number; S: number; C: number };
  const combinado = (teste.combinado as string) || "D/I";
  const dominante = (teste.dominante as string) || "D";

  const comportamento = await gerarComportamento(dominante, scores);
  const avaliacao = await gerarAvaliacao(combinado, scores);

  const parecerCompleto = `Comportamento esperado:\n${comportamento}\n\n${avaliacao}`;

  const { data: parecer, error } = await supabase
    .from("pareceres_disc")
    .upsert({
      empresa_id: guard.empresaId,
      teste_id: testeId,
      comportamento,
      avaliacao,
      parecer_completo: parecerCompleto,
    }, { onConflict: "teste_id" })
    .select()
    .single();

  if (error) {
    console.error("[disc] parecer:", error.message);
    return { success: false, message: "Erro ao gerar o parecer." };
  }

  // Marca status do teste
  const { error: statusError } = await supabase
    .from("testes_disc")
    .update({ status: "parecer_gerado" })
    .eq("id", testeId)
    .eq("empresa_id", guard.empresaId);
  if (statusError) {
    console.error("[disc] status do parecer:", statusError.message);
    return { success: false, message: "O parecer foi salvo, mas não foi possível atualizar o status." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
  return { success: true, message: "Parecer gerado.", url: parecer.id };
}

// ============================================================
// GERAR / BAIXAR PDF DO PARECER (RH/Gestor)
// ============================================================
export async function gerarPdfDisc(
  tenantSlug: string,
  testeId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sessão expirada." };

  const { data: perfil } = await supabase
    .from("perfis")
    .select("empresa_id, empresa:empresas(nome, slug, ativo), cargo:cargos!perfis_cargo_id_fkey(permissoes)")
    .eq("id", user.id)
    .single();
  const p = (perfil?.cargo as any)?.permissoes ?? {};
    const podeLer = p.rh_admin === true || p.super_admin === true || p.gestor === true;
    const empresa = Array.isArray(perfil?.empresa) ? perfil.empresa[0] : perfil?.empresa;
    if (!perfil || !podeLer || !empresa || empresa.slug !== tenantSlug || empresa.ativo === false) {
    return { success: false, message: "Acesso negado." };
  }

  const { data: teste } = await supabase
    .from("testes_disc")
    .select(
      `id, dados_pessoais, candidatura_id, candidatura:candidaturas!testes_disc_candidatura_id_fkey(
        vaga:vagas(titulo), candidato:candidatos(nome)
      )`
    )
    .eq("id", testeId)
    .eq("empresa_id", perfil.empresa_id)
    .single();
  if (!teste) return { success: false, message: "Teste não encontrado." };

  const { data: parecer } = await supabase
    .from("pareceres_disc")
    .select("comportamento, avaliacao, parecer_completo")
    .eq("teste_id", testeId)
    .maybeSingle();
  if (!parecer) return { success: false, message: "Gere o parecer antes do PDF." };

  const dp = (teste.dados_pessoais ?? {}) as Record<string, string>;
  const candidatoNome = (teste.candidatura as any)?.candidato?.nome ?? dp.nome_completo ?? "Candidato";
  const cargo = (teste.candidatura as any)?.vaga?.titulo ?? dp.vaga ?? "";
  const empresaNome = empresa.nome ?? "";

  const pdfBuffer = await gerarParecerPdf({
    empresa: empresaNome,
    candidato: candidatoNome,
    cargo,
    observacoesEntrevista: "Dados de entrevista não registrados neste documento.",
    formacao: "Não informada no sistema.",
    historicoProfissional: "Não informado no sistema.",
    instrumentos: ["Questionário comportamental DISC"],
    analisePerfil: `${parecer.comportamento}\n\n${parecer.avaliacao}`,
    conclusao: "Este documento apresenta informações descritivas do questionário DISC. Não determina aprovação, aptidão ou decisão de seleção; a decisão cabe ao processo seletivo e à avaliação humana.",
  });

  const admin = createAdminClient();
  const caminho = `${perfil.empresa_id}/${testeId}.pdf`;
  const { error: upErr } = await admin.storage.from("pareceres").upload(caminho, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upErr) {
    console.error("[disc] pdf upload:", upErr.message);
    return { success: false, message: "Erro ao gerar o PDF." };
  }

  const { error: salvarUrlError } = await supabase
    .from("pareceres_disc")
    .update({ pdf_url: caminho })
    .eq("teste_id", testeId)
    .eq("empresa_id", perfil.empresa_id);
  if (salvarUrlError) {
    console.error("[disc] registrar PDF:", salvarUrlError.message);
    return { success: false, message: "O PDF foi gerado, mas não foi possível registrar o arquivo." };
  }

  const { data: signed } = await admin.storage.from("pareceres").createSignedUrl(caminho, 300);
  if (!signed?.signedUrl) return { success: false, message: "Falha ao gerar o link do PDF." };

  return { success: true, url: signed.signedUrl };
}