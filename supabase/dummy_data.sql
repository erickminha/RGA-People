-- Dados fictícios para demonstração do RGA People
-- Empresa RGA (ID: 00000000-0000-0000-0000-000000000001)

-- 1. Criar Cargos Adicionais se não existirem
INSERT INTO public.cargos (empresa_id, nome, nivel, permissoes)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Desenvolvedor Senior', 'Operacional', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Analista de Marketing', 'Operacional', '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Gerente de Projetos', 'Liderança', '{"gestor": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- 2. Criar Perfis Fictícios (Simulando usuários que já aceitaram convite)
-- Nota: IDs são aleatórios para demonstração visual na tabela perfis
INSERT INTO public.perfis (id, empresa_id, cargo_id, nome_completo, email, ativo)
VALUES 
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Desenvolvedor Senior' LIMIT 1), 'Ricardo Silva', 'ricardo.silva@exemplo.com', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Analista de Marketing' LIMIT 1), 'Ana Oliveira', 'ana.oliveira@exemplo.com', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Gerente de Projetos' LIMIT 1), 'Carlos Eduardo', 'carlos.edu@exemplo.com', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='RH' LIMIT 1), 'Mariana Costa', 'mariana.rh@exemplo.com', true)
ON CONFLICT DO NOTHING;

-- 3. Criar Convites Pendentes
INSERT INTO public.convites (empresa_id, cargo_id, email, convidado_por, expira_em)
VALUES 
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Colaborador' LIMIT 1), 'joao.novo@exemplo.com', '7d0ab732-18b9-4841-a027-9f2697ff9a8e', now() + interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM cargos WHERE nome='Desenvolvedor Senior' LIMIT 1), 'beatriz.dev@exemplo.com', '7d0ab732-18b9-4841-a027-9f2697ff9a8e', now() + interval '7 days')
ON CONFLICT DO NOTHING;

-- 4. Criar Solicitações de Férias
INSERT INTO public.ferias_solicitacoes (empresa_id, perfil_id, data_inicio, data_fim, status, observacoes)
VALUES 
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM perfis WHERE email='ricardo.silva@exemplo.com' LIMIT 1), current_date + interval '30 days', current_date + interval '45 days', 'pendente', 'Viagem em família'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM perfis WHERE email='ana.oliveira@exemplo.com' LIMIT 1), current_date - interval '10 days', current_date + interval '5 days', 'aprovado', 'Descanso anual'),
  ('00000000-0000-0000-0000-000000000001', (SELECT id FROM perfis WHERE email='carlos.edu@exemplo.com' LIMIT 1), current_date + interval '60 days', current_date + interval '75 days', 'rejeitado', 'Período de alta demanda no projeto X')
ON CONFLICT DO NOTHING;

-- 5. Criar Benefícios Adicionais
INSERT INTO public.beneficios (empresa_id, nome, descricao, url_parceiro)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Gympass', 'Acesso a milhares de academias e estúdios.', 'https://gympass.com'),
  ('00000000-0000-0000-0000-000000000001', 'Auxílio Home Office', 'Ajuda de custo mensal para despesas de trabalho remoto.', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Seguro de Vida', 'Cobertura completa para você e seus dependentes.', NULL)
ON CONFLICT DO NOTHING;

-- 6. Criar Manuais de Exemplo
INSERT INTO public.manuais (empresa_id, titulo, conteudo, ordem)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Nossa Cultura', 'Na RGA People, valorizamos a transparência e o crescimento mútuo...', 1),
  ('00000000-0000-0000-0000-000000000001', 'Código de Conduta', 'Respeito e ética são os pilares do nosso ambiente de trabalho...', 2)
ON CONFLICT DO NOTHING;
