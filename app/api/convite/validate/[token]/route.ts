import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/convite/validate/[token]
 *
 * Valida um token de convite usando o cliente Service Role (ignora RLS,
 * sem expor SELECT publico na policy de convites). Retorna os dados do convite
 * que a pagina de cadastro precisa.
 *
 * Respostas:
 *   200 { valid: true, convite: { email, empresa_id, cargo_id, empresa: {slug,nome} } }
 *   400 parametro invalido
 *   404 { valid: false }
 *   409 { valid: false, motivo: "usado" | "expirado" }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("convites")
    .select(
      `id, email, empresa_id, cargo_id, usado, expira_em,
       empresa:empresas!convites_empresa_id_fkey (slug, nome)`
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false }, { status: 404 });
  }

  if (data.usado) {
    return NextResponse.json({ valid: false, motivo: "usado" }, { status: 409 });
  }

  if (new Date(data.expira_em) < new Date()) {
    return NextResponse.json(
      { valid: false, motivo: "expirado" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    valid: true,
    convite: {
      email: data.email,
      empresa_id: data.empresa_id,
      cargo_id: data.cargo_id,
      empresa: data.empresa,
    },
  });
}