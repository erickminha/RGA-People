import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/turnstile/verify
 * Verifica o token Turnstile com a API da Cloudflare.
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const turnstileSecretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

    if (!turnstileSecretKey) {
      console.error(
        "[turnstile verify]: CLOUDFLARE_TURNSTILE_SECRET_KEY ausente no ambiente."
      );
      return NextResponse.json(
        { success: false, error: "Verificação de segurança indisponível." },
        { status: 500 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token ausente" },
        { status: 400 }
      );
    }

    // IP do cliente para validação extra
    const ip =
      request.headers.get("CF-Connecting-IP") ??
      request.headers.get("X-Forwarded-For") ??
      "unknown";

    const formData = new FormData();
    formData.append("secret", turnstileSecretKey);
    formData.append("response", token);
    formData.append("remoteip", ip);

    const cfResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const outcome = await cfResponse.json();

    if (!outcome.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Verificação de segurança falhou. Tente novamente.",
          codes: outcome["error-codes"],
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[turnstile verify]:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno na verificação" },
      { status: 500 }
    );
  }
}
