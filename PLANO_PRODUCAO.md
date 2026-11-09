# RGA People — avaliação e plano de preparação para produção

**Data da avaliação:** 09/11/2026  
**Decisão:** **NÃO LIBERAR o estado atual para produção com dados reais.**  
**Ambiente verificado:** Windows, Node 24.18.0, npm 11.16.0, Next.js 15.5.29.

### Atualização após as correções locais

O diagnóstico detalhado abaixo registra o baseline anterior às correções; os itens não marcados nesta atualização continuam pendentes. Não houve acesso ou alteração de ambientes remotos.

| Verificação/correção local | Resultado atual |
|---|---|
| Markdown/build e compatibilidade Node | Corrigidos; Next.js 15.5.29 e `npm run build` passam em Node 24.18.0. |
| Autorização, estados de convite, submissão, DISC/PDF e agenda | Endurecidos no código; testes focados passam, mas os fluxos externos ainda dependem de homologação. |
| Regressão automatizada | `npm test`: 7 testes passam, incluindo geração de PDF sintético, validação de currículo/datas/Markdown e execução das migrations no PostgreSQL WASM. |
| Banco/migrations | As 10 migrations são aplicadas em banco isolado; o teste verifica versões únicas, FK multi-tenant e RLS para perfil ativo/inativo. O emulador não inclui `pgcrypto`, então só o `CREATE EXTENSION` é omitido no teste. Isso não comprova compatibilidade integral com o Supabase nem substitui ensaio com cópia real. |
| Instalação e qualidade | `npm ci`, build, `tsc --noEmit --incremental false`, `npm run lint` e `npm test` passam localmente sem erros de lint. O build ainda avisa que `process.version` do Supabase não é suportado pelo Edge Runtime; validar no preview Netlify. |
| Dependências | `npm audit` e `npm audit --omit=dev` reportam zero vulnerabilidades após atualização do Next, Zod e dependências transitivas. |
| Prontidão de produção | **Continua NÃO LIBERAR.** RLS/Storage no ambiente alvo, CAPTCHA, limites de Netlify, envio de e-mail, política de clima, privacidade/IA, rotação de credenciais e recuperação/rollback seguem sem homologação. |

Existe uma base reaproveitável e uma implementação ampla, mas não uma versão homologada. O build, o lint, os tipos, os testes locais e o audit passam; permanecem lacunas de integração, privacidade e operação.

Este documento acompanha as correções locais. Nenhuma migration foi aplicada, nenhum deploy foi feito e nenhuma configuração remota foi alterada.

## 1. Escopo, evidências e limites

Foram inventariadas 32 páginas e examinados os fluxos centrais de autenticação/convites, administração, férias, contracheques, documentos/manual, clima, ATS, entrevistas, feedback, métricas, IA e DISC, além das migrations e configurações de entrega. Isso **não equivale a uma auditoria exaustiva de todas as telas, pentest ou certificação LGPD**.

Classificação das evidências:

- **Execução local:** comportamento observado com ferramentas/dependências instaladas.
- **Código:** conclusão verificável no código ou SQL disponível; não comprova o estado do banco implantado.
- **Homologação pendente:** depende de infraestrutura, configuração, dados sintéticos e/ou aprovação de negócio.

| Verificação realizada | Resultado |
|---|---|
| `npm run build`, com telemetria desativada | **Baseline anterior:** falhava no import nativo do Markdown. **Atual:** passa após a troca para React Markdown e upgrade do Next. |
| TypeScript: `tsc --noEmit --incremental false` | **Passou** após as correções e o upgrade. Não elimina falhas de integração. |
| `npm run lint` | **Atual:** passa sem avisos de lint. O wrapper `next lint` está deprecated no Next 15 e precisa migrar para ESLint CLI antes do Next 16. |
| `npm audit` e `npm audit --omit=dev` | **Atual:** zero vulnerabilidades reportadas após a atualização do lockfile. |
| Cálculo DISC, com fixtures sintéticas | 24 distribuições válidas verificadas; soma 100 e cada dimensão entre 10 e 40. Rejeitadas 24 fixtures com repetição de valores e uma resposta vazia. |
| Empate DISC, scores 25/25/25/25 | Retorna `D/I` pela ordem de ordenação. Não há regra de desempate aprovada pelo negócio. |
| Schema de entrevista, entrada sintética `not-a-date` | Rejeita datas inválidas e exige timezone; coberto por teste. |
| Função real de geração do PDF DISC, com dados fictícios | Resolveu em teste sintético e produziu PDF legível; não valida e-mail/Storage em integração. |
| Ambiente local para integração | Não havia variáveis Supabase/site/IA no processo nem arquivo local de configuração de ambiente. `psql`, Supabase CLI e Docker não foram encontrados no PATH. |
| Testes persistentes e CI | Há script `npm test` e sete testes locais; pipeline CI/CD ainda não foi comprovado. |

