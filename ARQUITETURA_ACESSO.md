# Arquitetura de Acesso - RGA People

## 📋 Visão Geral

O RGA People é um portal **multi-tenant** onde diferentes perfis de usuário (Colaborador, RH, Administrador) acessam a **mesma URL base** mas veem interfaces e funcionalidades diferentes baseadas em suas permissões.

---

## 🔐 Modelo de Permissões (RBAC)

O sistema utiliza **Role-Based Access Control (RBAC)** com os seguintes perfis:

| Perfil | Permissões | Acesso |
|--------|-----------|--------|
| **Colaborador** | `{}` (vazio) | Dashboard pessoal, Férias, Contracheques, Benefícios, Avaliações, Clima, Manual |
| **Gestor** | `{"gestor": true}` | Tudo do Colaborador + Avaliações de sua equipe |
| **RH** | `{"rh_admin": true}` | Painel de Administração completo: Benefícios, Férias (todas), Contracheques, Clima, Colaboradores |
| **Super Admin** | `{"super_admin": true, "rh_admin": true, "gestor": true}` | Acesso total ao sistema |

---

## 🌐 Fluxo de Acesso

### 1. **Login Unificado**
- URL: `https://rgapeople.netlify.app/c/{empresa}/login`
- Todos os usuários (independente do perfil) acessam a mesma página de login
- Autenticação via Supabase Auth (email + senha)

### 2. **Dashboard Principal**
- URL: `https://rgapeople.netlify.app/c/{empresa}/portal`
- Após login bem-sucedido, o usuário é redirecionado para o dashboard
- O dashboard exibe informações personalizadas baseadas no perfil do usuário

### 3. **Menu Lateral Dinâmico**
O menu lateral (`app/c/[tenant_slug]/portal/layout.tsx`) é renderizado dinamicamente:

```
Menu Principal (todos veem):
├── Início
├── Pesquisa de Clima
├── Férias
├── Contracheques
├── Avaliações
├── Benefícios
└── Manual / Cultura

Administração (apenas RH vê):
└── Painel do RH
    ├── Benefícios (CRUD)
    ├── Férias (Aprovação/Rejeição)
    ├── Contracheques (Upload/Listagem)
    ├── Clima (Resultados)
    └── Colaboradores (Listagem)
```

---

## 👥 Experiência por Perfil

### **Colaborador**
**O que vê:**
- Dashboard com resumo de férias, contracheques, benefícios
- Pode solicitar férias
- Pode responder pesquisa de clima
- Pode visualizar benefícios disponíveis
- Pode ler o manual da empresa

**Não vê:**
- Menu de Administração
- Dados de outros colaboradores
- Painel de RH

**Rota de acesso:**
```
/c/rga/portal → Dashboard Colaborador
/c/rga/portal/ferias → Minhas Férias
/c/rga/portal/contracheques → Meus Contracheques
/c/rga/portal/beneficios → Benefícios da Empresa
/c/rga/portal/clima → Pesquisa de Clima
/c/rga/portal/manual → Manual da Empresa
```

---

### **RH / Administrador**
**O que vê:**
- Tudo que o Colaborador vê (como colaborador)
- Menu adicional "Painel do RH"
- Dashboard de KPIs (Total de colaboradores, Férias pendentes, Contracheques do mês, Avaliações em aberto, Índice de clima)
- Gráficos de análise

**Funcionalidades de Admin:**
- **Benefícios:** Criar, editar, deletar benefícios
- **Férias:** Visualizar todas as solicitações, aprovar/rejeitar, ver histórico completo
- **Contracheques:** Fazer upload de contracheques, visualizar listagem
- **Clima:** Ver resultados agregados da pesquisa (sem identificar respondentes)
- **Colaboradores:** Listar todos os colaboradores da empresa

**Rota de acesso:**
```
/c/rga/portal → Dashboard (com KPIs de RH)
/c/rga/portal/admin → Dashboard do RH (painel principal)
/c/rga/portal/admin/beneficios → Gerenciar Benefícios
/c/rga/portal/admin/ferias → Histórico de Férias
/c/rga/portal/admin/contracheques → Gerenciar Contracheques
/c/rga/portal/admin/clima → Resultados de Clima
/c/rga/portal/admin/colaboradores → Listar Colaboradores
```

---

