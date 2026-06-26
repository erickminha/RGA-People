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
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Secret Key do Cloudflare Turnstile (secreta) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site (ex: `https://rgapeople.netlify.app`) |

## Configuração no Supabase

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
