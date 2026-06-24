-- Versão Final: Dados fictícios com colunas corretas
-- Empresa RGA (ID: 00000000-0000-0000-0000-000000000001)

-- 1. Cargos
INSERT INTO public.cargos (empresa_id, nome, nivel, permissoes)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Desenvolvedor Senior', 'Operacional', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Analista de Marketing', 'Operacional', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Gerente de Projetos', 'Liderança', '{"gestor": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- 2. Convites (Coluna convidado_por removida pois não existe no schema)
INSERT INTO public.convites (empresa_id, cargo_id, email, token, expira_em)
VALUES 
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Colaborador' LIMIT 1), 'joao.novo@exemplo.com', gen_random_uuid(), now() + interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Desenvolvedor Senior' LIMIT 1), 'beatriz.dev@exemplo.com', gen_random_uuid(), now() + interval '7 days')
ON CONFLICT DO NOTHING;

-- 3. Benefícios
INSERT INTO public.beneficios (empresa_id, nome, descricao, url_parceiro)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Gympass', 'Acesso a milhares de academias e estúdios.', 'https://gympass.com'),
  ('00000000-0000-0000-0000-000000000001', 'Auxílio Home Office', 'Ajuda de custo mensal para despesas de trabalho remoto.', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Seguro de Vida', 'Cobertura completa para você e seus dependentes.', NULL)
ON CONFLICT DO NOTHING;

-- 4. Manuais
INSERT INTO public.manuais (empresa_id, titulo, conteudo, ordem)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Nossa Cultura', 'Na RGA People, valorizamos a transparência e o crescimento mútuo...', 1),
  ('00000000-0000-0000-0000-000000000001', 'Código de Conduta', 'Respeito e ética são os pilares do nosso ambiente de trabalho...', 2)
ON CONFLICT DO NOTHING;
