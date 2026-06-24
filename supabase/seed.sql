-- ============================================================
-- SEED (opcional) — dados iniciais para desenvolvimento/demonstração
-- Portal do Colaborador RGA
-- ============================================================
-- Cria a empresa "rga" (slug usado no link padrão /c/rga/portal),
-- os cargos com permissões e alguns benefícios de exemplo.
--
-- COMO USAR (após aplicar 001/002/003):
--   psql "$DATABASE_URL" -f supabase/seed.sql
-- ou cole no SQL Editor do Supabase.
--
-- Para tornar um usuário RH_Admin: crie o usuário no Supabase Auth,
-- depois associe o perfil ao cargo "RH" (veja o final deste arquivo).
-- ============================================================

-- 1. Empresa (tenant) padrão
INSERT INTO public.empresas (id, nome, slug, ativo)
VALUES ('00000000-0000-0000-0000-000000000001', 'RGA Consultoria', 'rga', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Cargos com permissões
INSERT INTO public.cargos (empresa_id, nome, nivel, permissoes)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Super Administrador', 'Diretoria',
   '{"super_admin": true, "rh_admin": true, "gestor": true}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'RH', 'Especialista',
   '{"rh_admin": true}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Gestor', 'Liderança',
   '{"gestor": true}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Colaborador', 'Operacional',
   '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- 3. Benefícios de exemplo
INSERT INTO public.beneficios (empresa_id, nome, descricao, url_parceiro)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Plano de Saúde',
   'Cobertura nacional com rede credenciada ampla.', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Plano Odontológico',
   'Atendimento odontológico preventivo e curativo.', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Vale Refeição/Alimentação',
   'Crédito mensal para refeição e alimentação.', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Educação e Cursos',
   'Descontos em faculdades e plataformas parceiras.', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PROMOVER UM USUÁRIO A RH_ADMIN (execute após criar o login no Auth)
-- ============================================================
-- 1) Crie o usuário no Supabase Auth (Authentication > Users > Add user).
-- 2) Rode o bloco abaixo trocando o e-mail:
--
-- WITH u AS (SELECT id FROM auth.users WHERE email = 'rh@rga.com.br')
-- INSERT INTO public.perfis (id, empresa_id, cargo_id, nome_completo, email)
-- SELECT u.id,
--        '00000000-0000-0000-0000-000000000001',
--        (SELECT id FROM public.cargos
--           WHERE empresa_id='00000000-0000-0000-0000-000000000001'
--             AND nome='RH' LIMIT 1),
--        'Administrador RH',
--        'rh@rga.com.br'
-- FROM u
-- ON CONFLICT (id) DO UPDATE
--   SET cargo_id = EXCLUDED.cargo_id, empresa_id = EXCLUDED.empresa_id;
