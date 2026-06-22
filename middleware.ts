import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { Database } from './lib/supabase/database.types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const path = url.pathname;

  // Extrair o tenant_slug da URL (ex: /c/acme-corp/portal)
  const tenantMatch = path.match(/^\/c\/([^\/]+)/);
  const tenantSlug = tenantMatch ? tenantMatch[1] : null;

  // Lógica de Proteção de Rotas do Portal B2B
  if (path.includes('/(portal)') || path.endsWith('/portal') || path.includes('/dashboard')) {
    if (!user) {
      // Não autenticado: Redireciona para o login do tenant específico
      return NextResponse.redirect(new URL(tenantSlug ? `/c/${tenantSlug}/login` : '/', request.url));
    }
  }

  // Proteção do Super Admin (RGA Consultoria)
  if (path.startsWith('/saas-admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Aqui seria ideal consultar o perfil para verificar se a role é 'Super_Admin'
    // Mas para manter performático no middleware, faremos isso no layout do painel.
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
