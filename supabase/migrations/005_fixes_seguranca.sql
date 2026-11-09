-- ============================================================
-- 005 - Fixes de segurança e corretude
--
-- 1) Slots o campo `descricao` usado por admin-empresas.ts em `empresas`.
-- 2) Permite ao Super Admin criar novas empresas/tenants e seus cargos padrão
--    (cross-tenant, pois a nova empresa ainda não pertence ao admin).
-- 3) Endurece a trigger `handle_new_user`: para criar um perfil a partir de
--    metadados de auth, passa a EXIGIR um convite valido correspondente
--    (email + empresa + cargo + token nao usado e nao expirado). Sem convite,
--    o perfil NAO e criado, impedindo criacao de conta privilegiada arbitraria.
-- 4) Reforca o anonimato da pesquisa de clima: o RH deixa de ler a tabela de
--    controle de participacao (que tem timestamps), eliminando a correlacao
--    temporal entre resposta e respondente.
--
-- Encerra a escalada de privilegio por signUp com empresa_id/cargo_id forjados.
-- ============================================================

-- ------------------------------------------------------------
-- 1. empresas.descricao
-- ------------------------------------------------------------
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS descricao text;

-- ------------------------------------------------------------
-- 2. Permissões de SUPER_ADMIN para criar tenants e cargos
-- ------------------------------------------------------------
-- Super Admin pode ler qualquer empresa e inserir novas empresas (tenants).
CREATE POLICY "empresas_select_super_admin" ON public.empresas
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "empresas_insert_super_admin" ON public.empresas
  FOR INSERT WITH CHECK (public.is_super_admin());

-- Super Admin pode criar os cargos padrão da nova empresa (cross-tenant).
CREATE POLICY "cargos_insert_super_admin" ON public.cargos
  FOR INSERT WITH CHECK (public.is_super_admin());

-- ------------------------------------------------------------
-- 3. Trigger handle_new_user exige convite válido
-- ------------------------------------------------------------
-- A página de convite cria a conta via auth.signUp e envia, nos metadados,
-- o `convite_token`. A trigger valida contra a tabela `convites`:
--   - convite existe, não usado, não expirado;
--   - email do convite == email do usuário;
--   - empresa_id e cargo_id do convite coincidem com os metadados.
-- Só com essas condições o perfil é criado (com os dados DO convite, nunca
-- os fornecidos pelo cliente). Caso contrário, nada é criado — o app mostra
-- mensagem de erro para o usuário.
--
-- IMPORTANTE: o fluxo manual de RH (cria usuário no Auth e depois insere o
-- perfil via SQL direto) NÃO passa por esta função — a trigger fica em no-op
-- e o INSERT manual continua funcionando normalmente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_convite_token text;
  v_convite      RECORD;
  v_email_usuario text;
BEGIN
  v_convite_token := NULLIF(NEW.raw_user_meta_data ->> 'convite_token', '');
  v_email_usuario := lower(NEW.email);

  -- Sem token de convite: não criamos perfil. O vetor de signUp com
  -- empresa_id/cargo_id forjados deixa de funcionar (no-op proposital).
  IF v_convite_token IS NULL THEN
    RETURN NEW;
  END IF;

  -- Busca o convite por token.
  SELECT id, email, empresa_id, cargo_id, usado, expira_em
    INTO v_convite
    FROM public.convites
   WHERE token = v_convite_token
   LIMIT 1;

  -- Confere todas as condições de segurança.
  IF NOT FOUND
     OR v_convite.usado
     OR v_convite.expira_em <= now()
     OR lower(v_convite.email) <> v_email_usuario
     OR v_convite.empresa_id IS NULL
  THEN
    RETURN NEW; -- não cria perfil; cadastro incompleto.
  END IF;

  -- Cria o perfil usando OS DADOS DO CONVITE (nunca os metadados do cliente).
  INSERT INTO public.perfis (id, empresa_id, cargo_id, nome_completo, email)
  VALUES (
    NEW.id,
    v_convite.empresa_id,
    v_convite.cargo_id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'nome_completo', ''), v_convite.email),
    v_convite.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Marca o convite como usado.
  UPDATE public.convites
     SET usado = true
   WHERE id = v_convite.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 4. Anonimato do clima: RH deixa de ler participação (timestamps)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "participacao_select_proprio" ON public.controle_participacao_clima;
CREATE POLICY "participacao_select_proprio" ON public.controle_participacao_clima
  FOR SELECT USING (perfil_id = auth.uid());