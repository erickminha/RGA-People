-- ============================================================
-- Migration 003: Pesquisa de Clima Organizacional
-- Portal do Colaborador RGA - SaaS B2B Multi-tenant
-- ============================================================
-- Modela pesquisas de clima/pulso configuráveis pelo RH e as respostas
-- ANÔNIMAS dos colaboradores. A anonimidade é estrutural: a tabela de
-- respostas NÃO armazena o id do colaborador, apenas a empresa, garantindo
-- que o RH veja resultados agregados sem identificar quem respondeu.
-- ============================================================

-- ============================================================
-- 1. pesquisas_clima (cabeçalho da pesquisa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pesquisas_clima (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo        text NOT NULL,
  descricao     text,
  status        text NOT NULL DEFAULT 'rascunho'
                CHECK (status IN ('rascunho','aberta','encerrada')),
  data_abertura   date,
  data_fechamento date,
  -- perguntas: array de objetos { id, tipo: 'escala'|'texto', texto, dimensao }
  perguntas     jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_por    uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clima_empresa_status
  ON public.pesquisas_clima(empresa_id, status);

-- ============================================================
-- 2. respostas_clima (respostas ANÔNIMAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.respostas_clima (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pesquisa_id  uuid NOT NULL REFERENCES public.pesquisas_clima(id) ON DELETE CASCADE,
  empresa_id   uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  -- respostas: { "<pergunta_id>": valor }
  respostas    jsonb NOT NULL,
  -- segmentos opcionais para análise agregada (sem identificar a pessoa)
  departamento text,
  criado_em    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_respostas_clima_pesquisa
  ON public.respostas_clima(pesquisa_id);

-- ============================================================
-- 3. controle_participacao_clima
-- ============================================================
-- Registra QUEM já participou (para impedir resposta dupla) SEM ligar a
-- pessoa à resposta. Mantém anonimato: aqui só sabemos "fulano respondeu",
-- não "o que fulano respondeu".
CREATE TABLE IF NOT EXISTS public.controle_participacao_clima (
  pesquisa_id  uuid NOT NULL REFERENCES public.pesquisas_clima(id) ON DELETE CASCADE,
  perfil_id    uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  respondido_em timestamptz DEFAULT now(),
  PRIMARY KEY (pesquisa_id, perfil_id)
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.pesquisas_clima              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_clima              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_participacao_clima  ENABLE ROW LEVEL SECURITY;

-- pesquisas_clima: colaborador vê as abertas da empresa; RH gerencia tudo.
CREATE POLICY "clima_select_tenant" ON public.pesquisas_clima
  FOR SELECT USING (empresa_id = public.get_empresa_id());

CREATE POLICY "clima_manage_rh" ON public.pesquisas_clima
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- respostas_clima: qualquer colaborador da empresa pode inserir (anônimo);
-- somente RH lê os dados agregados.
CREATE POLICY "respostas_insert_tenant" ON public.respostas_clima
  FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id());

CREATE POLICY "respostas_select_rh" ON public.respostas_clima
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- controle_participacao: o colaborador registra a própria participação;
-- ele lê apenas o próprio registro (para a UI saber se já respondeu).
CREATE POLICY "participacao_insert_proprio" ON public.controle_participacao_clima
  FOR INSERT WITH CHECK (perfil_id = auth.uid());

CREATE POLICY "participacao_select_proprio" ON public.controle_participacao_clima
  FOR SELECT USING (
    perfil_id = auth.uid()
    OR public.is_rh_admin()
    OR public.is_super_admin()
  );
