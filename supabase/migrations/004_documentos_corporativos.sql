-- ============================================================
-- Migration 004: Documentos Corporativos e Aceites Eletrônicos
-- Portal do Colaborador RGA - SaaS B2B Multi-tenant
-- ============================================================
-- Gerencia Manual do Colaborador, Código de Conduta, POPs, NR1, etc.
-- Suporta conteúdo em texto (Markdown) ou link para arquivo (PDF/Storage).
-- ============================================================

-- 1. Tipos de documentos permitidos
DO $$ BEGIN
    CREATE TYPE public.tipo_documento_corp AS ENUM (
        'manual_colaborador',
        'codigo_conduta',
        'pop_rh',
        'nr1',
        'plano_carreira',
        'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de documentos_corporativos
CREATE TABLE IF NOT EXISTS public.documentos_corporativos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo          public.tipo_documento_corp NOT NULL,
  titulo        text NOT NULL,
  descricao     text,
  conteudo_md   text,          -- Conteúdo em Markdown (opcional)
  arquivo_url   text,          -- URL do arquivo no storage (opcional)
  versao        integer NOT NULL DEFAULT 1,
  exigir_aceite boolean NOT NULL DEFAULT true,
  ativo         boolean NOT NULL DEFAULT true,
  criado_por    uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em     timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docs_empresa_tipo ON public.documentos_corporativos(empresa_id, tipo);

-- 3. Tabela de aceites_documentos
-- Registra a "assinatura eletrônica" do colaborador
CREATE TABLE IF NOT EXISTS public.aceites_documentos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id  uuid NOT NULL REFERENCES public.documentos_corporativos(id) ON DELETE CASCADE,
  perfil_id    uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  empresa_id    uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  versao_aceita integer NOT NULL,
  ip_origem     text,
  user_agent    text,
  aceito_em     timestamptz DEFAULT now(),
  
  -- Um colaborador só aceita uma versão específica uma única vez
  UNIQUE(documento_id, perfil_id, versao_aceita)
);

CREATE INDEX IF NOT EXISTS idx_aceites_perfil ON public.aceites_documentos(perfil_id);

-- 4. RLS
ALTER TABLE public.documentos_corporativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aceites_documentos       ENABLE ROW LEVEL SECURITY;

-- Documentos: Colaborador lê os ativos da empresa; RH gerencia tudo.
CREATE POLICY "docs_select_tenant" ON public.documentos_corporativos
  FOR SELECT USING (empresa_id = public.get_empresa_id() AND ativo = true);

CREATE POLICY "docs_manage_rh" ON public.documentos_corporativos
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- Aceites: Colaborador insere o próprio e lê o próprio; RH lê todos da empresa.
CREATE POLICY "aceite_insert_proprio" ON public.aceites_documentos
  FOR INSERT WITH CHECK (perfil_id = auth.uid());

CREATE POLICY "aceite_select_proprio" ON public.aceites_documentos
  FOR SELECT USING (
    perfil_id = auth.uid()
    OR (empresa_id = public.get_empresa_id() AND (public.is_rh_admin() OR public.is_super_admin()))
  );

-- 5. Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_docs_updated_at
  BEFORE UPDATE ON public.documentos_corporativos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
