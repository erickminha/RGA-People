-- ============================================================
-- Migration 001: Schema inicial
-- Portal do Colaborador RGA - SaaS B2B Multi-tenant
-- ============================================================
-- Esta migration cria a base de dados do produto:
--   - empresas (tenants)
--   - cargos (papéis/permissões por empresa)
--   - perfis (colaboradores, 1:1 com auth.users)
--   - convites (onboarding por token)
--   - contracheques, ferias_solicitacoes, avaliacoes_desempenho
--   - beneficios, audit_logs
--
-- Todas as tabelas de domínio possuem coluna `empresa_id` e Row Level
-- Security (RLS) habilitada, garantindo o ISOLAMENTO MULTI-TENANT: cada
-- usuário só enxerga e manipula dados da sua própria empresa.
--
-- Padrão de segurança: funções SECURITY DEFINER (get_empresa_id, is_rh_admin,
-- is_super_admin) leem o perfil do usuário autenticado e são usadas nas
-- policies para decidir o acesso, evitando recursão de RLS.
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABELA: empresas (tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  cnpj         text,
  logo_url     text,
  ativo        boolean DEFAULT true,
  criado_em    timestamptz DEFAULT now()
);

COMMENT ON TABLE public.empresas IS 'Tenants do SaaS (empresas clientes da RGA).';

