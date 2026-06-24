import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Encerra a sessão do usuário (logout) e redireciona para a página inicial.
 * Acionada pelo formulário POST no layout do portal.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  // Redirecionar para a página inicial
  return NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
}