Não houve acesso ao Supabase/Netlify de produção, chamada real de IA, envio de e-mail, uso das credenciais anteriormente compartilhadas, nem transmissão de currículos ou documentos pessoais. As sondagens de scoring/PDF usaram dados sintéticos e bloquearam `fetch`. O audit de dependências consultou metadados de pacotes, não o código da aplicação.

**Ainda não verificados:** migrations no Supabase real, RLS e políticas de Storage implantadas, callbacks de autenticação, formulários em navegador real, PDF ponta a ponta com Storage, envio de e-mail, carga, restauração e deploy Linux/Netlify. O ensaio PGlite valida apenas uma aproximação PostgreSQL local.

## 2. Estado real das entregas

| Área | O que existe | Situação para produção |
|---|---|---|
| Arquitetura | Next.js 15.5.29, Supabase, entidades multi-tenant, guards, RLS, schemas e Server Actions | Endurecida localmente; isolamento remoto ainda não homologado. |
| Portal de RH | Colaboradores, convites, férias, contracheques, benefícios, avaliações | Implementação parcial com inconsistências de permissões, persistência e mensagens de sucesso. |
| Manual/documentos | Editor, renderização sanitizada e aceites | Build passa e HTML bruto é descartado; integridade/versionamento dos aceites ainda requer homologação. |
| Clima | Pesquisa, respostas, controle de participação, dashboard | Não é possível garantir o anonimato anunciado apenas com o modelo atual. |
| ATS fase 1 | Vagas, candidaturas, currículos, pipeline e painel interno da empresa | Formulário público não sobrescreve perfil existente; reutilização segura de perfil já cadastrado segue pendente. |
| ATS fase 2 | Lista de entrevistas, estados, feedback e métricas | Agenda e envio de feedback foram conectados no código; calendário externo e precisão das métricas ainda não homologados. |
| ATS fase 3 | Extração PDF/DOCX, chamada OpenRouter, score e resumo | Não homologada; score exibido não equivale a ranking ordenado; JPEG não tem OCR e DOC binário é tratado como DOCX. |
| DISC | Questionário, scores, tokens, textos, parecer e estrutura do PDF | Scoring e PDF sintético testados; instrumento/parecer e fluxo real ainda não validados por RH e homologação. |
| Operação | Configuração Netlify, lockfile, exemplos de ambiente e Dependabot | Instalação limpa/build local reproduzidos; CI, runbook, restauração e ambiente de homologação seguem pendentes. |

O painel de acompanhamento da empresa é uma área autenticada de RH/gestor; não é um portal de status individual do candidato. A referência ao Recrut.ai não constitui comprovação de equivalência funcional ou pesquisa comparativa validada.

## 3. P0 — bloqueadores de produção

P0 significa impedir a liberação enquanto o problema estiver no escopo ativo. Bloqueadores transversais de autorização, build, dados e operação não podem ser dispensados escondendo botões.

### B01 — build e runtime incompatíveis

**Evidência:** execução local; [renderizador Markdown](./lib/markdown.tsx), [configuração Next](./next.config.mjs), [Netlify](./netlify.toml), [.nvmrc](./.nvmrc) e [dependências](./package.json).

**Status atual:** corrigido localmente. Markdown usa `react-markdown` sem HTML bruto; Node 24.18.0, Next 15.5.29, instalação limpa, lint, tipos e build passaram. O deploy Linux/Netlify continua sem verificação.

**Achados do baseline:** incompatibilidade de `isomorphic-dompurify` com o build; Node declarado incompatível com a dependência; acesso do runner ao registry/certificados não comprovado.

**Entrega:** alinhar um runtime suportado entre desenvolvimento/CI/Netlify, corrigir os limites server/client da sanitização sem removê-la e tornar a instalação reproduzível. Não desabilitar validação TLS para contornar o registry.

**Aceite:** instalação limpa com `npm ci`, lint, tipos e build aprovados no runtime escolhido e no ambiente Linux equivalente ao deploy; Markdown malicioso continua sanitizado no servidor e no cliente.

### B02 — autorização no banco permite alterações além das funções da UI

**Evidência:** código SQL em [schema inicial](./supabase/migrations/001_initial_schema.sql), especialmente políticas de perfis, cargos, férias e avaliações.

**Status atual:** proteções aditivas em [migration 009](./supabase/migrations/009_protecao_producao.sql) e testes sintéticos locais para perfil inativo e FK entre tenants. Não está provada a matriz completa de papéis nem o estado em Supabase remoto.

**Achados do baseline:**
- A policy de atualização do próprio perfil verifica apenas `id = auth.uid()`. O comentário promete limitar foto/telefone, mas o SQL não protege `cargo_id`, `empresa_id`, salário e outros campos.
- RH pode gerenciar o JSON de permissões dos cargos, inclusive permissões de superadministrador, sem uma restrição específica no modelo disponível.
- As policies de atualização própria de férias e avaliações não impõem as transições/colunas previstas na UI; a policy de inserção de férias também não restringe o estado inicial a pendente.
- Restrições em Server Actions não substituem regras do banco quando o cliente pode chamar a API Supabase.

