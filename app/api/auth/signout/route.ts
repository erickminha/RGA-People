import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Encerra a sessão do usuário (logout) e redireciona para a tela de login
 * do tenant correspondente. Acionada pelo formulário POST no layout do portal.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  // Tenta inferir o tenant a partir do referer (/c/<slug>/...)
  const referer = request.headers.get("referer") ?? "";
  const match = referer.match(/\/c\/([^/]+)/);
  const slug = match?.[1] ?? "rga";

  return NextResponse.redirect(new URL(`/c/${slug}/login`, request.url), {
    status: 303,
  });
}
