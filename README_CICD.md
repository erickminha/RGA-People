# 🔧 CI/CD & Governança Git — Portal do Colaborador RGA

Pacote complementar com configurações de **CI/CD no GitHub Actions**, **deploy automático no Vercel** e **templates de governança**.

---

## 📦 Arquivos incluídos

| Arquivo | Propósito |
|---|---|
| `.gitignore` | Ignora `node_modules`, `.env*`, `.next`, `.vercel` etc. |
| `.github/workflows/ci.yml` | Pipeline de qualidade (lint + typecheck + build) |
| `.github/workflows/deploy-preview.yml` | Deploy automático de preview em PRs |
| `.github/workflows/deploy-production.yml` | Deploy em produção ao mergear em `main` |
| `.github/PULL_REQUEST_TEMPLATE.md` | Template de PR em pt-BR |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Template de bug |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Template de feature |
| `.github/dependabot.yml` | Atualização semanal de dependências |
| `vercel.json` | Config do Vercel (região São Paulo + headers de segurança) |
| `.nvmrc` | Versão do Node.js (20) |
| `.editorconfig` | Padrão de indentação/encoding |
| `CONTRIBUTING.md` | Guia de contribuição |

---

## 🚀 Setup em 5 etapas

### 1️⃣ Extrair na raiz do projeto

```bash
unzip rga-people-cicd-extras.zip -d ./
```

### 2️⃣ Vincular o projeto ao Vercel

Instale a Vercel CLI e linke o projeto:

```bash
npm i -g vercel
vercel link
```

Isso cria a pasta `.vercel/` com `project.json` contendo `orgId` e `projectId`.

### 3️⃣ Obter os IDs do Vercel

```bash
cat .vercel/project.json
# {
#   "orgId": "team_xxxxx",
#   "projectId": "prj_xxxxx"
# }
```

### 4️⃣ Configurar Secrets no GitHub

Vá em **Settings → Secrets and variables → Actions → New repository secret** e adicione:

| Secret | Valor | Onde encontrar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role) | Supabase Dashboard → Settings → API ⚠️ |
| `NEXT_PUBLIC_SITE_URL` | `https://portal.rga.com.br` | URL pública do site |
| `VERCEL_TOKEN` | `xxx` | Vercel → Account → Tokens → Create |
| `VERCEL_ORG_ID` | `team_xxx` | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `prj_xxx` | `.vercel/project.json` |

### 5️⃣ Configurar as mesmas variáveis no painel do Vercel

**Vercel Dashboard → Project → Settings → Environment Variables**, adicione para **Production**, **Preview** e **Development**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (marcar como Sensitive)
- `NEXT_PUBLIC_SITE_URL`

---

## 🔄 Como funciona o fluxo

### Em qualquer branch (exceto main)
```
push → ci.yml → lint + typecheck + build
```

### Em Pull Request
```
PR aberto → ci.yml + deploy-preview.yml
                ↓
        🤖 Bot comenta URL de preview no PR
```

### Merge para main
```
push em main → deploy-production.yml
                ↓
        🚀 Deploy em produção + tag automática
```

---

## ⚙️ Configurações importantes do `vercel.json`

| Configuração | Valor | Motivo |
|---|---|---|
| `regions` | `["gru1"]` | São Paulo — latência mínima para usuários BR |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `Strict-Transport-Security` | 2 anos + preload | Força HTTPS |
| `Permissions-Policy` | bloqueia camera/mic | Hardening de privacidade |
| `git.deploymentEnabled.main` | `false` | Desabilita auto-deploy do Vercel (usamos GitHub Actions) |

> ⚠️ Se preferir o deploy automático nativo do Vercel (sem GitHub Actions), mude `"main": false` para `"main": true` e remova os workflows de deploy.

---

## 🛡️ Branch Protection (recomendado)

No GitHub: **Settings → Branches → Add rule** para `main`:

- ✅ Require a pull request before merging
- ✅ Require approvals: **1**
- ✅ Require status checks to pass:
  - `Lint, Type Check & Build`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

---

## 🧪 Rodar localmente

```bash
# 1. Use a versão correta do Node
nvm use

# 2. Instale deps
npm ci

# 3. Configure .env.local (copie de .env.example)
cp .env.example .env.local

# 4. Rode o dev server
npm run dev
```

Acesse: http://localhost:3000

---

## 📊 Monitoramento sugerido (próximos passos)

- **Sentry** para tracking de erros em produção
- **Vercel Analytics** (já incluso no plano Pro)
- **Supabase Logs** para auditoria de queries
- **Uptime Robot** ou **Better Stack** para uptime monitoring

---

## 🆘 Troubleshooting

### CI falha com "command not found: tsc"
→ Verifique se `typescript` está em `devDependencies` do `package.json`

### Deploy preview não comenta no PR
→ Verifique se `VERCEL_TOKEN` tem escopo de leitura/escrita no projeto

### Vercel reclama de variáveis ausentes
→ Adicione as variáveis tanto nos **Secrets do GitHub** quanto nas **Environment Variables do Vercel**

### Dependabot abre muitos PRs
→ Ajuste `open-pull-requests-limit` em `.github/dependabot.yml`

---

Implementado por **Copilot (Microsoft)** seguindo melhores práticas de DevOps para Next.js + Vercel.