**Entrega:** proteger campos administrativos e permissões globais no banco; restringir estados e alterações a operações autorizadas; testar também acesso direto à API, não somente botões.

**Aceite:** com dois tenants e todos os papéis, colaborador não altera cargo/empresa/salário, não aprova suas férias nem muda avaliação gerencial; RH de tenant não se promove a superadmin; acesso de outro tenant não lê nem modifica registros ou arquivos.

### B03 — ciclo de acesso, inativação e CAPTCHA não fechados

**Evidência:** [login](./app/c/[tenant_slug]/login/page.tsx), [convite](./app/c/[tenant_slug]/convite/[token]/page.tsx), [trigger de cadastro](./supabase/migrations/005_fixes_seguranca.sql), [inativação](./app/actions/admin-colaboradores.ts) e [guards](./lib/auth/guards.ts).

**Status atual:** fluxo local endurecido: token CAPTCHA é enviado ao Supabase uma única vez, convite distingue confirmação de cadastro, inativação usa banimento administrativo e guards/RLS bloqueiam perfil/empresa inativos. Configuração Turnstile e jornada Auth ainda precisam de homologação.

**Achados do baseline:**
- Login/recuperação validam o token Turnstile no endpoint próprio e depois o enviam ao Supabase. Se CAPTCHA estiver habilitado no Auth, o token de uso único será submetido à validação duas vezes. Se estiver desabilitado, a checagem apenas no fluxo da UI não protege a API de Auth diretamente.
- Cadastro por convite não envia `captchaToken`; confirmação de e-mail e recuperação precisam de homologação no modo realmente escolhido.
- Convite inválido pode criar usuário Auth sem perfil: a trigger retorna sem erro e a UI toma a existência do usuário como sucesso.
- Inativação passa um ID de perfil para `admin.signOut`, cuja API instalada espera JWT, e ignora o erro retornado. Guards e helpers RLS não verificam `ativo`.
- O slug da rota não é validado consistentemente contra o tenant da sessão. Isso, isoladamente, não prova vazamento, mas permite contexto visual divergente.

**Entrega:** uma estratégia única de CAPTCHA no Auth; cadastro/consumo de convite consistente; bloqueio de usuário/empresa inativos no servidor e banco; política explícita para sessões existentes e contexto do tenant. Validar também destinos de redirecionamento.

**Aceite:** convite válido/usado/expirado/inválido, confirmação, login, reset e logout exercitados; nenhuma tela anuncia cadastro completo sem perfil; inativado não mantém acesso às operações de negócio, inclusive com sessão já aberta.

### B04 — submissão pública pode substituir currículo de outra pessoa

**Evidência:** [submissão ATS](./app/actions/talentos.ts), na atualização do candidato encontrado por e-mail.

**Status atual:** a submissão não atualiza currículo/cadastro existente e valida extensão, MIME e assinatura do arquivo; candidatura com e-mail já cadastrado é bloqueada até confirmação de titularidade pelo RH. O fluxo seguro de verificação/reutilização continua pendente.

**Achados do baseline:**
- Sem autenticação ou comprovação de posse do e-mail, o fluxo usa service role para substituir nome, telefone e currículo de um perfil existente.
- O currículo anterior é removido antes da verificação de candidatura duplicada. A resposta “já se candidatou” pode ocorrer depois de alterar dados.
- Upload, perfil e candidatura não formam uma operação consistente; falhas e concorrência podem deixar arquivos órfãos ou estado parcial.

**Entrega:** permitir candidato sem conta, mas exigir prova de posse para reutilizar/alterar perfil, por exemplo link de uso único; separar criação de candidatura de alteração de identidade/currículo; implementar idempotência e compensação de falhas de Storage.

**Aceite:** submissão não verificada com e-mail existente não altera nenhum dado/arquivo; duas vagas podem reutilizar o perfil autorizado; reenvio e requisições simultâneas não duplicam candidatura nem apagam currículo válido.

### B05 — upload prometido não corresponde ao transporte e à validação

**Evidência:** [schema de currículo](./lib/schemas/candidato.schema.ts), [validação/upload](./app/actions/talentos.ts) e [configuração Next](./next.config.mjs).

**Status atual:** extensão, MIME e assinatura são validados; o Next aceita corpo de Server Action até 10 MB para arquivos de até 8 MiB. Limites de payload/duração do Netlify, quotas e tráfego ponta a ponta ainda não foram testados.

**Achados do baseline:** limite padrão de Server Action inferior ao arquivo aceito e validação apenas por extensão/MIME controlados pelo remetente.

**Entrega:** desenhar upload compatível com o provedor; preferir upload autorizado diretamente ao Storage privado quando o limite da função impedir o requisito. Validar conteúdo, tamanho, formatos e processamento seguro; limitar frequência/volume e evitar distribuição de arquivos não liberados.

**Aceite:** PDF, DOCX e JPEG válidos de até 8 MiB chegam ao Storage e ficam acessíveis somente aos papéis autorizados; acima do limite ou conteúdo incompatível é rejeitado claramente. Testar multipart, quotas, falhas e expiração dos links. Nunca expor service role ao navegador.

