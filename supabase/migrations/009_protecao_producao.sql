-- 009 - Proteções de autorização e integridade para o primeiro piloto.
-- Revise conflitos de dados na homologação antes de aplicar em qualquer ambiente.

CREATE OR REPLACE FUNCTION public.is_active_portal_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.perfis p
      JOIN public.empresas e ON e.id = p.empresa_id
     WHERE p.id = auth.uid()
       AND p.ativo IS DISTINCT FROM false
       AND e.ativo IS DISTINCT FROM false
  );
$$;

DO $$
DECLARE
  v_tabela text;
BEGIN
  FOREACH v_tabela IN ARRAY ARRAY[
    'empresas', 'cargos', 'perfis', 'convites', 'contracheques',
    'ferias_solicitacoes', 'avaliacoes_desempenho', 'beneficios',
    'audit_logs', 'pesquisas_clima', 'respostas_clima',
    'controle_participacao_clima', 'documentos_corporativos',
    'aceites_documentos', 'manuais', 'vagas', 'candidatos',
    'candidaturas', 'entrevistas', 'feedbacks_candidatura',
    'testes_disc', 'pareceres_disc'
  ]
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS active_profile_gate ON public.%I',
      v_tabela
    );
    EXECUTE format(
      'CREATE POLICY active_profile_gate ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.is_active_portal_user()) WITH CHECK (public.is_active_portal_user())',
      v_tabela
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cargo_empresa uuid;
BEGIN
  IF NEW.cargo_id IS NOT NULL THEN
    SELECT c.empresa_id INTO v_cargo_empresa
      FROM public.cargos c
     WHERE c.id = NEW.cargo_id;
    IF v_cargo_empresa IS DISTINCT FROM NEW.empresa_id THEN
      RAISE EXCEPTION 'O cargo deve pertencer à mesma empresa do perfil.';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.id = auth.uid() THEN
    IF NEW.empresa_id IS DISTINCT FROM OLD.empresa_id
       OR NEW.cargo_id IS DISTINCT FROM OLD.cargo_id
       OR NEW.salario IS DISTINCT FROM OLD.salario
       OR NEW.ativo IS DISTINCT FROM OLD.ativo
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.data_admissao IS DISTINCT FROM OLD.data_admissao
       OR NEW.nome_completo IS DISTINCT FROM OLD.nome_completo
    THEN
      RAISE EXCEPTION 'O próprio usuário não pode alterar campos administrativos do perfil.';
    END IF;
  END IF;

  IF auth.uid() IS NOT NULL
     AND (public.is_rh_admin() OR public.is_super_admin())
     AND NEW.empresa_id IS DISTINCT FROM OLD.empresa_id
  THEN
    RAISE EXCEPTION 'A alteração de tenant do perfil não é permitida.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_changes ON public.perfis;
CREATE TRIGGER protect_profile_changes
  BEFORE INSERT OR UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_changes();

CREATE OR REPLACE FUNCTION public.protect_role_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_permissions_changed boolean;
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_permissions_changed := NEW.permissoes IS DISTINCT FROM '{}'::jsonb;
  ELSE
    v_permissions_changed := NEW.permissoes IS DISTINCT FROM OLD.permissoes;
  END IF;

  IF v_permissions_changed
     OR NEW.permissoes -> 'super_admin' = 'true'::jsonb
     OR (TG_OP = 'UPDATE' AND OLD.permissoes -> 'super_admin' = 'true'::jsonb)
  THEN
    RAISE EXCEPTION 'Somente um superadministrador pode alterar permissões de cargos.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_role_permissions ON public.cargos;
CREATE TRIGGER protect_role_permissions
  BEFORE INSERT OR UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.protect_role_permissions();

CREATE OR REPLACE FUNCTION public.protect_vacation_transitions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL
       AND (
         NEW.perfil_id IS DISTINCT FROM auth.uid()
         OR NEW.empresa_id IS DISTINCT FROM public.get_empresa_id()
         OR NEW.status <> 'pendente'
       )
    THEN
      RAISE EXCEPTION 'A solicitação deve ser criada pelo titular e iniciar pendente.';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.perfil_id = auth.uid() THEN
    IF OLD.status <> 'pendente'
       OR NEW.status <> 'cancelada'
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.empresa_id IS DISTINCT FROM OLD.empresa_id
       OR NEW.perfil_id IS DISTINCT FROM OLD.perfil_id
       OR NEW.data_inicio IS DISTINCT FROM OLD.data_inicio
       OR NEW.data_fim IS DISTINCT FROM OLD.data_fim
       OR NEW.observacoes IS DISTINCT FROM OLD.observacoes
    THEN
      RAISE EXCEPTION 'O titular só pode cancelar a própria solicitação pendente.';
    END IF;
  ELSIF public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor() THEN
    IF OLD.status <> 'pendente'
       OR NEW.status NOT IN ('aprovada', 'rejeitada')
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.empresa_id IS DISTINCT FROM OLD.empresa_id
       OR NEW.perfil_id IS DISTINCT FROM OLD.perfil_id
       OR NEW.data_inicio IS DISTINCT FROM OLD.data_inicio
       OR NEW.data_fim IS DISTINCT FROM OLD.data_fim
    THEN
      RAISE EXCEPTION 'A gestão só pode aprovar ou rejeitar uma solicitação pendente.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Sem permissão para alterar esta solicitação.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_vacation_transitions ON public.ferias_solicitacoes;
CREATE TRIGGER protect_vacation_transitions
  BEFORE INSERT OR UPDATE ON public.ferias_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.protect_vacation_transitions();

CREATE OR REPLACE FUNCTION public.protect_performance_review_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.avaliado_id = auth.uid()
       AND (
         NEW.empresa_id IS DISTINCT FROM public.get_empresa_id()
         OR NEW.avaliador_id IS NOT NULL
         OR NEW.feedback_gestor IS NOT NULL
         OR NEW.nota_final IS NOT NULL
       )
    THEN
      RAISE EXCEPTION 'A autoavaliação não pode definir dados da avaliação gerencial.';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.avaliado_id = auth.uid() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.empresa_id IS DISTINCT FROM OLD.empresa_id
       OR NEW.avaliado_id IS DISTINCT FROM OLD.avaliado_id
       OR NEW.avaliador_id IS DISTINCT FROM OLD.avaliador_id
       OR NEW.periodo IS DISTINCT FROM OLD.periodo
       OR NEW.feedback_gestor IS DISTINCT FROM OLD.feedback_gestor
       OR NEW.nota_final IS DISTINCT FROM OLD.nota_final
    THEN
      RAISE EXCEPTION 'O titular só pode alterar a própria autoavaliação.';
    END IF;
  ELSIF public.is_rh_admin() OR public.is_super_admin() OR public.is_gestor() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.empresa_id IS DISTINCT FROM OLD.empresa_id
       OR NEW.avaliado_id IS DISTINCT FROM OLD.avaliado_id
       OR NEW.periodo IS DISTINCT FROM OLD.periodo
       OR NEW.auto_avaliacao IS DISTINCT FROM OLD.auto_avaliacao
    THEN
      RAISE EXCEPTION 'A gestão não pode substituir a autoavaliação ou o vínculo da avaliação.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Sem permissão para alterar esta avaliação.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_performance_review_changes ON public.avaliacoes_desempenho;
CREATE TRIGGER protect_performance_review_changes
  BEFORE INSERT OR UPDATE ON public.avaliacoes_desempenho
  FOR EACH ROW EXECUTE FUNCTION public.protect_performance_review_changes();

ALTER TABLE public.testes_disc
  ADD COLUMN IF NOT EXISTS expira_em timestamptz;
ALTER TABLE public.testes_disc
  ADD COLUMN IF NOT EXISTS revogado_em timestamptz;
UPDATE public.testes_disc
   SET expira_em = COALESCE(enviado_em, criado_em) + interval '7 days'
 WHERE expira_em IS NULL;
ALTER TABLE public.testes_disc
  ALTER COLUMN expira_em SET DEFAULT (now() + interval '7 days');
ALTER TABLE public.testes_disc
  ALTER COLUMN expira_em SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_manuais_empresa
  ON public.manuais(empresa_id);

ALTER TABLE public.perfis
  ADD CONSTRAINT uq_perfis_empresa_id UNIQUE (empresa_id, id);
ALTER TABLE public.vagas
  ADD CONSTRAINT uq_vagas_empresa_id UNIQUE (empresa_id, id);
ALTER TABLE public.candidatos
  ADD CONSTRAINT uq_candidatos_empresa_id UNIQUE (empresa_id, id);
ALTER TABLE public.candidaturas
  ADD CONSTRAINT uq_candidaturas_empresa_id UNIQUE (empresa_id, id);
ALTER TABLE public.testes_disc
  ADD CONSTRAINT uq_testes_disc_empresa_id UNIQUE (empresa_id, id);

ALTER TABLE public.candidaturas
  ADD CONSTRAINT fk_candidaturas_vaga_empresa
  FOREIGN KEY (empresa_id, vaga_id)
  REFERENCES public.vagas (empresa_id, id)
  ON DELETE CASCADE;
ALTER TABLE public.candidaturas
  ADD CONSTRAINT fk_candidaturas_candidato_empresa
  FOREIGN KEY (empresa_id, candidato_id)
  REFERENCES public.candidatos (empresa_id, id)
  ON DELETE CASCADE;
ALTER TABLE public.entrevistas
  ADD CONSTRAINT fk_entrevistas_candidatura_empresa
  FOREIGN KEY (empresa_id, candidatura_id)
  REFERENCES public.candidaturas (empresa_id, id)
  ON DELETE CASCADE;
ALTER TABLE public.feedbacks_candidatura
  ADD CONSTRAINT fk_feedbacks_candidatura_empresa
  FOREIGN KEY (empresa_id, candidatura_id)
  REFERENCES public.candidaturas (empresa_id, id)
  ON DELETE CASCADE;
ALTER TABLE public.feedbacks_candidatura
  ADD CONSTRAINT fk_feedbacks_autor_empresa
  FOREIGN KEY (empresa_id, autor_id)
  REFERENCES public.perfis (empresa_id, id)
  ON DELETE CASCADE;
ALTER TABLE public.testes_disc
  ADD CONSTRAINT fk_testes_disc_candidatura_empresa
  FOREIGN KEY (empresa_id, candidatura_id)
  REFERENCES public.candidaturas (empresa_id, id)
  ON DELETE CASCADE;
ALTER TABLE public.pareceres_disc
  ADD CONSTRAINT fk_pareceres_disc_teste_empresa
  FOREIGN KEY (empresa_id, teste_id)
  REFERENCES public.testes_disc (empresa_id, id)
  ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_convite public.convites%ROWTYPE;
  v_convite_token text;
  v_email_usuario text;
BEGIN
  v_convite_token := NULLIF(NEW.raw_user_meta_data ->> 'convite_token', '');

  -- Usuários provisionados manualmente continuam sem perfil até o RH
  -- associá-los; uma tentativa de aceitar convite, porém, falha fechada.
  IF v_convite_token IS NULL THEN
    RETURN NEW;
  END IF;

  v_email_usuario := lower(COALESCE(NEW.email, ''));

  UPDATE public.convites c
     SET usado = true
   WHERE c.token = v_convite_token
     AND c.usado = false
     AND c.expira_em > now()
     AND lower(c.email) = v_email_usuario
     AND (
       c.cargo_id IS NULL
       OR EXISTS (
         SELECT 1
           FROM public.cargos cargo
          WHERE cargo.id = c.cargo_id
            AND cargo.empresa_id = c.empresa_id
       )
     )
  RETURNING c.* INTO v_convite;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido, expirado, já utilizado ou incompatível com o cadastro.';
  END IF;

  INSERT INTO public.perfis (id, empresa_id, cargo_id, nome_completo, email)
  VALUES (
    NEW.id,
    v_convite.empresa_id,
    v_convite.cargo_id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'nome_completo', ''), v_convite.email),
    v_convite.email
  );

  RETURN NEW;
END;
$$;
