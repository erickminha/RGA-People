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

## Novas Funcionalidades Implementadas

Recentemente, as seguintes funcionalidades foram adicionadas ou aprimoradas para expandir as capacidades do portal:

*   **Gestão de Benefícios (Admin):** O RH agora pode cadastrar, editar e excluir benefícios oferecidos aos colaboradores, com uma interface dedicada para gerenciamento.
*   **Histórico de Férias (Admin):** Uma nova página administrativa permite ao RH visualizar e gerenciar o histórico completo de solicitações de férias de todos os colaboradores.
*   **Documentos Corporativos e Aceite Eletrônico:** Módulo que permite ao RH publicar manual do colaborador, código de conduta, POPs, NR1 e outros documentos (em Markdown ou arquivo), com controle de versão e registro do aceite eletrônico de cada colaborador. Inclui páginas de visualização (`/portal/documentos`) e administração completa (`/portal/admin/documentos`).
*   **Gestão de Contracheques (Admin):** Implementada a página de administração para que o RH possa visualizar e gerenciar os contracheques enviados.
*   **Dashboard do Colaborador:** A página inicial do portal (`/c/{slug}/portal`) foi restaurada e aprimorada, oferecendo um dashboard com cards de resumo para férias, contracheques, avaliações e benefícios, além de uma seção de comunicados.

---

## Estrutura de pastas

```
app/
  c/[tenant_slug]/
    login/                 # Tela de login (Supabase Auth)
    convite/[token]/       # Aceite de convite de novo colaborador
    portal/                # Área do colaborador
      admin/               # Área restrita ao RH
        beneficios/        # Gestão de benefícios
        contracheques/     # Gestão de contracheques
        ferias/            # Histórico de férias
        clima/             # Gerenciar pesquisas + resultados agregados
        colaboradores/     # Listagem/convite de colaboradores
        documentos/        # Gestão de Documentos Corporativos (manual, código de conduta, POPs, NR1...)
        empresas/          # Gestão de empresas (apenas super admin)
      documentos/          # Ver e aceitar Documentos Corporativos (inclui Manual do Colaborador)
      clima/               # Responder pesquisa de clima (anônimo)
      ferias/              # Solicitar e ver férias
      contracheques/       # Ver contracheques
      avaliacao/           # Ver avaliações
      beneficios/          # Ver benefícios
  api/auth/signout/        # Logout
  api/turnstile/verify/    # Verificação server-side do captcha Cloudflare Turnstile
  actions/                 # Server Actions (clima, férias, benefícios, documentos, convites, etc.)
components/modules/        # Componentes por módulo (admin, clima, documentos, ...)
lib/
  supabase/                # Clientes server, browser e admin (service role)
  auth/guards.ts           # Guardas de permissão (RH, super admin)
  email/                   # Templates e cliente de e-mail transacional (Resend)
  schemas/                 # Schemas Zod
supabase/migrations/       # Migrations SQL versionadas
supabase/seed.sql          # Dados iniciais opcionais
```

> **Nota:** o antigo módulo "Manual do Colaborador" (rota `/portal/manual`, tabela `manuais`) foi
> consolidado dentro de **Documentos Corporativos** (`/portal/documentos`), que é mais completo
> (versionamento, tipos de documento, aceite eletrônico) e possui tela de administração funcional.
> A rota antiga permanece apenas como redirecionamento por compatibilidade.

---

## Setup local

1.  **Pré-requisitos:** Node 20+ e um projeto no [Supabase](https://supabase.com).

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente** (copie `.env.example` para `.env.local` e preencha todas):
    ```bash
    cp .env.example .env.local
    ```
    | Variável | Obrigatória para | Onde conseguir |
    | --- | --- | --- |
    | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tudo (Auth + dados) | Supabase → Settings → API |
    | `SUPABASE_SERVICE_ROLE_KEY` | Convites de colaboradores, ações administrativas | Supabase → Settings → API ⚠️ nunca expor no client |
    | `NEXT_PUBLIC_SITE_URL` | Links de convite/e-mail | URL pública do seu deploy |
    | `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Envio de e-mails (convites) | [resend.com](https://resend.com/api-keys) |
    | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Captcha em login/convite | Cloudflare Dashboard → Turnstile (crie um par **novo**, específico do seu projeto) |

4.  **Aplique o banco de dados** (no SQL Editor do Supabase, **nesta ordem**):
    ```
    supabase/migrations/001_initial_schema.sql
    supabase/migrations/002_extensoes_hubs_3_6.sql
    supabase/migrations/003_pesquisa_clima.sql
    supabase/migrations/004_manual_colaborador.sql       # legado, mantido por compatibilidade
    supabase/migrations/005_documentos_corporativos.sql  # módulo atual de Documentos/Manual
    supabase/seed.sql            # opcional (cria a empresa "rga" e cargos)
    ```

5.  **Rode o projeto:**
    ```bash
    npm run dev
    # acesse http://localhost:3000/c/rga/login
    ```

### Primeiro acesso (RH)

1.  Crie um usuário em **Supabase → Authentication → Users → Add user**.
2.  No SQL Editor, rode o bloco final do `supabase/seed.sql` (trocando o e-mail) para vincular o perfil ao cargo **RH** com permissão de administrador.
3.  Faça login em `/c/rga/login`.

---

## Banco de dados e segurança (RLS)

Todas as tabelas de negócio possuem `empresa_id` e políticas RLS que garantem que um usuário **só enxerga dados da sua própria empresa**. Funções auxiliares no banco:

-   `get_empresa_id()` — retorna a empresa do usuário autenticado;
-   `is_rh_admin()` / `is_super_admin()` — checam permissões a partir do cargo.

**Pesquisa de Clima — anonimato estrutural:** as respostas (`respostas_clima`) **não** armazenam o id do colaborador. A participação é registrada numa tabela separada (`controle_participacao_clima`) apenas para impedir resposta dupla. Assim, o RH vê resultados agregados sem conseguir ligar uma resposta a uma pessoa.

---

## Módulos

| Módulo | Status | Quem usa |
| --- | --- | --- |
| Autenticação (login/logout) | ✅ Pronto | Todos |
| Dashboard de RH (KPIs + gráficos) | ✅ Pronto | RH |
| Pesquisa de Clima | ✅ Pronto | RH + Colaborador |
| Férias | ✅ Pronto | RH + Colaborador |
| Contracheques | ✅ Pronto | RH + Colaborador |
| Avaliações | ✅ Base existente | RH + Gestor + Colaborador |
| Benefícios | ✅ Pronto | RH + Colaborador |
| Documentos Corporativos (Manual, Código de Conduta, POPs, NR1) + Aceite Eletrônico | ✅ Pronto | RH + Colaborador |
| Convites e cadastro de colaboradores | ✅ Pronto | RH |
| Plano de Carreira / Cargos e Salários | ⏳ Próximos | RH + Colaborador |
| PDI / Universidade Corporativa | ⏳ Próximos | RH + Colaborador |
| POPs do RH / NR1 | ⏳ Próximos | RH + Colaborador |

---

## Deploy (Netlify)

O projeto já inclui `netlify.toml`. Para publicar:

1.  Conecte o repositório no Netlify.
2.  Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3.  Build command: `npm run build` · Publish: gerenciado pelo plugin Next.js.

Documentação complementar: [`README_CICD.md`](./README_CICD.md) e [`README_HUBS_3_6.md`](./README_HUBS_3_6.md).