### B06 — DISC/PDF e conteúdo do parecer não podem ser liberados assim

**Evidência:** [formulário](./components/modules/talentos/FormularioTesteDisc.tsx), [ações DISC](./app/actions/disc.ts), [gerador PDF](./lib/pdf/parecerDisc.ts), [detalhe](./app/c/[tenant_slug]/portal/talentos/[candidaturaId]/page.tsx) e [migration DISC](./supabase/migrations/008_teste_disc.sql).

**Status atual:** questionário, token/expiração, consumo do fluxo, regeneração e geração de PDF foram corrigidos localmente; há teste sintético do PDF. Aprovação profissional do instrumento e homologação de e-mail/Storage continuam pendentes.

**Achados do baseline:**
- PDF reproduzidamente pendente: callback incompatível com a API Promise do pdfmake 0.3.14.
- Radios das quatro opções da mesma pergunta compartilham um único grupo nativo; valores usados são bloqueados sem mecanismo de troca. O formulário passa o token no argumento destinado ao slug; a action atualmente ignora esse argumento.
- Tokens não têm expiração/revogação. Resposta usa leitura de estado e atualização separadas, sem consumo atômico.
- Teste pendente retorna link administrativo, não o link público. Múltiplos testes conflitam com a leitura por `maybeSingle()`.
- Regenerar parecer aparece na UI, mas a action aceita somente estado `respondido`; o upsert não especifica conflito por `teste_id`.
- Não há verificação de entrevista realizada/aprovação humana para liberar teste.
- O PDF afirma aprovação/aptidão sem decisão registrada e coloca CPF no campo de formação condicionado ao nome da mãe. Isso é conteúdo incorreto, não apenas problema de diagramação.

**Entrega:** corrigir formulário, API PDF, recuperação do link, estados e histórico; implementar token com validade/revogação/consumo atômico e vínculo ao tenant; guardar campos reais do parecer e decisão humana rastreável.

**Aceite:** candidato preenche e corrige as dez perguntas, envia uma vez, RH revisa/gera e usuário autorizado baixa PDF válido; repetição/concorrência/token inválido são tratados; reabertura e regeneração não duplicam dados. PDF não inventa formação, entrevista, aprovação ou aptidão.

### B07 — anonimato e integridade da pesquisa de clima insuficientes

**Evidência:** [schema de clima](./supabase/migrations/003_pesquisa_clima.sql), [envio de respostas](./app/actions/clima.ts), [dashboard RH](./app/c/[tenant_slug]/portal/admin/clima/page.tsx) e [resultados](./components/modules/clima/ResultadosClima.tsx).

- Separar participação e resposta é positivo, mas RH ainda pode ler respostas individuais, departamento e timestamp pela policy de SELECT; resultados não exigem tamanho mínimo de grupo.
- Texto livre e grupos pequenos podem identificar participantes. Ocultar a tabela de participação não basta para garantir anonimato.
- Resposta e participação são duas gravações separadas; o erro da segunda é ignorado. A policy de resposta não exige pesquisa aberta nem controla unicidade de participação.

**Entrega:** envio transacional que preserve a separação de identidade/resposta, restrições no banco e exposição de resultados por agregação controlada; revisar timestamps, comentários e limiar mínimo com o responsável por privacidade.

**Aceite:** concorrência não gera respostas extras; pesquisa fechada ou de outro tenant recusa envio; RH não recebe linhas identificáveis pela API. Grupos abaixo do limiar aprovado não exibem resultados. Não anunciar anonimato absoluto.

### B08 — banco e Storage sem implantação reproduzível comprovada

**Evidência:** [migrations](./supabase/migrations), [manual](./supabase/migrations/0085_manual_colaborador.sql), [ATS](./supabase/migrations/006_banco_talentos.sql) e [entrevistas](./supabase/migrations/007_recrutamento_fase2.sql).

**Status atual:** versões duplicadas foram removidas, políticas do manual podem ser reaplicadas e a migration 009 adiciona FKs compostas e unicidade do manual. O teste em PGlite passa; histórico real, RLS completa e políticas/buckets de Storage ainda exigem homologação.

- A migration do manual foi renumerada para `0085` para eliminar a versão duplicada `004`; a recriação das policies é idempotente para ambientes que possam ter aplicado a migration antiga. O teste em PGlite verifica a sequência, a unicidade e reaplicação local, mas não consulta o histórico de nenhum projeto Supabase remoto.
- FKs compostas protegem os vínculos ATS cobertos; outras relações ainda precisam de revisão.
- A migration 009 impõe um manual por empresa; outras operações consultar-depois-inserir ainda precisam de proteção contra concorrência.
- Há criação de buckets privados para currículos/pareceres; bucket e políticas de objetos dos contracheques não estão definidos nas migrations examinadas.
- **`is_gestor()` existe no schema inicial.** Não é uma dependência ausente; sua execução no ambiente real ainda precisa ser confirmada.

