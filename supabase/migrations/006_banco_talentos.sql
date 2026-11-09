-- ============================================================
-- Migration 006: ATS - Recrutamento e Seleção (Banco de Talentos)
-- Portal do Colaborador RGA - SaaS B2B Multi-tenant
-- ============================================================
-- Módulo inspirado em cases como o Recrut.ai, adaptado ao multi-tenant.
-- Fase 1: Vagas, perfil de candidato (sem login) e candidaturas com pipeline.
-- Fase 2: feedback interno, entrevistas e métricas (colunas já previstas).
-- Fase 3: triagem/ranking com IA (OpenRouter) - campo match_score reservado.
--
-- Modelo:
--   vagas        - posições abertas cadastradas pelo RH
--   candidatos   - perfil único do candidato (email é a chave natural, permite
--                  candidatar-se a várias vagas reaproveitando o currículo)
--   candidaturas - vínculo candidato <-> vaga, com etapa do pipeline
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enums
-- ------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.status_vaga AS ENUM ('aberta', 'fechada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.etapa_candidatura AS ENUM (
        'nova',               -- recebida
        'triado',             -- triagem (humana ou IA na Fase 3)
        'entrevista_rh',      -- entrevista com RH
        'entrevista_gestor',  -- entrevista técnica/gestor
        'proposta',           -- proposta enviada
        'contratado',
        'recusado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------
-- 2. Tabela vagas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vagas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo         text NOT NULL,
  departamento   text,
  localizacao    text,
  modalidade     text,          -- presencial | hibrido | remoto
  descricao      text,
  requisitos     text,          -- requisitos/keywords p/ triagem (Fase 3)
  status         public.status_vaga NOT NULL DEFAULT 'aberta',
  criado_por     uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vagas_empresa
  ON public.vagas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vagas_status
  ON public.vagas(empresa_id, status);

-- ------------------------------------------------------------
-- 3. Tabela candidatos (perfil único por e-mail)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidatos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome           text NOT NULL,
  email          text,
  telefone       text,
  -- Currículo (path no bucket "curriculos")
  url_curriculo  text,
  arquivo_nome   text,
  arquivo_tipo   text,
  arquivo_tamanho bigint,
  fonte          text NOT NULL DEFAULT 'publico'
                 CHECK (fonte IN ('publico','rh','indicacao')),
  criado_por     uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
    atualizado_em  timestamptz NOT NULL DEFAULT now()
  );

  -- Índice único funcional: impede perfis duplicados (email case-insensitive)
  -- do mesmo candidato na mesma empresa.
  CREATE UNIQUE INDEX IF NOT EXISTS uq_candidatos_empresa_email
    ON public.candidatos (empresa_id, lower(email))
    WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidatos_empresa
  ON public.candidatos(empresa_id);

-- ------------------------------------------------------------
-- 4. Tabela candidaturas (candidato <-> vaga)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidaturas (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  vaga_id        uuid NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  candidato_id   uuid NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  etapa          public.etapa_candidatura NOT NULL DEFAULT 'nova',
  observacoes_rh text,
  -- Fase 2: feedback interno (avaliadores da própria empresa)
  data_entrevista timestamptz,
  -- Fase 3: pontuação de match gerada por triagem (humana ou IA)
  match_score     numeric(5,2),
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  -- Um candidato se candidata uma única vez por vaga
  UNIQUE (candidato_id, vaga_id)
);

CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga
  ON public.candidaturas(vaga_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga_etapa
  ON public.candidaturas(vaga_id, etapa);
CREATE INDEX IF NOT EXISTS idx_candidaturas_candidato
  ON public.candidaturas(candidato_id);

-- ------------------------------------------------------------
-- 5. Storage: bucket "curriculos" (privado)
-- Acesso por URL assinada (60s). Submissão pública e RH usam Service Role.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('curriculos', 'curriculos', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
-- vagas: colaboradores autenticados leem as abertas; RH gerencia tudo.
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vagas_select_tenant" ON public.vagas
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND status = 'aberta'
  );

CREATE POLICY "vagas_select_rh_tudo" ON public.vagas
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
  );

CREATE POLICY "vagas_manage_rh" ON public.vagas
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- candidatos: RH, Gestor e Super leem; perfil muda só via Service Action/RH.
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidatos_select_rh_gestor" ON public.candidatos
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
  );

CREATE POLICY "candidatos_manage_rh" ON public.candidatos
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- candidaturas: RH, Gestor e Super leem; alteração de etapa só RH.
ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "candidaturas_select_rh_gestor" ON public.candidaturas
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
  );

CREATE POLICY "candidaturas_manage_rh" ON public.candidaturas
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );