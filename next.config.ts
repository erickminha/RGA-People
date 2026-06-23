-- ============================================================
-- Migration 002: Extensões para os Hubs 3 ao 6
-- Portal do Colaborador RGA - SaaS B2B Multi-tenant
-- ============================================================
-- Esta migration adiciona colunas necessárias para o CRUD de
-- colaboradores (ativo, salario) implementado no Hub 6 (Admin RH).
-- ============================================================

-- 1. Coluna `ativo` em perfis (soft-delete)
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- 2. Coluna `salario` em perfis (edição pelo RH)
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS salario NUMERIC(12,2);

-- 3. Índice para acelerar listagem de colaboradores ativos por empresa
CREATE INDEX IF NOT EXISTS idx_perfis_empresa_ativo
  ON public.perfis(empresa_id, ativo);

-- 4. Índice para acelerar busca de convites pendentes
CREATE INDEX IF NOT EXISTS idx_convites_empresa_usado
  ON public.convites(empresa_id, usado, expira_em);

-- 5. Índice para acelerar listagem de férias pendentes por empresa
CREATE INDEX IF NOT EXISTS idx_ferias_empresa_status
  ON public.ferias_solicitacoes(empresa_id, status);

-- ============================================================
-- EXTENSÃO OPCIONAL: Ciclos e perguntas configuráveis pelo RH
-- Descomente o bloco abaixo se quiser suportar ciclos dinâmicos
-- de avaliação configuráveis na interface do RH.
-- ============================================================

-- CREATE TABLE IF NOT EXISTS public.ciclos_avaliacao (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
--   titulo TEXT NOT NULL,
--   periodo TEXT NOT NULL,
--   data_abertura DATE NOT NULL,
--   data_fechamento DATE NOT NULL,
--   ativo BOOLEAN DEFAULT TRUE,
--   criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );
--
-- ALTER TABLE public.ciclos_avaliacao ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Tenants can view their cycles" ON public.ciclos_avaliacao
--   FOR SELECT USING (empresa_id = public.get_empresa_id());
-- CREATE POLICY "RH/Super_Admin manage cycles" ON public.ciclos_avaliacao
--   FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()))
--   WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
--
-- CREATE TABLE IF NOT EXISTS public.perguntas_avaliacao (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   ciclo_id uuid REFERENCES public.ciclos_avaliacao(id) ON DELETE CASCADE NOT NULL,
--   empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
--   ordem INTEGER NOT NULL,
--   tipo TEXT NOT NULL CHECK (tipo IN ('escala', 'texto', 'escolha_unica', 'boolean')),
--   pergunta TEXT NOT NULL,
--   obrigatoria BOOLEAN DEFAULT TRUE,
--   config JSONB
-- );
--
-- ALTER TABLE public.perguntas_avaliacao ENABLE ROW LEVEL SECURITY;
--
-- -- Migrar coluna auto_avaliacao para JSONB (recomendado em produção)
-- ALTER TABLE public.avaliacoes_desempenho
--   ALTER COLUMN auto_avaliacao TYPE JSONB USING auto_avaliacao::JSONB;