**Entrega:** reconciliar o histórico remoto antes de aplicar migrations; automatizar bootstrap e upgrade; adicionar integridade entre tenants, unicidade necessária e configuração de Storage versionada.

**Aceite:** banco vazio e cópia de homologação com schema anterior chegam ao mesmo resultado; ensaio em cópia real de homologação, histórico reconciliado e testes de constraints/RLS/Storage aprovados. Não aplicar migrations em produção sem conhecer o histórico real.

### B09 — dependências com avisos relevantes e sem porta de qualidade

**Evidência:** execução do audit, [manifesto](./package.json), [lockfile](./package-lock.json) e [.github](./.github).

**Status atual:** `npm audit` e `npm audit --omit=dev` reportam zero vulnerabilidades no lockfile atual. Next foi atualizado para 15.5.29, Zod para 4.6.7 e dependências transitivas foram fixadas em versões corrigidas; o build, lint, tipos e testes passaram após a atualização.

O resultado se refere ao audit do npm no momento da validação; repetir o scan em CI antes de cada liberação e acompanhar avisos novos.

**Entrega:** avaliar advisories aplicáveis, atualizar de forma controlada, configurar lint/testes/build e bloquear releases reprovadas. Não executar `npm audit fix --force` às cegas.

**Aceite:** nenhuma vulnerabilidade crítica/alta aplicável sem tratamento; árvore efetiva auditada novamente; regressão do Auth, Server Actions, SSR, parsers e PDF aprovada após upgrades.

### B10 — privacidade, segredos e governança de IA ainda não aprovados

**Evidência:** [triagem IA](./lib/ai/triagem.ts), [IA DISC](./lib/ai/disc.ts), [dados pessoais DISC](./lib/schemas/disc.schema.ts), [Netlify](./netlify.toml) e [documentação de ambiente](./NETLIFY_ENV.md).

- Triagem envia até 12.000 caracteres do currículo ao OpenRouter, potencialmente com dados pessoais. DISC coleta CPF, nome da mãe, estado civil e filhos sem necessidade/base legal demonstrada no projeto.
- Há documento de exemplo com dados reais no workspace. Ele não deve ser publicado como fixture/asset nem enviado ao provedor de IA.
- Rotação das credenciais anteriormente expostas não foi comprovada.
- Secret scanning está desabilitado na configuração Netlify. GitHub Secrets, sozinho, não injeta variáveis no runtime Netlify; não existe workflow que faça essa integração.
- `openrouter/auto` não garante modelo gratuito. Faltam controle de modelo/provedor, orçamento e rastreabilidade das análises.
- Não há comprovação de validade do questionário, desempates e textos de perfil para a finalidade de seleção.

**Entrega:** revisão pelo RH responsável e encarregado/jurídico; minimização de dados, aviso de privacidade, base legal, retenção/exclusão, contratos de operadores e avaliação de transferência internacional quando aplicável. Rotacionar segredos, separar ambientes, restringir service role e restaurar detecção de segredos com tratamento adequado de falsos positivos.

**Aceite:** configurações e aprovações registradas; nenhuma informação pessoal real em testes/logs/artefatos públicos; candidato informado; fluxo de acesso/correção/exclusão testado. IA somente como apoio revisável por pessoa, sem decisão automática de contratação/rejeição ou diagnóstico de personalidade.

## 4. P1 — completar e tornar confiável o escopo funcional

Estes itens também bloqueiam a liberação do respectivo módulo quando estiverem no escopo contratado. “P1” não significa que possam ser ignorados.

