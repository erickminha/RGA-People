# RGA People — Portal do Colaborador

Portal do Colaborador **SaaS B2B multi-tenant** da RGA Consultoria de RH. Centraliza, em um único lugar, os processos de gente e gestão de cada empresa cliente (tenant): manual do colaborador, avaliações, pesquisa de clima, férias, contracheques, benefícios e muito mais.

> Construído com **custo zero inicial**, **isolamento real de dados por empresa** (RLS no banco) e **sem vendor lock-in**.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript |
| Estilo / UI | Tailwind CSS + lucide-react + recharts |
| Backend / DB | Supabase (Postgres + Auth + Storage) |
| Validação | Zod |
| Deploy | Netlify (build com `@netlify/plugin-nextjs`) |

A arquitetura é **multi-tenant por rota**: cada empresa acessa o portal em `/c/{slug}/...` e o isolamento de dados é garantido por **Row Level Security (RLS)** no Postgres, filtrando tudo por `empresa_id`.

---

## Estrutura de pastas

```
app/
  c/[tenant_slug]/
    login/                 # Tela de login (Supabase Auth)
    portal/                # Área do colaborador
      clima/               # Responder pesquisa de clima (anônimo)
      ferias/ contracheques/ avaliacao/ beneficios/
      admin/               # Área restrita ao RH
        clima/             # Gerenciar pesquisas + resultados agregados
  api/auth/signout/        # Logout
  actions/                 # Server Actions (clima, férias, etc.)
components/modules/        # Componentes por módulo (admin, clima, ...)
lib/
  supabase/                # Clientes server e browser
  auth/guards.ts           # Guardas de permissão (RH, super admin)
  schemas/                 # Schemas Zod
supabase/migrations/       # Migrations SQL versionadas
supabase/seed.sql          # Dados iniciais opcionais
```

---

## Setup local

1. **Pré-requisitos:** Node 20+ e um projeto no [Supabase](https://supabase.com).

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente** (copie `.env.example` para `.env.local`):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
   ```

4. **Aplique o banco de dados** (no SQL Editor do Supabase, na ordem):
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_extensoes_hubs_3_6.sql
   supabase/migrations/003_pesquisa_clima.sql
   supabase/seed.sql            # opcional (cria a empresa "rga" e cargos)
   ```

5. **Rode o projeto:**
   ```bash
   npm run dev
   # acesse http://localhost:3000/c/rga/login
   ```

### Primeiro acesso (RH)

1. Crie um usuário em **Supabase → Authentication → Users → Add user**.
2. No SQL Editor, rode o bloco final do `supabase/seed.sql` (trocando o e-mail) para vincular o perfil ao cargo **RH** com permissão de administrador.
3. Faça login em `/c/rga/login`.

---

## Banco de dados e segurança (RLS)

Todas as tabelas de negócio possuem `empresa_id` e políticas RLS que garantem que um usuário **só enxerga dados da sua própria empresa**. Funções auxiliares no banco:

- `get_empresa_id()` — retorna a empresa do usuário autenticado;
- `is_rh_admin()` / `is_super_admin()` — checam permissões a partir do cargo.

**Pesquisa de Clima — anonimato estrutural:** as respostas (`respostas_clima`) **não** armazenam o id do colaborador. A participação é registrada numa tabela separada (`controle_participacao_clima`) apenas para impedir resposta dupla. Assim, o RH vê resultados agregados sem conseguir ligar uma resposta a uma pessoa.

---

## Módulos

| Módulo | Status | Quem usa |
| --- | --- | --- |
| Autenticação (login/logout) | ✅ Pronto | Todos |
| Dashboard de RH (KPIs + gráficos) | ✅ Pronto | RH |
| Pesquisa de Clima | ✅ Pronto | RH + Colaborador |
| Férias | ✅ Base existente | RH + Colaborador |
| Contracheques | ✅ Base existente | RH + Colaborador |
| Avaliações | ✅ Base existente | RH + Gestor + Colaborador |
| Benefícios | ✅ Base existente | RH + Colaborador |
| Manual do Colaborador / Código de Conduta | ⏳ Próximos | RH + Colaborador |
| Plano de Carreira / Cargos e Salários | ⏳ Próximos | RH + Colaborador |
| PDI / Universidade Corporativa | ⏳ Próximos | RH + Colaborador |
| POPs do RH / NR1 | ⏳ Próximos | RH + Colaborador |

---

## Deploy (Netlify)

O projeto já inclui `netlify.toml`. Para publicar:

1. Conecte o repositório no Netlify.
2. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Build command: `npm run build` · Publish: gerenciado pelo plugin Next.js.

Documentação complementar: [`README_CICD.md`](./README_CICD.md) e [`README_HUBS_3_6.md`](./README_HUBS_3_6.md).
