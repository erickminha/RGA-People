# RGA People — Portal do Colaborador

Portal do Colaborador **SaaS B2B multi-tenant** da RGA Consultoria de RH. Centraliza, em um único lugar, os processos de gente e gestão de cada empresa cliente (tenant): manual do colaborador, avaliações, pesquisa de clima, férias, contracheques, benefícios e muito mais.

> Construído para **baixo custo inicial** e **isolamento multi-tenant via RLS**. As políticas têm testes locais; o ambiente Supabase ainda precisa ser homologado antes de usar dados reais.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| Estilo / UI | Tailwind CSS + lucide-react + recharts |
| Backend / DB | Supabase (Postgres + Auth + Storage) |
| Validação | Zod |
| Deploy | Netlify (build com `@netlify/plugin-nextjs`) |

A arquitetura é **multi-tenant por rota**: cada empresa acessa o portal em `/c/{slug}/...`; as políticas RLS filtram dados por `empresa_id`. A existência das políticas no código não substitui homologação em cada ambiente Supabase.

---

## Novas Funcionalidades Implementadas

Recentemente, as seguintes funcionalidades foram adicionadas ou aprimoradas para expandir as capacidades do portal:

*   **Gestão de Benefícios (Admin):** O RH agora pode cadastrar, editar e excluir benefícios oferecidos aos colaboradores, com uma interface dedicada para gerenciamento.
*   **Histórico de Férias (Admin):** Uma nova página administrativa permite ao RH visualizar e gerenciar o histórico completo de solicitações de férias de todos os colaboradores.
*   **Manual do Colaborador:** Um novo módulo foi adicionado, permitindo que o RH publique um manual ou código de conduta para a empresa, acessível pelos colaboradores. Inclui a criação da tabela `manuais` no banco de dados e as páginas de visualização e administração.
*   **Gestão de Contracheques (Admin):** Implementada a página de administração para que o RH possa visualizar e gerenciar os contracheques enviados.
*   **Dashboard do Colaborador:** A página inicial do portal (`/c/{slug}/portal`) foi restaurada e aprimorada, oferecendo um dashboard com cards de resumo para férias, contracheques, avaliações e benefícios, além de uma seção de comunicados.

---

## Estrutura de pastas

```
app/
  c/[tenant_slug]/
    login/                 # Tela de login (Supabase Auth)
    portal/                # Área do colaborador
      admin/               # Área restrita ao RH
        beneficios/        # Gestão de benefícios
        contracheques/     # Gestão de contracheques
        ferias/            # Histórico de férias
        clima/             # Gerenciar pesquisas + resultados agregados
      manual/              # Manual do colaborador
      clima/               # Responder pesquisa de clima (anônimo)
      ferias/              # Solicitar e ver férias
      contracheques/       # Ver contracheques
      avaliacao/           # Ver avaliações
      beneficios/          # Ver benefícios
  api/auth/signout/        # Logout
  actions/                 # Server Actions (clima, férias, benefícios, manual, etc.)
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

1.  **Pré-requisitos:** Node.js 24.18.0 e um projeto no [Supabase](https://supabase.com). Use a mesma versão indicada em `.nvmrc` e `netlify.toml`.

2.  **Instale as dependências:**
    ```bash
    npm ci
    ```

3.  **Configure as variáveis de ambiente** (copie `.env.example` para `.env.local`):
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
    ```

4.  **Aplique o banco de dados** (no SQL Editor do Supabase, na ordem):
    ```
    supabase/migrations/001_initial_schema.sql
    supabase/migrations/002_extensoes_hubs_3_6.sql
    supabase/migrations/003_pesquisa_clima.sql
    supabase/migrations/004_documentos_corporativos.sql  # Documentos corporativos + aceites
    supabase/migrations/005_fixes_seguranca.sql          # Fixes de segurança e corretude
    supabase/migrations/006_banco_talentos.sql           # ATS: vagas, candidatos e pipeline
    supabase/migrations/007_recrutamento_fase2.sql       # ATS: entrevistas, feedback e métricas
    supabase/migrations/008_teste_disc.sql               # Teste DISC + parecer com IA + PDF
    supabase/migrations/0085_manual_colaborador.sql      # Manual do colaborador
    supabase/migrations/009_protecao_producao.sql        # Acesso ativo, transições e integridade multi-tenant
    supabase/seed.sql            # opcional (cria a empresa "rga" e cargos)
    ```