| ID | Pendência e evidência | Entrega / critério de aceite |
|---|---|---|
| F01 | RH comum inicia em modo colaborador e não dispõe do seletor de superadmin: [layout](./app/c/[tenant_slug]/portal/layout.tsx). Link de leitura do manual não está no menu principal. | Menu deriva das permissões reais; RH acessa sua administração sem URL manual; colaborador acessa manual; simulação de visão nunca concede autorização. Testar desktop/mobile e teclado. |
| F02 | [Gestão de vagas](./components/modules/talentos/GestaoVagas.tsx) cria aberta e preserva status na edição, sem controle de fechamento/reabertura. | Fechar/reabrir com estado confirmado no banco; vaga fechada deixa de aceitar candidatura, inclusive na action. Arquivamento/exclusão tem política de retenção clara. |
| F03 | [Detalhe da candidatura](./components/modules/talentos/DetalheCandidatura.tsx) tinha formulário de feedback inacessível a gestores e agenda sem confirmação completa. O envio de feedback por gestor foi conectado localmente. | Validar no navegador papéis, reagendamento e persistência; concluir calendário solicitado ou removê-lo formalmente do escopo, sem chamar lista de calendário. |
| F04 | [Schemas](./lib/schemas/candidato.schema.ts) e fluxo de entrevista foram corrigidos: datas inválidas/timezone e URLs fora de HTTP(S) são rejeitados. Teste sintético cobre rejeição. | Homologar apresentação do mesmo instante para candidato/RH em navegadores e fusos distintos. |
| F05 | [UI DISC](./components/modules/talentos/DiscCandidatura.tsx), token, estados e acesso ao PDF foram endurecidos no código e testados parcialmente. | Testar retorno após recarregar, papéis RH/gestor e fluxo completo no navegador/Storage; leitura de gestor não deve exigir escrita em tabela protegida. |
| F06 | [Métricas](./app/c/[tenant_slug]/portal/admin/talentos/metricas/page.tsx) usam `atualizado_em` como data de contratação e agrupam vagas pelo título. | Histórico de etapas/data de contratação; agregação por ID; paginação/consultas agregadas. Duas vagas homônimas ficam separadas; alterações de IA não mudam tempo até contratação; mais de 1.000 linhas não truncam totais. |
| F07 | [Triagem](./app/actions/talentos.ts) sobrescreve observações RH; [parser IA](./lib/ai/triagem.ts) converte score inválido em zero; [pipeline](./components/modules/talentos/PipelineCandidatos.tsx) exibe score, mas não implementa ranking ordenado. | Guardar análise separada com modelo, versão, data e revisão; validar saída estritamente; erro não vira nota. Ranking, se mantido, usa critérios profissionais documentados, explicáveis e revisáveis. |
| F08 | [Extrator](./lib/ai/curriculo.ts) não tem OCR e encaminha DOC binário ao parser DOCX. | Garantir upload PDF/DOCX/JPEG; informar quais aceitam triagem automática. JPEG/PDF escaneado entram em triagem manual quando não houver OCR. Rejeitar DOC claramente ou implementar conversão segura; não anunciar suporte inexistente. |
| F09 | [Listagem ATS](./app/c/[tenant_slug]/portal/admin/talentos/page.tsx) usa default que não cobre `null` e chama `.find()`; várias consultas ignoram erros. | Erro de banco aparece como erro recuperável, não lista vazia/404/sucesso. Remover casts que escondem nulidade, tipar resultados e testar falhas. Tratar carregamento assíncrono e cliques repetidos. |
| F10 | [Manual](./app/actions/admin-manual.ts) sem validação robusta; [documentos/aceites](./app/actions/documentos.ts) aceitam versão enviada pelo cliente e não mantêm revisão imutável do conteúdo. | Manual único/validado; conteúdo aceito preservado por versão/hash; aceite vinculado ao documento/tenant/versão reais; atualização exige novo aceite quando aplicável. |
| F11 | [Upload de contracheques](./components/modules/admin/UploadContrachequesModal.tsx) ignora erro do insert/update; [admin](./app/c/[tenant_slug]/portal/admin/contracheques/page.tsx) faz download sem a trilha da action. | Nenhum sucesso sem arquivo e registro persistidos; unicidade colaborador/competência; falhas compensadas e auditoria consistente também para RH. |
| F12 | [Férias](./app/actions/ferias.ts) envia observações/abono ao log, não à entidade da solicitação; [aprovação](./app/actions/admin-ferias.ts) pode anunciar e-mail enviado sem confirmação. | Persistir campos de negócio necessários; aprovar/rejeitar atomicamente apenas pendentes; distinguir decisão salva de notificação enviada/falha. Definir regras de saldo e responsabilidade RH, sem presumir conformidade trabalhista automática. |
| F13 | [Benefícios](./app/c/[tenant_slug]/portal/admin/beneficios/page.tsx) permite criar/excluir, mas não editar; resultado da exclusão é descartado. A autoavaliação foi corrigida localmente para não gravar a própria nota como nota final gerencial. | Completar edição ou corrigir escopo/documentação; tratar falhas e homologar separação das notas. |
| F14 | Revalidações do ATS concentram-se na página admin; auditoria dos novos fluxos é insuficiente. | Detalhe, painel gestor e métricas refletem mutações; registrar autor, operação, entidade, tenant e horário, sem copiar currículo/token/segredo para logs. Sucesso exige alteração efetiva de registro. |

Também é necessário decidir e testar o tratamento das URLs antigas da página de pesquisas removida: redirecionamento para clima ou descontinuação explícita.

## 5. Plano de execução, responsáveis e dependências

Papéis abaixo são responsáveis sugeridos, não pessoas já designadas. Estimativa de prazo deve ser feita após o build limpo e o levantamento do banco implantado; atribuir uma data agora esconderia incertezas.

