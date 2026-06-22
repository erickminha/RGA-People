# 🚀 Portal do Colaborador RGA — Hubs 3 a 6

Implementação completa dos **Módulos de Negócio** do Portal do Colaborador, um SaaS B2B multi-tenant da RGA Consultoria de RH, construído com **Next.js 14 (App Router)** + **Supabase**.

---

## 📦 Conteúdo desta entrega

| Hub | Módulo | Status |
|---|---|---|
| **3** | Contracheques e Benefícios | ✅ |
| **4** | Férias e Ponto | ✅ |
| **5** | Avaliação de Desempenho e Carreira | ✅ |
| **6** | Painel de Administração do RH | ✅ |

---

## 🗂️ Estrutura de pastas entregue

```
.
├── lib/
│   ├── auth/
│   │   └── guards.ts                          # Guard de permissões RH/Super Admin
│   ├── schemas/
│   │   ├── ferias.schema.ts                   # Validação Zod de férias
│   │   ├── avaliacao.schema.ts                # Validação Zod multi-step de avaliação
│   │   └── colaborador.schema.ts              # Validação Zod do CRUD de colaboradores
│   └── supabase/
│       └── admin.ts                           # Cliente Supabase Service Role
│
├── app/
│   ├── actions/
│   │   ├── contracheques.ts                   # Server Action download + audit
│   │   ├── ferias.ts                          # Solicitar / cancelar férias
│   │   ├── avaliacao.ts                       # Enviar auto-avaliação
│   │   ├── admin-colaboradores.ts             # Convidar / editar / inativar
│   │   └── admin-ferias.ts                    # Aprovar / rejeitar férias
│   │
│   └── c/[tenant_slug]/portal/
│       ├── contracheques/page.tsx
│       ├── beneficios/page.tsx
│       ├── ferias/page.tsx
│       ├── avaliacao/
│       │   ├── page.tsx                       # Lista de ciclos
│       │   └── [avaliacaoId]/page.tsx         # Formulário multi-step
│       └── admin/
│           ├── page.tsx                       # Dashboard RH
│           └── colaboradores/page.tsx         # CRUD de colaboradores
│
├── components/modules/
│   ├── contracheques/
│   │   └── ContrachequeList.tsx
│   ├── ferias/
│   │   ├── SaldoFeriasCards.tsx
│   │   ├── SolicitacaoFeriasForm.tsx
│   │   └── HistoricoFeriasTable.tsx
│   ├── avaliacao/
│   │   ├── CicloAvaliacaoCard.tsx
│   │   ├── AutoAvaliacaoForm.tsx
│   │   └── steps/
│   │       ├── StepIndicator.tsx
│   │       ├── StepCompetencias.tsx
│   │       ├── StepMetas.tsx
│   │       ├── StepDesenvolvimento.tsx
│   │       └── StepRevisao.tsx
│   └── admin/
│       ├── KpiCard.tsx
│       ├── AtalhosRapidos.tsx
│       ├── AprovacoesFeriasPendentes.tsx
│       ├── ColaboradoresTable.tsx
│       ├── ConvidarColaboradorModal.tsx
│       └── EditarColaboradorModal.tsx
│
├── supabase/migrations/
│   └── 002_extensoes_hubs_3_6.sql             # ALTER perfis + índices
│
├── .env.example
├── package.deps.json
└── README_HUBS_3_6.md                         # (este arquivo)
```

---

## ✅ Pré-requisitos (já existentes no projeto base)

- Next.js 14 com App Router configurado
- Tailwind CSS funcionando
- Supabase configurado com `@/lib/supabase/server.ts` e `@/lib/supabase/client.ts`
- Schema base aplicado (`001_initial_schema.sql`)
- Autenticação multi-tenant via `app/c/[tenant_slug]/...`

---

## 🛠️ Passo a passo de instalação

### 1️⃣ Copiar os arquivos para a raiz do projeto

Extraia o conteúdo deste ZIP **mantendo a estrutura de pastas** na raiz do seu projeto Git.

### 2️⃣ Instalar as dependências adicionais

```bash
npm install react-hook-form @hookform/resolvers zod react-hot-toast lucide-react date-fns
```

Ou com Yarn / pnpm — veja `package.deps.json`.

### 3️⃣ Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Atualize os valores:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Apenas no servidor**
- `NEXT_PUBLIC_SITE_URL`

