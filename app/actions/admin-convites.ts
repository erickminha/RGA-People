"use server";

import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { checkRhAdmin } from "@/lib/auth/guards";
import { enviarEmailConvite } from "@/lib/email/resend";

export async function enviarConvite(formData: FormData) {
  const guard = await checkRhAdmin();
  if (!guard) {
    return { success: false, error: "Não autenticado ou sem permissão." };
  }

  const email = formData.get("email") as string;
  const nomeCompleto = formData.get("nomeCompleto") as string;
  const cargoId = formData.get("cargoId") as string;
  const tenantSlug = formData.get("tenantSlug") as string;

  // Validações
  if (!email || !nomeCompleto || !cargoId) {
    return { success: false, error: "Preencha todos os campos obrigatórios" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "E-mail inválido" };
  }

  const supabase = createClient();

  try {
    // Buscar a empresa pelo slug
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id, nome")
      .eq("slug", tenantSlug)
      .single();

    if (!empresa) {
      return { success: false, error: "Empresa não encontrada" };
    }

    // Verificar se já existe colaborador com esse email
    const { data: existente } = await supabase
      .from("perfis")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("empresa_id", empresa.id)
      .maybeSingle();

    if (existente) {
      return { success: false, error: "Já existe um colaborador com este e-mail nesta empresa." };
    }

    // Verificar se já há convite pendente válido
    const { data: conviteExistente } = await supabase
      .from("convites")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("empresa_id", empresa.id)
      .eq("usado", false)
      .gt("expira_em", new Date().toISOString())
      .maybeSingle();

    if (conviteExistente) {
      return { success: false, error: "Este e-mail já possui um convite pendente." };
    }

    // Gerar token único + validade 7 dias
    const token = randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Criar o convite no banco
    const { error: erroConvite } = await supabase
      .from("convites")
      .insert({
        email: email.toLowerCase(),
        token,
        cargo_id: cargoId,
        empresa_id: empresa.id,
        usado: false,
        expira_em: expiraEm.toISOString(),
      });

    if (erroConvite) {
      console.error("Erro ao criar convite:", erroConvite);
      return { success: false, error: "Erro ao criar convite: " + erroConvite.message };
    }

    // Montar link de convite
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    const linkConvite = `${siteUrl}/c/${tenantSlug}/convite/${token}`;

    // Enviar email via Resend
    const { error: emailError } = await enviarEmailConvite({
      para: email.toLowerCase(),
      nomeColaborador: nomeCompleto.trim(),
      nomeEmpresa: empresa.nome,
      linkConvite,
    });

    if (emailError) {
      // Convite foi criado no banco, mas email falhou — não bloqueia o fluxo
      console.error("Erro ao enviar email de convite:", emailError);
      return {
        success: true,
        message: `Convite criado para ${email}, mas o email não pôde ser enviado. Compartilhe o link manualmente: ${linkConvite}`,
      };
    }

    return {
      success: true,
      message: `Convite enviado com sucesso para ${email}`,
    };
  } catch (error) {
    console.error("Erro ao enviar convite:", error);
    return { success: false, error: "Erro interno ao enviar convite" };
  }
}