| Fase | Entregas | Dependências reais | Responsável sugerido | Porta de saída |
|---|---|---|---|---|
| 0 — contenção e baseline | Congelar expansão; identificar ambientes/versão implantada; tratar credenciais expostas; proteger dados de exemplo; confirmar escopo e decisões de acesso. | Nenhuma | Responsável técnico + DevOps + RH/privacidade | Inventário, responsáveis e escopo aprovados; nenhuma exposição ativa conhecida. |
| 1 — fundação executável | B01/B08/B09: runtime, dependências, build, lint, testes iniciais, migrations e Storage; CI mínima com ambiente isolado. | Fase 0 e acesso autorizado à configuração de homologação | Desenvolvimento + DevOps | Clone/instalação limpa e banco novo reproduzíveis; preview utilizável com dados sintéticos. |
| 2 — autorização e integridade | B02/B03/B04/B05/B07: RLS, campos protegidos, inativos, convites, candidato verificado, upload, transações e clima. | Inventário da fase 0; banco de teste da fase 1 para aceite | Backend + QA | Matriz entre tenants/papéis e testes concorrentes aprovados. |
| 3 — completude funcional | B06 e F01–F14 no escopo: RH, ATS, DISC/PDF, métricas, agenda, mensagens e recuperação de falhas. | Fundação da fase 1; contratos de autorização/estado da fase 2 | Frontend + Backend + RH | Jornadas completas no navegador, incluindo erros e retomada. |
| Trilha paralela — privacidade/IA | B10: finalidade, minimização, retenção, fornecedores, modelo/custo, validação do instrumento e revisão humana. | Inventário da fase 0; avaliação final sobre a implementação corrigida | Encarregado/jurídico + RH + técnico | Aprovação documentada antes de qualquer piloto com dados pessoais/IA externa. |
| 4 — homologação e operação | E2E, carga, observabilidade, e-mail, backups de banco/arquivos, restauração e rollback. | Fases 1–3 e trilha de privacidade para o escopo ativo | QA + DevOps + RH | Evidências dos testes e runbooks executados; pendências bloqueadoras zeradas. |
| 5 — piloto e go-live | Tenant piloto, monitoramento, suporte e expansão gradual; liberar somente o escopo aceito. | Fase 4 aprovada e responsáveis de operação definidos | Dono do produto + RH + operação | Aceite formal e critérios da seção 8 atendidos. |

Preparação de monitoramento, backups e CI pode ocorrer em paralelo; sua validação final depende do ambiente e dos fluxos corrigidos. A trilha de privacidade não deve ficar para depois do desenvolvimento.

## 6. Matriz mínima de homologação

Usar ao menos dois tenants sintéticos, candidatos sem conta, colaborador, gestor, RH e superadmin, incluindo usuários e empresas inativos. Validar UI **e** API/banco.

| Teste | Critério objetivo |
|---|---|
| Permissões | Nenhuma leitura/escrita/download indevido entre tenants; nenhum papel inferior altera campos/permissões superiores. |
| Inativação | Sessão anterior não permite operações de negócio após inativação; novo login/acesso tem comportamento explícito e seguro. |
| Convites/Auth | Token válido cria um perfil correto; usado/expirado/inválido não gera sucesso enganoso; recuperação e confirmação funcionam no domínio de homologação. |
| Candidato reutilizado | E-mail existente sem verificação não muda perfil; perfil verificado pode candidatar-se a duas vagas sem duplicação indevida. |
| Concorrência | Disparar dez envios simultâneos do mesmo token/candidatura/participação: apenas uma transição/gravação válida, sem perda de arquivo anterior. |
| Upload | Arquivos sintéticos válidos de 1 MiB, 7,9 MiB e 8 MiB aceitos no caminho final; 8 MiB + 1 byte rejeitado. MIME/extensão/conteúdo incompatíveis não são liberados. |
| DISC UI | Selecionar e corrigir quatro valores distintos em cada uma das dez perguntas, voltar de etapa, recarregar e concluir; envio duplicado recusado. |
| DISC scoring | Dimensões 10–40, soma 100, repetição/falta rejeitada; empates seguem regra aprovada; versão do questionário preservada. |
| PDF | Retorna bytes `%PDF-`, abre em leitor comum, preserva acentos/quebras de página/texto longo e contém apenas dados/decisões realmente registrados; URL expira e outro tenant não acessa. |
| Agenda | Datas inválidas rejeitadas; reagendamento persiste; horário não muda com timezone do servidor; gestor registra seu feedback. |
| Métricas | Dataset acima de 1.000 candidaturas e vagas homônimas resulta em totais exatos; outras atualizações não alteram data de contratação. |
| Falhas de terceiros | Simular Storage/banco indisponíveis e IA 429/5xx/timeout/JSON inválido: erro claro, sem nota zero fabricada, sem apagar observação RH, sem sucesso falso. |
| Clima | Pesquisa fechada/tenant errado recusados; limiar de publicação e bloqueio de linhas individuais validados; nenhuma resposta extra na corrida de envios. |
| Documentos/contracheques | Versão aceita permanece auditável; erro de banco não é sucesso de upload; download é privado e rastreável. |
| Regressão geral | Login, convites, férias, benefícios, colaboradores, manual, documentos, clima e avaliações percorrem happy path e pelo menos um caminho de falha. |
| Usabilidade | Navegação por teclado, labels de formulário, foco/erros e layout em celular; botões acessíveis e sem ações duplicadas durante processamento. |
| Entrega | Pipeline bloqueia uma mudança propositalmente inválida; deploy de homologação, restauração de backup e rollback de aplicação são ensaiados. |

Esses testes devem virar testes persistentes e evidências de aceite, não apenas verificações manuais nesta conversa. Cada defeito corrigido deve ganhar regressão proporcional ao risco.

## 7. Preparação operacional obrigatória