-- ============================================================
-- 2. TABELA: cargos (papéis e permissões por empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cargos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome         text NOT NULL,
  nivel        text,
  -- permissoes: { "super_admin": bool, "rh_admin": bool, "gestor": bool }
  permissoes   jsonb NOT NULL DEFAULT '{}'::jsonb,
  descricao_cargo jsonb,
  criado_em    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cargos_empresa ON public.cargos(empresa_id);

COMMENT ON TABLE public.cargos IS 'Cargos por empresa; campo permissoes define papéis (rh_admin, gestor, super_admin).';

-- ============================================================
-- 3. TABELA: perfis (colaboradores; 1:1 com auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.perfis (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cargo_id      uuid REFERENCES public.cargos(id) ON DELETE SET NULL,
  nome_completo text NOT NULL,
  email         text NOT NULL,
  telefone      text,
  foto_url      text,
  data_admissao date,
  salario       numeric(12,2),
  ativo         boolean DEFAULT true,
  criado_em     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfis_empresa ON public.perfis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_perfis_empresa_ativo ON public.perfis(empresa_id, ativo);

COMMENT ON TABLE public.perfis IS 'Colaboradores; vínculo 1:1 com auth.users via id.';

-- ============================================================
-- 4. TABELA: convites (onboarding por token)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.convites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email        text NOT NULL,
  token        text NOT NULL UNIQUE,
  cargo_id     uuid REFERENCES public.cargos(id) ON DELETE SET NULL,
  usado        boolean DEFAULT false,
  expira_em    timestamptz NOT NULL,
  criado_em    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_convites_empresa_usado
  ON public.convites(empresa_id, usado, expira_em);

-- ============================================================
-- 5. TABELA: contracheques
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracheques (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  perfil_id     uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  mes_ano       text NOT NULL, -- formato 'YYYY-MM'
  url_documento text NOT NULL, -- caminho no bucket "contracheques"
  criado_em     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracheques_perfil ON public.contracheques(perfil_id);
CREATE INDEX IF NOT EXISTS idx_contracheques_empresa ON public.contracheques(empresa_id);

-- ============================================================
-- 6. TABELA: ferias_solicitacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ferias_solicitacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  perfil_id     uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  data_inicio   date NOT NULL,
  data_fim      date NOT NULL,
  status        text NOT NULL DEFAULT 'pendente'
                CHECK (status IN ('pendente','aprovada','rejeitada','cancelada')),
  observacoes   text,
  criado_em     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ferias_perfil ON public.ferias_solicitacoes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_ferias_empresa_status
  ON public.ferias_solicitacoes(empresa_id, status);

-- ============================================================
-- 7. TABELA: avaliacoes_desempenho
-- ============================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes_desempenho (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  avaliado_id     uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  avaliador_id    uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  periodo         text NOT NULL, -- ex.: '2026-S1'
  auto_avaliacao  jsonb,
  feedback_gestor text,
  nota_final      numeric(4,2),
  criado_em       timestamptz DEFAULT now(),
  UNIQUE (avaliado_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_empresa ON public.avaliacoes_desempenho(empresa_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliado ON public.avaliacoes_desempenho(avaliado_id);

-- ============================================================
-- 8. TABELA: beneficios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.beneficios (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome         text NOT NULL,
  descricao    text,
  url_parceiro text,
  criado_em    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficios_empresa ON public.beneficios(empresa_id);

-- ============================================================
-- 9. TABELA: audit_logs (compliance / LGPD)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id   uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  acao         text NOT NULL,
  metadados    jsonb,
  criado_em    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_empresa ON public.audit_logs(empresa_id);

-- ============================================================
-- FUNÇÕES AUXILIARES (SECURITY DEFINER) — base das policies
-- ============================================================
-- Retornam atributos do usuário autenticado sem disparar RLS recursivo.

CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.perfis WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_rh_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (c.permissoes ->> 'rh_admin')::boolean
       FROM public.perfis p
       JOIN public.cargos c ON c.id = p.cargo_id
      WHERE p.id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (c.permissoes ->> 'super_admin')::boolean
       FROM public.perfis p
       JOIN public.cargos c ON c.id = p.cargo_id
      WHERE p.id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_gestor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (c.permissoes ->> 'gestor')::boolean
       FROM public.perfis p
       JOIN public.cargos c ON c.id = p.cargo_id
      WHERE p.id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- HABILITA RLS EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE public.empresas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracheques         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias_solicitacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_desempenho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: empresas
-- ============================================================
CREATE POLICY "empresa_select_propria" ON public.empresas
  FOR SELECT USING (id = public.get_empresa_id());

CREATE POLICY "empresa_update_super_admin" ON public.empresas
  FOR UPDATE USING (id = public.get_empresa_id() AND public.is_super_admin())
  WITH CHECK (id = public.get_empresa_id() AND public.is_super_admin());

-- ============================================================
-- POLICIES: cargos
-- ============================================================
CREATE POLICY "cargos_select_tenant" ON public.cargos
  FOR SELECT USING (empresa_id = public.get_empresa_id());

CREATE POLICY "cargos_manage_rh" ON public.cargos
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- ============================================================
-- POLICIES: perfis
-- ============================================================
-- Cada um vê o próprio perfil; RH/gestor/super_admin veem todos da empresa.
CREATE POLICY "perfis_select_tenant" ON public.perfis
  FOR SELECT USING (
    id = auth.uid()
    OR (
      empresa_id = public.get_empresa_id()
      AND (public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor())
    )
  );

-- O próprio colaborador atualiza dados pessoais limitados (foto/telefone).
CREATE POLICY "perfis_update_proprio" ON public.perfis
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RH gerencia perfis da empresa (cargo, salário, ativo, etc.).
CREATE POLICY "perfis_manage_rh" ON public.perfis
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- ============================================================
-- POLICIES: convites (apenas RH)
-- ============================================================
CREATE POLICY "convites_rh" ON public.convites
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- ============================================================
-- POLICIES: contracheques
-- ============================================================
CREATE POLICY "contracheques_select" ON public.contracheques
  FOR SELECT USING (
    perfil_id = auth.uid()
    OR (
      empresa_id = public.get_empresa_id()
      AND (public.is_rh_admin() OR public.is_super_admin())
    )
  );

CREATE POLICY "contracheques_manage_rh" ON public.contracheques
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- ============================================================
-- POLICIES: ferias_solicitacoes
-- ============================================================
-- Colaborador vê e cria as próprias; RH/gestor veem todas da empresa.
CREATE POLICY "ferias_select" ON public.ferias_solicitacoes
  FOR SELECT USING (
    perfil_id = auth.uid()
    OR (
      empresa_id = public.get_empresa_id()
      AND (public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor())
    )
  );

CREATE POLICY "ferias_insert_proprio" ON public.ferias_solicitacoes
  FOR INSERT WITH CHECK (
    perfil_id = auth.uid() AND empresa_id = public.get_empresa_id()
  );

-- Colaborador cancela a própria; RH/gestor aprovam/rejeitam.
CREATE POLICY "ferias_update_proprio" ON public.ferias_solicitacoes
  FOR UPDATE USING (perfil_id = auth.uid())
  WITH CHECK (perfil_id = auth.uid());

CREATE POLICY "ferias_update_gestao" ON public.ferias_solicitacoes
  FOR UPDATE USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor())
  );

-- ============================================================
-- POLICIES: avaliacoes_desempenho
-- ============================================================
CREATE POLICY "avaliacoes_select" ON public.avaliacoes_desempenho
  FOR SELECT USING (
    avaliado_id = auth.uid()
    OR (
      empresa_id = public.get_empresa_id()
      AND (public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor())
    )
  );

-- Colaborador envia/atualiza a própria auto-avaliação.
CREATE POLICY "avaliacoes_insert_proprio" ON public.avaliacoes_desempenho
  FOR INSERT WITH CHECK (
    avaliado_id = auth.uid() AND empresa_id = public.get_empresa_id()
  );

CREATE POLICY "avaliacoes_update_proprio" ON public.avaliacoes_desempenho
  FOR UPDATE USING (avaliado_id = auth.uid())
  WITH CHECK (avaliado_id = auth.uid());

-- Gestão (RH/gestor) registra feedback e notas.
CREATE POLICY "avaliacoes_update_gestao" ON public.avaliacoes_desempenho
  FOR UPDATE USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor())
  );

-- ============================================================
-- POLICIES: beneficios
-- ============================================================
CREATE POLICY "beneficios_select_tenant" ON public.beneficios
  FOR SELECT USING (empresa_id = public.get_empresa_id());

CREATE POLICY "beneficios_manage_rh" ON public.beneficios
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- ============================================================
-- POLICIES: audit_logs
-- ============================================================
-- Qualquer usuário autenticado da empresa pode inserir logs das próprias ações.
CREATE POLICY "audit_insert_tenant" ON public.audit_logs
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());

-- Apenas RH/super_admin leem a trilha de auditoria da empresa.
CREATE POLICY "audit_select_rh" ON public.audit_logs
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- ============================================================
-- TRIGGER: cria perfil automaticamente ao confirmar convite
-- ============================================================
-- Lê os metadados (empresa_id, cargo_id, nome_completo) gravados no convite
-- (admin.auth.admin.inviteUserByEmail) e materializa o perfil correspondente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_cargo_id   uuid;
  v_nome       text;
BEGIN
  v_empresa_id := NULLIF(NEW.raw_user_meta_data ->> 'empresa_id', '')::uuid;
  v_cargo_id   := NULLIF(NEW.raw_user_meta_data ->> 'cargo_id', '')::uuid;
  v_nome       := COALESCE(NEW.raw_user_meta_data ->> 'nome_completo', NEW.email);

  IF v_empresa_id IS NOT NULL THEN
    INSERT INTO public.perfis (id, empresa_id, cargo_id, nome_completo, email)
    VALUES (NEW.id, v_empresa_id, v_cargo_id, v_nome, NEW.email)
    ON CONFLICT (id) DO NOTHING;

    -- Marca eventual convite como usado
    UPDATE public.convites
       SET usado = true
     WHERE email = NEW.email AND empresa_id = v_empresa_id AND usado = false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
