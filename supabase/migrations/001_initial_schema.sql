-- Habilitar RLS por padrão
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponto_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias_solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_desempenho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas_internas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares para RLS
CREATE OR REPLACE FUNCTION public.get_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (current_setting(
    'app.empresa_id',
    TRUE
  )::uuid);
END;
$$;

-- Tabela de Empresas (Tenants)
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  logo TEXT,
  cor_primaria TEXT,
  cor_secundaria TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para empresas: Apenas super_admin pode ver todas as empresas, outros apenas a sua
CREATE POLICY "Super admins can view all companies." ON public.empresas FOR SELECT USING (is_super_admin());
CREATE POLICY "Tenants can view their own company." ON public.empresas FOR SELECT USING (id = public.get_empresa_id());
CREATE POLICY "Super admins can insert companies." ON public.empresas FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Super admins can update companies." ON public.empresas FOR UPDATE USING (is_super_admin());
CREATE POLICY "Super admins can delete companies." ON public.empresas FOR DELETE USING (is_super_admin());

-- Tabela de Perfis de Usuários
CREATE TABLE public.perfis (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome_completo TEXT NOT NULL,
  avatar_url TEXT,
  cargo_id uuid REFERENCES public.cargos(id),
  email TEXT UNIQUE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para perfis: Usuários podem ver e editar seu próprio perfil, RH/Gestor podem ver perfis da sua empresa, Super_Admin todos
CREATE POLICY "Users can view and update their own profile." ON public.perfis FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "RH/Gestor can view profiles in their company." ON public.perfis FOR SELECT USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_gestor()));
CREATE POLICY "Super admins can manage all profiles." ON public.perfis FOR ALL USING (is_super_admin());

-- Tabela de Cargos (Roles)
CREATE TABLE public.cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  nivel TEXT,
  permissoes JSONB DEFAULT 
    '{"colaborador": true, "gestor": false, "rh_admin": false, "super_admin": false}'::jsonb,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para cargos: Apenas RH/Super_Admin podem gerenciar cargos da sua empresa
CREATE POLICY "RH/Super_Admin can manage roles in their company." ON public.cargos FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin())) WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can manage all roles." ON public.cargos FOR ALL USING (is_super_admin());

-- Tabela de Convites
CREATE TABLE public.convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para convites: Apenas RH/Super_Admin podem gerenciar convites da sua empresa
CREATE POLICY "RH/Super_Admin can manage invitations in their company." ON public.convites FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin())) WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can manage all invitations." ON public.convites FOR ALL USING (is_super_admin());

-- Tabela de Logs de Auditoria
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acao TEXT NOT NULL,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadados JSONB
);

-- RLS para audit_logs: Apenas RH/Super_Admin podem ver logs da sua empresa
CREATE POLICY "RH/Super_Admin can view audit logs in their company." ON public.audit_logs FOR SELECT USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can view all audit logs." ON public.audit_logs FOR SELECT USING (is_super_admin());
CREATE POLICY "Any authenticated user can insert audit logs." ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Tabela de Notícias Corporativas
CREATE TABLE public.noticias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  publicado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  autor_id uuid REFERENCES public.perfis(id) ON DELETE SET NULL
);

-- RLS para noticias: Todos da empresa podem ver, RH/Super_Admin podem gerenciar
CREATE POLICY "Users can view news in their company." ON public.noticias FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "RH/Super_Admin can manage news in their company." ON public.noticias FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin())) WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can manage all news." ON public.noticias FOR ALL USING (is_super_admin());

-- Tabela de Contracheques
CREATE TABLE public.contracheques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  mes_ano TEXT NOT NULL,
  url_documento TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para contracheques: Usuário pode ver seu próprio, RH/Super_Admin podem ver da sua empresa