1. **Versionamento e CI/CD:** vincular a cópia atual ao repositório correto, preservar o trabalho existente e criar histórico revisável. Não há Git utilizável nesta cópia. Configurar pipeline real de lint/tipos/testes/build/audit e revisão de mudanças. Reescrever a documentação de CI/CD para o fluxo Netlify efetivo, não a proposta Vercel ausente.
2. **Ambientes separados:** desenvolvimento, homologação e produção com Supabase, Storage, chaves e domínios separados. Previews não recebem service role de produção. Nenhum segredo em variável `NEXT_PUBLIC_*`.
3. **Segredos de runtime:** escolher e documentar o mecanismo de entrega ao Netlify. Se a chave ficar em GitHub Secrets, implementar a integração segura; alternativamente, cadastrá-la diretamente no ambiente de execução. Confirmar presença sem imprimir valores e testar rotação.
4. **Configuração externa:** URLs de callback e allowlist do Auth, CAPTCHA, domínio/remetente Resend, DNS/TLS e limites do plano Netlify/Supabase/OpenRouter. E-mail criado, enfileirado e entregue são estados diferentes.
5. **Observabilidade:** logs estruturados com identificador de requisição/tenant e redaction, monitoramento de disponibilidade, falhas de upload/PDF, erros de Auth e custo/latência IA. Alertas com responsável e procedimento, não apenas `console.error`.
6. **Auditoria:** eventos de mudança de etapa, parecer/revisão humana, downloads, alterações de permissões e exclusões. Proteger autoria/integridade dos logs no banco; não permitir que o próprio cliente forje autoria.
7. **Backup e recuperação:** incluir banco **e arquivos Storage**. Medir restauração em ambiente separado; verificar se o plano contratado oferece os recursos necessários. Definir retenção e testar exclusão sem quebrar obrigações legais.
8. **Carga/custos:** acordar volume e orçamento por tenant. Como ponto de partida a aprovar: 50 sessões simultâneas, p95 de listagens até 2 s e taxa 5xx menor que 1% sob carga de homologação, sem incluir processamento IA/PDF nessa meta. Validar duração/memória desses trabalhos separadamente; usar processamento assíncrono se excederem os limites da hospedagem.
9. **RPO/RTO e rollback:** proposta inicial a aprovar para o piloto: RPO de até 24 h e RTO de até 4 h, compatíveis com o plano contratado. Medir, não presumir. Rollback de aplicação não desfaz automaticamente uma migration; priorizar alterações de banco compatíveis e plano de recuperação/forward-fix.
10. **Suporte/incidentes:** definir quem recebe falhas, quem pode suspender um módulo e quem comunica incidente. Ensaiar indisponibilidade, abuso de upload, falha de fornecedor e restauração.

## 8. Critérios de liberação e recomendação

### Homologação técnica

- [ ] Build/lint/tipos/testes aprovados em instalação limpa e no runtime do deploy.
- [ ] Migrations e Storage reproduzíveis; estado implantado reconciliado com o código.
- [ ] P0 transversais resolvidos e testes de isolamento/campos protegidos aprovados.
- [ ] Nenhum aviso crítico/alto aplicável sem tratamento; dependências reavaliadas após upgrades.
- [ ] Jornadas e caminhos de falha do escopo ativo aprovados.

### Piloto com dados reais

- [ ] Todos os itens anteriores, mais aprovação de RH e privacidade.
- [ ] Segredos rotacionados/configurados, retenção definida e documentos reais fora de fixtures públicas.
- [ ] Backups/restauração, monitoramento, alertas, suporte e rollback exercitados.
- [ ] P0/P1 dos módulos ativos resolvidos; funcionalidades excluídas do piloto bloqueadas também no servidor/API, não apenas ocultas no menu.

### Produção ampliada

- [ ] Piloto acompanhado por período acordado, sem defeitos bloqueadores.
- [ ] Volume/custos e metas operacionais medidos e aceitos.
- [ ] Responsáveis registram aceite técnico, funcional e de proteção de dados.

**Recomendação de sequência:** primeiro tornar o sistema compilável e o banco seguro; depois fechar as jornadas RH/ATS; em seguida homologar DISC/PDF e IA com revisão humana; somente então avançar para piloto e produção. Se for necessário antecipar um piloto, IA/DISC ou outros módulos incompletos podem ficar fora do escopo por decisão explícita, com bloqueio efetivo no backend. Isso não dispensa as correções transversais.

## 9. P2 — evolução após a estabilização

Depois dos critérios acima: OCR ampliado, integrações de agenda/e-mail, notificações e automações adicionais, busca avançada no banco de talentos e refinamento visual do parecer. PDI, universidade corporativa, carreira e demais módulos anunciados como futuros não devem virar requisito implícito para este lançamento.

**Conclusão:** o projeto tem estrutura suficiente para ser recuperado e evoluir, mas o estado atual não deve receber uma aprovação de produção. O próximo marco adequado é **uma versão reproduzível em homologação com dados sintéticos**, acompanhada dos testes e critérios deste plano.
