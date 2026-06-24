-- Versão 3: Criar dados fictícios sem tentar desabilitar triggers de sistema
-- Empresa RGA (ID: 00000000-0000-0000-0000-000000000001)

-- 1. Criar Cargos Adicionais
INSERT INTO public.cargos (empresa_id, nome, nivel, permissoes)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Desenvolvedor Senior', 'Operacional', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Analista de Marketing', 'Operacional', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Gerente de Projetos', 'Liderança', '{"gestor": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- Nota: Como não podemos desabilitar a FK sem privilégios de superuser no Supabase Managed,
-- e não queremos criar usuários reais no Auth para demo, vamos focar nos dados que NÃO dependem de Auth.
-- Benefícios, Manuais, Cargos e Convites funcionam sem problemas.

-- 3. Criar Convites Pendentes
INSERT INTO public.convites (empresa_id, cargo_id, email, convidado_por, expira_em)
VALUES 
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Colaborador' LIMIT 1), 'joao.novo@exemplo.com', '7d0ab732-18b9-4841-a027-9f2697ff9a8e', now() + interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Desenvolvedor Senior' LIMIT 1), 'beatriz.dev@exemplo.com', '7d0ab732-18b9-4841-a027-9f2697ff9a8e', now() + interval '7 days')
ON CONFLICT DO NOTHING;

-- 4. Criar Benefícios Adicionais
INSERT INTO public.beneficios (empresa_id, nome, descricao, url_parceiro)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Gympass', 'Acesso a milhares de academias e estúdios.', 'https://gympass.com'),
  ('00000000-0000-0000-0000-000000000001', 'Auxílio Home Office', 'Ajuda de custo mensal para despesas de trabalho remoto.', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Seguro de Vida', 'Cobertura completa para você e seus dependentes.', NULL)
ON CONFLICT DO NOTHING;

-- 5. Criar Manuais de Exemplo
INSERT INTO public.manuais (empresa_id, titulo, conteudo, ordem)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Nossa Cultura', 'Na RGA People, valorizamos a transparência e o crescimento mútuo...', 1),
  ('00000000-0000-0000-0000-000000000001', 'Código de Conduta', 'Respeito e ética são os pilares do nosso ambiente de trabalho...', 2)
ON CONFLICT DO NOTHING;