CREATE POLICY "Users can view their own paychecks." ON public.contracheques FOR SELECT USING (perfil_id = auth.uid());
CREATE POLICY "RH/Super_Admin can view paychecks in their company." ON public.contracheques FOR SELECT USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can view all paychecks." ON public.contracheques FOR SELECT USING (is_super_admin());
CREATE POLICY "RH/Super_Admin can insert paychecks." ON public.contracheques FOR INSERT WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "RH/Super_Admin can update paychecks." ON public.contracheques FOR UPDATE USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "RH/Super_Admin can delete paychecks." ON public.contracheques FOR DELETE USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));

-- Tabela de Benefícios
CREATE TABLE public.beneficios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  url_parceiro TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para beneficios: Todos da empresa podem ver, RH/Super_Admin podem gerenciar
CREATE POLICY "Users can view benefits in their company." ON public.beneficios FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "RH/Super_Admin can manage benefits in their company." ON public.beneficios FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin())) WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can manage all benefits." ON public.beneficios FOR ALL USING (is_super_admin());

-- Tabela de Registros de Ponto
CREATE TABLE public.ponto_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  hora_entrada TIME WITH TIME ZONE NOT NULL,
  hora_saida TIME WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para ponto_registros: Usuário pode ver e registrar seu próprio ponto, RH/Super_Admin podem ver da sua empresa
CREATE POLICY "Users can view and insert their own time records." ON public.ponto_registros FOR ALL USING (perfil_id = auth.uid()) WITH CHECK (perfil_id = auth.uid());
CREATE POLICY "RH/Gestor can view time records in their company." ON public.ponto_registros FOR SELECT USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_gestor()));
CREATE POLICY "Super admins can manage all time records." ON public.ponto_registros FOR ALL USING (is_super_admin());

-- Tabela de Solicitações de Férias
CREATE TABLE public.ferias_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status TEXT DEFAULT 'pendente' NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para ferias_solicitacoes: Usuário pode ver e solicitar suas próprias férias, RH/Gestor podem ver da sua empresa
CREATE POLICY "Users can view and insert their own vacation requests." ON public.ferias_solicitacoes FOR ALL USING (perfil_id = auth.uid()) WITH CHECK (perfil_id = auth.uid());
CREATE POLICY "RH/Gestor can manage vacation requests in their company." ON public.ferias_solicitacoes FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_gestor())) WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_gestor()));
CREATE POLICY "Super admins can manage all vacation requests." ON public.ferias_solicitacoes FOR ALL USING (is_super_admin());

-- Tabela de Avaliações de Desempenho
CREATE TABLE public.avaliacoes_desempenho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliado_id uuid REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
  avaliador_id uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  periodo TEXT NOT NULL,
  auto_avaliacao TEXT,
  feedback_gestor TEXT,
  nota_final INTEGER,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para avaliacoes_desempenho: Usuário pode ver sua própria, Gestor/RH podem ver da sua empresa, Super_Admin todos
CREATE POLICY "Users can view their own performance reviews." ON public.avaliacoes_desempenho FOR SELECT USING (avaliado_id = auth.uid());
CREATE POLICY "Gestor/RH can view performance reviews in their company." ON public.avaliacoes_desempenho FOR SELECT USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_gestor()));
CREATE POLICY "Super admins can manage all performance reviews." ON public.avaliacoes_desempenho FOR ALL USING (is_super_admin());
CREATE POLICY "Users can insert their own auto-evaluation." ON public.avaliacoes_desempenho FOR INSERT WITH CHECK (avaliado_id = auth.uid());
CREATE POLICY "Gestor/RH can insert/update performance reviews in their company." ON public.avaliacoes_desempenho FOR UPDATE USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_gestor()));

-- Tabela de Vagas Internas
CREATE TABLE public.vagas_internas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  requisitos TEXT,
  data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_fechamento DATE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para vagas_internas: Todos da empresa podem ver, RH/Super_Admin podem gerenciar
CREATE POLICY "Users can view internal jobs in their company." ON public.vagas_internas FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "RH/Super_Admin can manage internal jobs in their company." ON public.vagas_internas FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin())) WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can manage all internal jobs." ON public.vagas_internas FOR ALL USING (is_super_admin());