## 🔒 Segurança e Validação

### **Middleware (`middleware.ts`)**
- Intercepta todas as requisições
- Verifica se o usuário está autenticado
- Se não autenticado e tenta acessar `/portal`, redireciona para `/login`
- Mantém a sessão via cookies do Supabase

### **Guards (`lib/auth/guards.ts`)**
- Funções auxiliares para validar permissões no servidor
- `is_rh_admin()` - Verifica se o usuário tem permissão de RH
- `is_super_admin()` - Verifica se o usuário é super administrador
- Usadas em Server Actions e páginas para bloquear acesso não autorizado

### **Row Level Security (RLS) no Supabase**
- Cada tabela de negócio tem coluna `empresa_id`
- Políticas RLS garantem que usuários só veem dados de sua empresa
- Exemplo: Um colaborador da empresa "rga" não consegue ver dados da empresa "acme"

---

## 🎯 Como Promover um Usuário a RH

1. **Criar o usuário no Supabase Auth:**
   - Acesse Supabase Dashboard → Authentication → Users
   - Clique "Add user"
   - Insira email e senha

2. **Associar ao cargo de RH:**
   - Abra o SQL Editor do Supabase
   - Execute o script do `supabase/seed.sql` (seção "PROMOVER UM USUÁRIO A RH_ADMIN")
   - Substitua o email pelo email do novo RH

3. **Verificar permissões:**
   - Faça login com a conta do novo RH
   - Você verá o link "Painel do RH" no menu lateral

---

## 📱 Fluxo de Autenticação Detalhado

```
1. Usuário acessa /c/rga/login
   ↓
2. Middleware verifica se está autenticado
   ├─ Se SIM → Redireciona para /c/rga/portal
   └─ Se NÃO → Permite acesso ao login
   ↓
3. Usuário insere email e senha
   ↓
4. Supabase Auth valida credenciais
   ├─ Se inválido → Mostra erro
   └─ Se válido → Cria sessão e cookie
   ↓
5. Usuário é redirecionado para /c/rga/portal
   ↓
6. Middleware verifica permissões
   ├─ Se RH → Mostra menu com "Painel do RH"
   └─ Se Colaborador → Mostra apenas menu de colaborador
   ↓
7. Dashboard é renderizado com dados personalizados
```

---

## 🛠️ Tratamento de Erros

### **Páginas de Erro Customizadas**

| Erro | Página | Comportamento |
|------|--------|---------------|
| 404 (Página não encontrada) | `app/c/[tenant_slug]/not-found.tsx` | Mostra mensagem amigável com botão "Voltar ao Portal" |
| 500 (Erro do servidor) | `app/c/[tenant_slug]/error.tsx` | Mostra mensagem de erro com opção "Tentar novamente" |
| Carregamento | `app/c/[tenant_slug]/portal/loading.tsx` | Mostra skeleton/loader enquanto a página carrega |

---

## 📊 Estrutura de Dados

### **Tabela: empresas**
```sql
id (UUID) → Identificador único
nome (TEXT) → Nome da empresa
slug (TEXT) → Slug para URL (ex: "rga")
ativo (BOOLEAN) → Se está ativa
```

### **Tabela: cargos**
```sql
id (UUID) → Identificador único
empresa_id (UUID) → Empresa a que pertence
nome (TEXT) → Nome do cargo (ex: "RH", "Colaborador")
nivel (TEXT) → Nível hierárquico
permissoes (JSONB) → Permissões do cargo
```

### **Tabela: perfis**
```sql
id (UUID) → ID do usuário (Supabase Auth)
empresa_id (UUID) → Empresa do usuário
cargo_id (UUID) → Cargo do usuário
nome_completo (TEXT) → Nome completo
email (TEXT) → Email
```

---

## 🚀 Deployment no Netlify

- **Build Command:** `npm run build`
- **Publish Directory:** Gerenciado pelo plugin `@netlify/plugin-nextjs`
- **Environment Variables:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (opcional, para operações de servidor)

---

## 📝 Resumo

O RGA People oferece uma experiência unificada onde:
- ✅ Todos acessam pela mesma URL
- ✅ Cada perfil vê apenas o que tem permissão
- ✅ Segurança garantida por RBAC + RLS
- ✅ Erros tratados de forma amigável
- ✅ Interface responsiva e intuitiva
