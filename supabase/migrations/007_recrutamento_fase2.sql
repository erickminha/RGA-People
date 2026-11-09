-- ============================================================
-- Migration 007: Recrutamento Fase 2 - Entrevistas, Feedback e Métricas
-- Portal do Colaborador RGA - SaaS B2B Multi-tenant
-- ============================================================
-- Expande o ATS (006) com:
--   * entrevistas (agenda) por candidatura (várias por candidatura)
--   * feedback interno de avaliadores (RH/Gestor/Super)
--   * métricas calculadas por views/consultas (dashboard)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enum de status de entrevista
-- ------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.status_entrevista AS ENUM (
        'agendada',
        'confirmada',
        'realizada',
        'cancelada',
        'nao_compareceu'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------
-- 2. Tabela entrevistas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entrevistas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  candidatura_id   uuid NOT NULL REFERENCES public.candidaturas(id) ON DELETE CASCADE,
  titulo           text,               -- ex.: "Entrevista técnica"
  tipo             text,               -- rh | gestor | tecnica | admissional | cultura...
  data_hora        timestamptz NOT NULL,
  localizacao      text,               -- local físico, endereço ou "online"
  link_video       text,               -- URL para videoconferência (opcional)
  entrevistador_id uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  status           public.status_entrevista NOT NULL DEFAULT 'agendada',
  observacoes      text,
  criado_por       uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entrevistas_candidatura
  ON public.entrevistas(candidatura_id);
CREATE INDEX IF NOT EXISTS idx_entrevistas_empresa_data
  ON public.entrevistas(empresa_id, data_hora);

-- ------------------------------------------------------------
-- 3. Tabela feedbacks_candidatura
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedbacks_candidatura (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  candidatura_id   uuid NOT NULL REFERENCES public.candidaturas(id) ON DELETE CASCADE,
  autor_id         uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  nota             integer NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario       text NOT NULL,
  etapa_referencia text,               -- em que etapa do pipeline foi dado
  criado_em        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_candidatura
  ON public.feedbacks_candidatura(candidatura_id);

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------
-- Tabelas relacionadas a recrutamento: leitura para RH/Gestor/Super da
-- empresa; escrita limitada (ver funcionalidades por ação no servidor).
ALTER TABLE public.entrevistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks_candidatura ENABLE ROW LEVEL SECURITY;

-- Entrevistas: ler (RH/Gestor/Super); gerenciar (RH/Super).
CREATE POLICY "entrevistas_select_rh_gestor" ON public.entrevistas
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
  );

CREATE POLICY "entrevistas_manage_rh" ON public.entrevistas
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- Feedbacks: ler (RH/Gestor/Super); inserir (RH/Gestor/Super).
CREATE POLICY "feedbacks_select_rh_gestor" ON public.feedbacks_candidatura
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
  );

CREATE POLICY "feedbacks_insert_rh_gestor" ON public.feedbacks_candidatura
  FOR INSERT WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
    AND autor_id = auth.uid()
  );

-- ------------------------------------------------------------
-- 5. Trigger atualizado_em em candidaturas e entrevistas
-- (reutiliza handle_updated_at criada na migration 004)
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_candidaturas_updated_at ON public.candidaturas;
CREATE TRIGGER tr_candidaturas_updated_at
  BEFORE UPDATE ON public.candidaturas
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_entrevistas_updated_at ON public.entrevistas;
CREATE TRIGGER tr_entrevistas_updated_at
  BEFORE UPDATE ON public.entrevistas
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();