-- Tabela de Treinamentos
CREATE TABLE public.treinamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  url_conteudo TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para treinamentos: Todos da empresa podem ver, RH/Super_Admin podem gerenciar
CREATE POLICY "Users can view trainings in their company." ON public.treinamentos FOR SELECT USING (empresa_id = public.get_empresa_id());
CREATE POLICY "RH/Super_Admin can manage trainings in their company." ON public.treinamentos FOR ALL USING (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin())) WITH CHECK (empresa_id = public.get_empresa_id() AND (is_rh_admin() OR is_super_admin()));
CREATE POLICY "Super admins can manage all trainings." ON public.treinamentos FOR ALL USING (is_super_admin());

-- Funções para verificar roles (exemplo, estas devem ser implementadas com base nos cargos/permissoes)
-- A implementação real dependeria de como as roles são armazenadas e associadas aos usuários.
-- Por simplicidade, estou assumindo que existe uma forma de verificar a role do usuário atual.
-- Em um cenário real, estas funções precisariam consultar a tabela 'perfis' e 'cargos'.

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementar lógica para verificar se o usuário atual é super admin
  -- Exemplo: return (SELECT EXISTS(SELECT 1 FROM public.perfis p JOIN public.cargos c ON p.cargo_id = c.id WHERE p.id = auth.uid() AND c.nome = 'Super_Admin'));
  RETURN FALSE; -- Placeholder
END;
$$;

CREATE OR REPLACE FUNCTION is_rh_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementar lógica para verificar se o usuário atual é RH Admin da empresa atual
  RETURN FALSE; -- Placeholder
END;
$$;

CREATE OR REPLACE FUNCTION is_gestor()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementar lógica para verificar se o usuário atual é Gestor da empresa atual
  RETURN FALSE; -- Placeholder
END;
$$;

-- Configuração inicial para o Storage (Buckets)
-- Exemplo de bucket para documentos de contracheque
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'contracheques',
  'contracheques',
  FALSE
) ON CONFLICT (id) DO NOTHING;

-- RLS para Storage (exemplo para o bucket de contracheques)
-- Apenas o dono do contracheque ou RH/Super_Admin da empresa podem acessar
CREATE POLICY "Allow authenticated users to view their own paychecks" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'contracheques' AND auth.uid() = (SELECT perfil_id FROM public.contracheques WHERE url_documento = name LIMIT 1)
);

CREATE POLICY "Allow RH/Super_Admin to view paychecks in their company" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'contracheques' AND (is_rh_admin() OR is_super_admin()) AND (SELECT empresa_id FROM public.contracheques WHERE url_documento = name LIMIT 1) = public.get_empresa_id()
);

-- Funções para o Supabase Storage RLS
-- Para garantir que apenas o dono do documento ou o RH/Super_Admin da empresa possam acessar
-- Isso exigiria uma função que extraia o perfil_id ou empresa_id do caminho do objeto ou metadados
-- Por exemplo, se o caminho do objeto for 'contracheques/empresa_id/perfil_id/documento.pdf'

-- Exemplo de função para extrair empresa_id do caminho do objeto (se o padrão for definido)
CREATE OR REPLACE FUNCTION get_empresa_id_from_storage_path(object_name TEXT)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  path_parts TEXT[];
BEGIN
  path_parts := string_to_array(object_name, '/');
  IF array_length(path_parts, 1) >= 2 THEN
    RETURN path_parts[2]::uuid; -- Assumindo que empresa_id é o segundo segmento
  END IF;
  RETURN NULL;
END;
$$;

-- Exemplo de função para extrair perfil_id do caminho do objeto
CREATE OR REPLACE FUNCTION get_perfil_id_from_storage_path(object_name TEXT)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  path_parts TEXT[];
BEGIN
  path_parts := string_to_array(object_name, '/');
  IF array_length(path_parts, 1) >= 3 THEN
    RETURN path_parts[3]::uuid; -- Assumindo que perfil_id é o terceiro segmento
  END IF;
  RETURN NULL;