### 4️⃣ Aplicar a migration SQL

No painel do Supabase Studio (SQL Editor) ou via CLI:

```bash
supabase db push
# ou aplicar manualmente o arquivo:
# supabase/migrations/002_extensoes_hubs_3_6.sql
```

### 5️⃣ Registrar o `<Toaster />` no layout principal

Adicione no arquivo `app/c/[tenant_slug]/portal/layout.tsx`:

```tsx
import { Toaster } from "react-hot-toast";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* ... seu Header, Sidebar etc. ... */}
      <main>{children}</main>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 4000 }}
      />
    </div>
  );
}
```

---

## 🧪 Checklist de validação pós-deploy

Acesse com um usuário autenticado e teste cada rota:

- [ ] `/c/{slug}/portal/contracheques` — Lista contracheques + botão Baixar PDF funciona
- [ ] `/c/{slug}/portal/beneficios` — Cards de benefícios aparecem
- [ ] `/c/{slug}/portal/ferias` — Saldo + formulário + histórico renderizam
- [ ] Solicitar férias com data inválida → mostra erro Zod
- [ ] `/c/{slug}/portal/avaliacao` — Lista de ciclos aparece
- [ ] `/c/{slug}/portal/avaliacao/2026-S1` — Formulário multi-step abre
- [ ] Auto-save: refresh na metade preserva dados (localStorage)
- [ ] `/c/{slug}/portal/admin` — Acesso negado para colaborador normal
- [ ] `/c/{slug}/portal/admin` — Dashboard com KPIs aparece para RH
- [ ] `/c/{slug}/portal/admin/colaboradores` — CRUD funciona (convidar, editar, inativar)

---

## 📤 Git: fluxo de envio recomendado

```bash
# 1. Criar branch de feature
git checkout -b feature/hubs-3-6

# 2. Adicionar todos os arquivos
git add .

# 3. Commit semântico
git commit -m "feat(portal): implementa Hubs 3-6 (Contracheques, Férias, Avaliação, Admin RH)

- Hub 3: Contracheques com signed URL + audit log
- Hub 4: Férias com RHF+Zod, validações CLT, fluxo de aprovação
- Hub 5: Auto-avaliação multi-step com auto-save em localStorage
- Hub 6: Painel RH com guards de permissão, KPIs, CRUD de colaboradores
- SQL: extensões em perfis (ativo, salario) + índices
- Deps: react-hook-form, zod, react-hot-toast, lucide-react"

# 4. Push para o repositório
git push origin feature/hubs-3-6

# 5. Abrir Pull Request no GitHub/GitLab
```

---

## 🔒 Notas de segurança

- ✅ Todas as Server Actions validam autenticação **antes** de qualquer operação
- ✅ `empresa_id` é validado **duplamente**: via guard + via `WHERE` no SQL
- ✅ RLS do Supabase já isola dados por tenant automaticamente
- ✅ `SUPABASE_SERVICE_ROLE_KEY` é usada **apenas** em `lib/supabase/admin.ts` (server-only)
- ✅ Todas as mutações administrativas geram registro em `audit_logs` (LGPD)
- ✅ Auto-proteção: RH não pode inativar a si mesmo

---

## 🎯 Extensões opcionais (não incluídas neste pacote)

Sugestões para evolução futura:

1. **Notificações em tempo real** com Supabase Realtime quando houver novas solicitações
2. **Upload de contracheques em lote** (CSV/ZIP) na tela admin
3. **Tabelas configuráveis de ciclos de avaliação** (SQL comentado em `002_extensoes_hubs_3_6.sql`)
4. **Testes E2E** com Playwright cobrindo o fluxo completo
5. **Export CSV/XLSX** de colaboradores e relatórios gerenciais
6. **Módulo de Ponto** com geolocalização gravando em `ponto_registros`

---

## 📝 Padrões adotados

- **Roteamento**: 100% dentro de `app/c/[tenant_slug]/portal/...`
- **Server Components** para fetch de dados (filtrados por RLS)
- **Server Actions** para mutações (com Zod no servidor)
- **Client Components** apenas onde há interatividade
- **Validação dupla**: cliente (RHF) + servidor (Zod safeParse)
- **Tratamento de erros** com toast (react-hot-toast)
- **Texto 100% em Português do Brasil**

---

Implementação entregue por **Copilot (Microsoft)** seguindo o protocolo de execução proposto.
