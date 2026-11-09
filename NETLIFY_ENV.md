# Variáveis de Ambiente — Netlify

Configure as seguintes variáveis em **Netlify → Site Settings → Environment Variables**:

## Obrigatórias

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key do Supabase (secreta) |
| `RESEND_API_KEY` | Chave da API Resend para envio de emails |
| `RESEND_FROM_EMAIL` | Remetente dos emails (ex: `RGA People <noreply@rgapeople.com.br>`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site Key do Cloudflare Turnstile |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (ex: `https://rgapeople.netlify.app`) |

## Variáveis de IA — Triagem de Currículos (Opcional)

O módulo de Banco de Talentos pode triar currículos com IA (OpenRouter). Essas variáveis **não são obrigatórias** e **nunca** devem ser versionadas com valor real.

| Variável | Descrição |
|---|---|
| `OPENROUTER_API_KEY` | Chave de API do OpenRouter (secreta). Cadastre-a você mesmo no **Netlify → Site settings → Environment Variables** (marcar como *sensitive*) — nunca embutida no código. |
| `OPENROUTER_MODEL` | Modelo a usar (padrão: `openrouter/auto`). Opcional. |

> A chave só é lida no servidor, dentro de `lib/ai/triagem.ts`. Sem ela, o botão "Triar IA" retorna erro amigável sem vazar segredo.

## Configuração no Supabase

Configure o Turnstile também em **Authentication → Bot and Abuse Protection → CAPTCHA** (o nome da seção pode variar), informando o provedor Cloudflare Turnstile e sua Secret Key. A aplicação envia o token diretamente ao Supabase Auth: não valide o mesmo token previamente em outra rota, pois tokens CAPTCHA são de uso único.

No painel do Supabase, acesse **Authentication → URL Configuration** e configure:

- **Site URL**: `https://rgapeople.netlify.app`
- **Redirect URLs** (adicionar):
  - `https://rgapeople.netlify.app/c/*/redefinir-senha`
  - `https://rgapeople.netlify.app/c/*/convite/*`

## Configuração do Resend

No painel do Resend, certifique-se de que:
1. O domínio `rgapeople.com.br` está verificado (ou use o domínio padrão `@resend.dev` para testes)
2. A API Key está ativa

> **Nota**: Para testes iniciais, você pode usar `onboarding@resend.dev` como remetente até verificar o domínio.
