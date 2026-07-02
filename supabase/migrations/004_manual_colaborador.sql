-- Migration 004: Manual do Colaborador
-- Permite que o RH publique um manual ou código de conduta para a empresa.
--
-- ⚠️ NOTA: esta funcionalidade foi posteriormente consolidada no módulo mais
-- completo "Documentos Corporativos" (ver migration 005), que cobre o mesmo
-- caso de uso (tipo 'manual_colaborador') e já possui tela de administração
-- funcional. A tabela abaixo é mantida por compatibilidade com bancos que já
-- a aplicaram, mas não deve ser usada em novas integrações — use
-- `documentos_corporativos` / `aceites_documentos` no lugar.

CREATE TABLE IF NOT EXISTS public.manuais (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo       text NOT NULL DEFAULT 'Manual do Colaborador',
  conteudo     text NOT NULL, -- Conteúdo em Markdown ou HTML
  atualizado_em timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.manuais ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "manuais_select_tenant" ON public.manuais
  FOR SELECT USING (empresa_id = public.get_empresa_id());

CREATE POLICY "manuais_manage_rh" ON public.manuais
  FOR ALL USING (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  )
  WITH CHECK (
    empresa_id = public.get_empresa_id()
    AND (public.is_rh_admin() OR public.is_super_admin())
  );