END;
$$;

-- Atualizando as políticas de RLS para o storage com as novas funções
DROP POLICY IF EXISTS "Allow authenticated users to view their own paychecks" ON storage.objects;
DROP POLICY IF EXISTS "Allow RH/Super_Admin to view paychecks in their company" ON storage.objects;

CREATE POLICY "Allow authenticated users to view their own paychecks" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'contracheques' AND auth.uid() = get_perfil_id_from_storage_path(name)
);

CREATE POLICY "Allow RH/Super_Admin to view paychecks in their company" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'contracheques' AND (is_rh_admin() OR is_super_admin()) AND get_empresa_id_from_storage_path(name) = public.get_empresa_id()
);

-- Políticas para INSERT/UPDATE/DELETE no storage
CREATE POLICY "Allow authenticated users to upload their own paychecks" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'contracheques' AND auth.uid() = get_perfil_id_from_storage_path(name)
);

CREATE POLICY "Allow RH/Super_Admin to upload paychecks in their company" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'contracheques' AND (is_rh_admin() OR is_super_admin()) AND get_empresa_id_from_storage_path(name) = public.get_empresa_id()
);

CREATE POLICY "Allow authenticated users to update their own paychecks" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'contracheques' AND auth.uid() = get_perfil_id_from_storage_path(name)
);

CREATE POLICY "Allow RH/Super_Admin to update paychecks in their company" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'contracheques' AND (is_rh_admin() OR is_super_admin()) AND get_empresa_id_from_storage_path(name) = public.get_empresa_id()
);

CREATE POLICY "Allow authenticated users to delete their own paychecks" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'contracheques' AND auth.uid() = get_perfil_id_from_storage_path(name)
);

CREATE POLICY "Allow RH/Super_Admin to delete paychecks in their company" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'contracheques' AND (is_rh_admin() OR is_super_admin()) AND get_empresa_id_from_storage_path(name) = public.get_empresa_id()
);

-- Funções para roles (placeholders, devem ser implementadas com base na lógica de cargos/perfis)
-- Estas funções são cruciais para o RLS e precisam ser desenvolvidas com cuidado.
-- Elas devem consultar a tabela 'perfis' e 'cargos' para determinar as permissões do usuário logado.

-- Exemplo de como a função is_super_admin() poderia ser implementada (requer tabela de perfis e cargos)
-- CREATE OR REPLACE FUNCTION is_super_admin()
-- RETURNS BOOLEAN
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   RETURN (SELECT EXISTS(
--     SELECT 1 FROM public.perfis p
--     JOIN public.cargos c ON p.cargo_id = c.id
--     WHERE p.id = auth.uid() AND c.nome = 'Super_Admin'
--   ));
-- END;
-- $$;

-- Exemplo de como a função is_rh_admin() poderia ser implementada
-- CREATE OR REPLACE FUNCTION is_rh_admin()
-- RETURNS BOOLEAN
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   RETURN (SELECT EXISTS(
--     SELECT 1 FROM public.perfis p
--     JOIN public.cargos c ON p.cargo_id = c.id
--     WHERE p.id = auth.uid() AND p.empresa_id = public.get_empresa_id() AND c.nome = 'RH_Admin'
--   ));
-- END;
-- $$;

-- Exemplo de como a função is_gestor() poderia ser implementada
-- CREATE OR REPLACE FUNCTION is_gestor()
-- RETURNS BOOLEAN
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- BEGIN
--   RETURN (SELECT EXISTS(
--     SELECT 1 FROM public.perfis p
--     JOIN public.cargos c ON p.cargo_id = c.id
--     WHERE p.id = auth.uid() AND p.empresa_id = public.get_empresa_id() AND c.nome = 'Gestor'
--   ));
-- END;
-- $$;