> **Nota:** `0085_manual_colaborador.sql` substitui a migration local duplicada `004_manual_colaborador.sql`, usando versão única para execução automatizada. Ela recria suas políticas de forma idempotente para acomodar ambientes que já tenham aplicado a migration antiga. Faça backup e ensaie a sequência em uma cópia antes de aplicar em qualquer ambiente compartilhado.

> **Nota:** a `005_fixes_seguranca.sql` impede que metadados de cadastro escolham empresa/cargo. A `009_protecao_producao.sql` exige convite válido quando a conta declara um token, protege as transições e bloqueia o acesso de perfis/empresas inativos. Contas provisionadas manualmente continuam sem perfil até associação pelo RH.

> **Atenção:** a migration `009` é aditiva, mas deve ser ensaiada primeiro numa cópia da base. Ela pode falhar se houver manuais duplicados ou vínculos ATS entre empresas; investigue e corrija esses dados antes de aplicar. Convites de teste DISC pendentes há mais de sete dias expiram; gere um novo link após a migration.

5.  **Rode o projeto:**
    ```bash
    npm run dev
    # acesse http://localhost:3000/c/rga/login
    ```
    Testes locais: `npm test`. Antes de enviar alterações, execute também `npm run lint` e `npm run build`.

### Primeiro acesso (RH)

1.  Crie um usuário em **Supabase → Authentication → Users → Add user**.
2.  No SQL Editor, rode o bloco final do `supabase/seed.sql` (trocando o e-mail) para vincular o perfil ao cargo **RH** com permissão de administrador.
3.  Faça login em `/c/rga/login`.

### Proteção CAPTCHA

Configure o Turnstile nas configurações de CAPTCHA do Supabase Auth, usando a Site Key e Secret Key da Cloudflare. Configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no ambiente de build do Netlify. Login, recuperação de senha e aceitação de convite enviam o token ao Supabase uma única vez; não habilite somente o widget sem configurar a validação do Auth.

---

## Banco de dados e segurança (RLS)

As tabelas de negócio usam políticas RLS para limitar o acesso por empresa e perfil. A cobertura local não comprova o estado das policies em banco remoto. Funções auxiliares no banco:

-   `get_empresa_id()` — retorna a empresa do usuário autenticado;
-   `is_rh_admin()` / `is_super_admin()` — checam permissões a partir do cargo.

**Pesquisa de Clima:** respostas e participação são armazenadas em tabelas distintas, mas isso, por si só, não garante anonimato. O acesso às respostas, dados de grupos pequenos e texto livre ainda precisam de correção e aprovação do responsável por privacidade.

---

## Módulos

| Módulo | Status | Quem usa |
| --- | --- | --- |
| Autenticação (login/logout) | ✅ Pronto | Todos |
| Dashboard de RH (KPIs + gráficos) | ✅ Pronto | RH |
| Pesquisa de Clima | 🚧 Pendente de privacidade/homologação | RH + Colaborador |
| Férias | ✅ Pronto | RH + Colaborador |
| Contracheques | ✅ Pronto | RH + Colaborador |
| Avaliações | ✅ Base existente | RH + Gestor + Colaborador |
| Benefícios | ✅ Pronto | RH + Colaborador |
| Manual do Colaborador / Código de Conduta | ✅ Pronto | RH + Colaborador |
| Banco de Talentos (ATS) — Fase 1+2+3: vagas, pipeline, entrevistas, feedback, métricas e triagem IA | 🚧 Em evolução | RH + Gestor + Candidato (público) |
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
