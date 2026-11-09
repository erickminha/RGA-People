-- ============================================================
-- Migration 008: Teste DISC (Banco de Talentos)
-- Portal do Colaborador RGA - SaaS B2B Multi-tenant
-- ============================================================
-- Após a entrevista na qual o candidato foi aprovado, o RH gera um link
-- (via WhatsApp) para o candidato responder ao teste DISC. As respostas,
-- os scores D/I/S/C e o parecer final (gerado com IA + fallback local) são
-- armazenados aqui; o PDF do parecer vai para o bucket "pareceres".
--
-- Fluxo:
--   enviado         : RH criou o teste e enviou o link (token = segredo)
--   respondido      : candidato enviou as respostas (via página pública)
--   parecer_gerado  : RH acionou a IA (ou fallback local) e o parecer existe
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enum de status do teste
-- ------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE public.status_teste_disc AS ENUM (
        'enviado',
        'respondido',
        'parecer_gerado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------
-- 2. Tabela testes_disc
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testes_disc (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  candidatura_id  uuid REFERENCES public.candidaturas(id) ON DELETE SET NULL,
  token           text NOT NULL UNIQUE,
  -- Dados pessoais coletados antes do teste (nome, idade, filhos, etc.)
  dados_pessoais  jsonb,
  -- Respostas: { "<pergunta_id>": { "<opcao>": valor } }
  respostas       jsonb,
  -- Scores calculados: { D, I, S, C }
  scores          jsonb,
  dominante       text,      -- D | I | S | C
  combinado       text,      -- ex.: D/I
  status          public.status_teste_disc NOT NULL DEFAULT 'enviado',
  criado_por      uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  enviado_em      timestamptz,
  respondido_em   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_testes_disc_empresa
  ON public.testes_disc(empresa_id);
CREATE INDEX IF NOT EXISTS idx_testes_disc_candidatura
  ON public.testes_disc(candidatura_id);
CREATE INDEX IF NOT EXISTS idx_testes_disc_token
  ON public.testes_disc(token);

-- ------------------------------------------------------------
-- 3. Tabela pareceres_disc
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pareceres_disc (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  teste_id         uuid NOT NULL REFERENCES public.testes_disc(id) ON DELETE CASCADE,
  comportamento    text,      -- comportamento esperado (até ~400 chars)
  avaliacao        text,      -- avaliação completa do perfil
  parecer_completo text,      -- texto completo p/ montar o PDF
  pdf_url          text,      -- path no bucket "pareceres"
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teste_id)
);

CREATE INDEX IF NOT EXISTS idx_pareceres_disc_empresa
  ON public.pareceres_disc(empresa_id);

-- ------------------------------------------------------------
-- 4. Storage: bucket "pareceres" (privado)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('pareceres', 'pareceres', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
-- Testes e pareceres estão atrelados a candidaturas de recrutamento:
-- RH, Gestor e Super da empresa leem; alterações controladas via Server
-- Actions (service role para submissão pública com token). Não há exposição
-- pública via RLS — o candidato acessa pelo token por página/API dedicada.
ALTER TABLE public.testes_disc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pareceres_disc ENABLE ROW LEVEL SECURITY;

-- Testes: leitura RH/Gestor/Super; gestão RH/Super.
CREATE POLICY "testes_disc_select_rh_gestor" ON public.testes_disc
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
  );

CREATE POLICY "testes_disc_manage_rh" ON public.testes_disc
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );

-- Pareceres: leitura RH/Gestor/Super; gestão RH/Super.
CREATE POLICY "pareceres_disc_select_rh_gestor" ON public.pareceres_disc
  FOR SELECT USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_gestor() OR public.is_super_admin())
  );

CREATE POLICY "pareceres_disc_manage_rh" ON public.pareceres_disc
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );