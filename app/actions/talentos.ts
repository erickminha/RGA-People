"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { checkRhAdmin } from "@/lib/auth/guards";
import {
  vagaSchema,
  candidaturaSchema,
  avancarEtapaSchema,
  entrevistaSchema,
  alterarStatusEntrevistaSchema,
  feedbackSchema,
} from "@/lib/schemas/candidato.schema";
import { randomUUID } from "crypto";
import { extrairTextoCurriculo } from "@/lib/ai/curriculo";
import { triarComIa } from "@/lib/ai/triagem";
import { extensaoDoArquivo, validarArquivoCurriculo } from "@/lib/talentos/curriculo";

interface ActionResult {
  success: boolean;
  message?: string;
  url?: string;
}

// ------------------------------------------------------------
// Utilitários
// ------------------------------------------------------------
async function empresaIdPorSlug(slug: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("empresas")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

// ============================================================
// VAGAS (CRUD - RH / Super)
// ============================================================
export async function criarVaga(tenantSlug: string, raw: Record<string, unknown>): Promise<ActionResult> {
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const parsed = vagaSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: first ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vagas").insert({
    empresa_id: guard.empresaId,
    titulo: parsed.data.titulo,
    departamento: parsed.data.departamento,
    localizacao: parsed.data.localizacao,
    modalidade: parsed.data.modalidade,
    descricao: parsed.data.descricao,
    requisitos: parsed.data.requisitos,
    status: parsed.data.status,
    criado_por: guard.userId,
  });

  if (error) {
    console.error("[talentos] criarVaga:", error.message);
    return { success: false, message: "Erro ao criar a vaga." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
  return { success: true, message: "Vaga criada." };
}

export async function atualizarVaga(
  tenantSlug: string,
  vagaId: string,
  raw: Record<string, unknown>
): Promise<ActionResult> {
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const parsed = vagaSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: first ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vagas")
    .update({
      titulo: parsed.data.titulo,
      departamento: parsed.data.departamento,
      localizacao: parsed.data.localizacao,
      modalidade: parsed.data.modalidade,
      descricao: parsed.data.descricao,
      requisitos: parsed.data.requisitos,
      status: parsed.data.status,
    })
    .eq("id", vagaId)
    .eq("empresa_id", guard.empresaId);

  if (error) {
    console.error("[talentos] atualizarVaga:", error.message);
    return { success: false, message: "Erro ao atualizar a vaga." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
  return { success: true, message: "Vaga atualizada." };
}

export async function excluirVaga(tenantSlug: string, vagaId: string): Promise<ActionResult> {
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = await createClient();
  // Candidaturas em cascata (ON DELETE CASCADE) removem vínculos.
  const { error } = await supabase
    .from("vagas")
    .delete()
    .eq("id", vagaId)
    .eq("empresa_id", guard.empresaId);

  if (error) {
    console.error("[talentos] excluirVaga:", error.message);
    return { success: false, message: "Erro ao excluir a vaga." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
  return { success: true, message: "Vaga excluída." };
}

// ============================================================
// SUBMISSÃO PÚBLICA (candidato sem conta, por vaga)
// A empresa é resolvida pelo slug; nunca confia em empresa_id do cliente.
// Perfil é deduplicado por e-mail dentro da empresa.
// ============================================================
export async function submitCandidatura(
  tenantSlug: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    vaga_id: (formData.get("vaga_id") as string) ?? "",
    nome: (formData.get("nome") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    telefone: (formData.get("telefone") as string) ?? "",
    observacoes: (formData.get("observacoes") as string) ?? "",
  };

  const parsed = candidaturaSchema.safeParse(raw);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, message: first ?? "Dados inválidos." };
  }

  const arquivo = (formData.get("curriculo") as File) ?? null;
  const checagem = await validarArquivoCurriculo(arquivo);
  if (!checagem.ok) return { success: false, message: checagem.msg };

  const empresaId = await empresaIdPorSlug(tenantSlug);
  if (!empresaId) return { success: false, message: "Empresa não encontrada." };

  const admin = createAdminClient();

  // Valida vaga aberta da empresa
  const { data: vaga, error: vagaError } = await admin
    .from("vagas")
    .select("id, status")
    .eq("id", parsed.data.vaga_id)
    .eq("empresa_id", empresaId)
    .maybeSingle();
  if (vagaError) {
    console.error("[talentos] vaga pública:", vagaError.message);
    return { success: false, message: "Não foi possível validar a vaga." };
  }
  if (!vaga || vaga.status !== "aberta") {
    return { success: false, message: "Vaga não disponível para candidatura." };
  }

  let candidatoExistente: { id: string } | null = null;
  if (parsed.data.email) {
    const { data: existente, error: candidatoError } = await admin
      .from("candidatos")
      .select("id")
      .eq("empresa_id", empresaId)
      .eq("email", parsed.data.email)
      .maybeSingle();
    if (candidatoError) {
      console.error("[talentos] consultar candidato:", candidatoError.message);
      return { success: false, message: "Não foi possível validar o cadastro." };
    }
    candidatoExistente = existente;
  }

  if (candidatoExistente) {
    const { data: candidaturaExistente, error: candidaturaError } = await admin
      .from("candidaturas")
      .select("id")
      .eq("candidato_id", candidatoExistente.id)
      .eq("vaga_id", parsed.data.vaga_id)
      .maybeSingle();
    if (candidaturaError) {
      console.error("[talentos] consultar candidatura:", candidaturaError.message);
      return { success: false, message: "Não foi possível verificar a candidatura." };
    }
    if (candidaturaExistente) {
      return { success: false, message: "Você já se candidatou a esta vaga." };
    }
    return {
      success: false,
      message: "Este e-mail já consta no banco de talentos. Entre em contato com o RH para confirmar a titularidade do cadastro antes de se candidatar novamente.",
    };
  }

  const caminho = `${empresaId}/${randomUUID()}.${extensaoDoArquivo(arquivo!.name)}`;
  const { error: upErr } = await admin.storage
    .from("curriculos")
    .upload(caminho, arquivo!, { contentType: arquivo!.type, upsert: false });
  if (upErr) {
    console.error("[talentos] upload:", upErr.message);
    return { success: false, message: "Falha ao enviar o currículo." };
  }

  const { data: novoCandidato, error: insErr } = await admin
    .from("candidatos")
    .insert({
      empresa_id: empresaId,
      nome: parsed.data.nome,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
      url_curriculo: caminho,
      arquivo_nome: arquivo!.name,
      arquivo_tipo: arquivo!.type,
      arquivo_tamanho: arquivo!.size,
      fonte: "publico",
    })
    .select("id")
    .single();
  if (insErr || !novoCandidato) {
    const { error: cleanupError } = await admin.storage.from("curriculos").remove([caminho]);
    if (cleanupError) console.error("[talentos] limpar upload órfão:", cleanupError.message);
    console.error("[talentos] insert perfil:", insErr?.message);
    return { success: false, message: "Não foi possível registrar o perfil. Tente novamente." };
  }

  const { error: candErr } = await admin.from("candidaturas").insert({
    empresa_id: empresaId,
    vaga_id: parsed.data.vaga_id,
    candidato_id: novoCandidato.id,
    etapa: "nova",
    observacoes_rh: parsed.data.observacoes ?? null,
  });
  if (candErr) {
    const { error: deleteError } = await admin.from("candidatos").delete().eq("id", novoCandidato.id);
    if (deleteError) console.error("[talentos] limpar candidato órfão:", deleteError.message);
    const { error: cleanupError } = await admin.storage.from("curriculos").remove([caminho]);
    if (cleanupError) console.error("[talentos] limpar upload órfão:", cleanupError.message);
    console.error("[talentos] insert candidatura:", candErr.message);
    return { success: false, message: "Erro ao registrar a candidatura." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
  return { success: true, message: "Candidatura recebida. Obrigado!" };
}

// ============================================================
// PIPELINE (RH/Super avança etapa; Gestor apenas lê)
// ============================================================
export async function avancarEtapa(
  tenantSlug: string,
  input: { candidatura_id: string; etapa: string }
): Promise<ActionResult> {
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const parsed = avancarEtapaSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Etapa inválida." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidaturas")
    .update({ etapa: parsed.data.etapa })
    .eq("id", parsed.data.candidatura_id)
    .eq("empresa_id", guard.empresaId);

  if (error) {
    console.error("[talentos] etapa:", error.message);
    return { success: false, message: "Erro ao atualizar o status." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
  return { success: true, message: "Etapa atualizada." };
}

export async function excluirCandidatura(
  tenantSlug: string,
  candidaturaId: string
): Promise<ActionResult> {
  const guard = await checkRhAdmin(tenantSlug);
  if (!guard) return { success: false, message: "Acesso negado." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidaturas")
    .delete()
    .eq("id", candidaturaId)
    .eq("empresa_id", guard.empresaId);

  if (error) {
    console.error("[talentos] excluir candidatura:", error.message);
    return { success: false, message: "Erro ao excluir." };
  }

  revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
  return { success: true, message: "Candidatura excluída." };
}

// ============================================================
// DOWNLOAD DO CURRÍCULO (RH, Super e Gestor — leitura)
// ============================================================
export async function baixarCurriculo(
  tenantSlug: string,
  candidatoId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sessão expirada." };

  const { data: perfil } = await supabase
    .from("perfis")
    .select("empresa_id, cargo:cargos!perfis_cargo_id_fkey(permissoes)")
    .eq("id", user.id)
    .single();

  const p = (perfil?.cargo as any)?.permissoes ?? {};
  const podeLer = p.rh_admin || p.super_admin || p.gestor;
  if (!perfil || !podeLer) return { success: false, message: "Acesso negado." };

  const { data: candidato } = await supabase
    .from("candidatos")
    .select("url_curriculo")
    .eq("id", candidatoId)
    .eq("empresa_id", perfil.empresa_id)
    .single();

  if (!candidato?.url_curriculo) {
    return { success: false, message: "Currículo não encontrado." };
  }

  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from("curriculos")
    .createSignedUrl(candidato.url_curriculo, 60);

  if (!signed?.signedUrl) {
    return { success: false, message: "Falha ao gerar o link de download." };
  }

  return { success: true, url: signed.signedUrl };
}

  // ============================================================
  // FASE 2 — ENTREVISTAS
  // ============================================================
  export async function agendarEntrevista(
    tenantSlug: string,
    raw: Record<string, unknown>
  ): Promise<ActionResult> {
    const guard = await checkRhAdmin(tenantSlug);
    if (!guard) return { success: false, message: "Acesso negado." };

    const parsed = entrevistaSchema.safeParse(raw);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, message: first ?? "Dados inválidos." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("entrevistas").insert({
      empresa_id: guard.empresaId,
      candidatura_id: parsed.data.candidatura_id,
      titulo: parsed.data.titulo,
      tipo: parsed.data.tipo,
      data_hora: new Date(parsed.data.data_hora).toISOString(),
      localizacao: parsed.data.localizacao,
      link_video: parsed.data.link_video,
      entrevistador_id: parsed.data.entrevistador_id,
      observacoes: parsed.data.observacoes,
      status: "agendada",
      criado_por: guard.userId,
    });

    if (error) {
      console.error("[talentos] agendarEntrevista:", error.message);
      return { success: false, message: "Erro ao agendar a entrevista." };
    }

    revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
    return { success: true, message: "Entrevista agendada." };
  }

  export async function atualizarEntrevista(
    tenantSlug: string,
    entrevistaId: string,
    raw: Record<string, unknown>
  ): Promise<ActionResult> {
    const guard = await checkRhAdmin(tenantSlug);
    if (!guard) return { success: false, message: "Acesso negado." };

    const parsed = entrevistaSchema.safeParse(raw);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, message: first ?? "Dados inválidos." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("entrevistas")
      .update({
        titulo: parsed.data.titulo,
        tipo: parsed.data.tipo,
        data_hora: new Date(parsed.data.data_hora).toISOString(),
        localizacao: parsed.data.localizacao,
        link_video: parsed.data.link_video,
        entrevistador_id: parsed.data.entrevistador_id,
        observacoes: parsed.data.observacoes,
      })
      .eq("id", entrevistaId)
      .eq("empresa_id", guard.empresaId);

    if (error) {
      console.error("[talentos] atualizarEntrevista:", error.message);
      return { success: false, message: "Erro ao atualizar a entrevista." };
    }

    revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
    return { success: true, message: "Entrevista atualizada." };
  }

  export async function alterarStatusEntrevista(
    tenantSlug: string,
    input: { entrevista_id: string; status: string }
  ): Promise<ActionResult> {
    const guard = await checkRhAdmin(tenantSlug);
    if (!guard) return { success: false, message: "Acesso negado." };

    const parsed = alterarStatusEntrevistaSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "Status inválido." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("entrevistas")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.entrevista_id)
      .eq("empresa_id", guard.empresaId);

    if (error) {
      console.error("[talentos] status entrevista:", error.message);
      return { success: false, message: "Erro ao atualizar o status." };
    }

    revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
    return { success: true, message: "Status atualizado." };
  }

  export async function excluirEntrevista(
    tenantSlug: string,
    entrevistaId: string
  ): Promise<ActionResult> {
    const guard = await checkRhAdmin(tenantSlug);
    if (!guard) return { success: false, message: "Acesso negado." };

    const supabase = await createClient();
    const { error } = await supabase
      .from("entrevistas")
      .delete()
      .eq("id", entrevistaId)
      .eq("empresa_id", guard.empresaId);

    if (error) {
      console.error("[talentos] excluir entrevista:", error.message);
      return { success: false, message: "Erro ao excluir a entrevista." };
    }

    revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
    return { success: true, message: "Entrevista excluída." };
  }

  // ============================================================
  // FASE 2 — FEEDBACK INTERNO (RH, Gestor e Super)
  // ============================================================
  export async function adicionarFeedback(
    tenantSlug: string,
    raw: Record<string, unknown>
  ): Promise<ActionResult> {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Sessão expirada." };

    // Autoriza RH, Gestor e Super Administrador (leitura+feedback de candidaturas)
    const { data: perfil } = await supabase
      .from("perfis")
      .select("empresa_id, cargo:cargos!perfis_cargo_id_fkey(permissoes)")
      .eq("id", user.id)
      .single();
    const p = (perfil?.cargo as any)?.permissoes ?? {};
    const autorizado = p.rh_admin || p.gestor || p.super_admin;
    if (!perfil || !autorizado) {
      return { success: false, message: "Acesso negado." };
    }

    const parsed = feedbackSchema.safeParse(raw);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      return { success: false, message: first ?? "Dados inválidos." };
    }

    // Garante que a candidatura pertence à mesma empresa do avaliador
    const { data: cand } = await supabase
      .from("candidaturas")
      .select("id")
      .eq("id", parsed.data.candidatura_id)
      .eq("empresa_id", perfil.empresa_id)
      .maybeSingle();
    if (!cand) return { success: false, message: "Candidatura não encontrada." };

    const { error } = await supabase.from("feedbacks_candidatura").insert({
      empresa_id: perfil.empresa_id,
      candidatura_id: parsed.data.candidatura_id,
      autor_id: user.id,
      nota: parsed.data.nota,
      comentario: parsed.data.comentario,
      etapa_referencia: parsed.data.etapa_referencia,
    });

    if (error) {
      console.error("[talentos] feedback:", error.message);
      return { success: false, message: "Erro ao registrar o feedback." };
    }

    revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
    return { success: true, message: "Feedback registrado." };
    }

    // ============================================================
    // FASE 3 — TRIAGEM DE CURRÍCULO COM IA (OpenRouter)
    // A chave é lida de process.env.OPENROUTER_API_KEY (cofre/secret).
    // Nunca é embutida no código nem exposta ao cliente.
    // ============================================================
    export async function triarCandidatura(
    tenantSlug: string,
    candidaturaId: string
    ): Promise<ActionResult> {
    const guard = await checkRhAdmin(tenantSlug);
    if (!guard) return { success: false, message: "Acesso negado." };

    const supabase = await createClient();

    // Candidatura + vaga + candidato (RLS limita à própria empresa)
    const { data: cand } = await supabase
      .from("candidaturas")
      .select(
        `id, empresa_id, vaga:vagas(requisitos), candidato:candidatos(url_curriculo, arquivo_tipo, arquivo_nome)`
      )
      .eq("id", candidaturaId)
      .eq("empresa_id", guard.empresaId)
      .single();

    if (!cand) return { success: false, message: "Candidatura não encontrada." };

    const requisitos = (cand.vaga as any)?.requisitos ?? null;
    const urlCurriculo = (cand.candidato as any)?.url_curriculo ?? null;
    const arquivoTipo = (cand.candidato as any)?.arquivo_tipo ?? null;
    const arquivoNome = (cand.candidato as any)?.arquivo_nome ?? "curriculo";

    if (!requisitos || !requisitos.trim()) {
      return { success: false, message: "Adicione requisitos à vaga para triar." };
    }
    if (!urlCurriculo) {
      return { success: false, message: "Candidato sem currículo vinculado." };
    }

    // Baixa o currículo do Storage (service role)
    const admin = createAdminClient();
    const { data: binario } = await admin.storage.from("curriculos").download(urlCurriculo);
    if (!binario) return { success: false, message: "Falha ao ler o currículo." };

    const buffer = Buffer.from(await binario.arrayBuffer());
    const texto = await extrairTextoCurriculo(buffer, arquivoTipo, arquivoNome);

    if (!texto.trim()) {
      return {
        success: false,
        message: "Não foi possível extrair texto do currículo (PDF/DOC/DOCX necessário).",
      };
    }

    let resultado;
    try {
      resultado = await triarComIa(requisitos, texto);
    } catch (e) {
      return { success: false, message: (e as Error).message };
    }

    if (!resultado) {
      return {
        success: false,
        message: "IA indisponível no momento. Verifique a OPENROUTER_API_KEY e o modelo.",
      };
    }

    const { error: updErr } = await supabase
      .from("candidaturas")
      .update({
        match_score: resultado.score,
        observacoes_rh: `[Triagem IA] ${resultado.resumo}`.slice(0, 1000),
      })
      .eq("id", candidaturaId)
      .eq("empresa_id", guard.empresaId);

    if (updErr) {
      console.error("[talentos] triagem update:", updErr.message);
      return { success: false, message: "Erro ao gravar a triagem." };
    }

    revalidatePath(`/c/${tenantSlug}/portal/admin/talentos`);
    return { success: true, message: `Match: ${resultado.score}/100` };
  }