# 📋 Guia de Operações do RH - RGA People

## Bem-vindo ao Painel Administrativo!

Este guia detalha como usar cada funcionalidade do módulo de RH do RGA People. Como Super Admin, você tem acesso a todas as operações. Como RH, você pode gerenciar colaboradores, férias e benefícios.

---

## 1️⃣ Gestão de Colaboradores

### Como Convidar um Novo Colaborador?

1. Acesse: **Painel do RH** > **Colaboradores**
2. Clique no botão azul **"+ Convidar Colaborador"**
3. Preencha os campos:
   - **E-mail**: O e-mail corporativo do novo funcionário
   - **Nome Completo**: Nome completo como aparecerá no sistema
   - **Cargo**: Selecione o cargo na empresa (Colaborador, Dev Senior, etc.)
4. Clique em **"Enviar Convite"**
5. O sistema envia um e-mail com um link de convite. O colaborador clica, define sua senha e está pronto!

### Como Editar um Colaborador?

1. Na lista de colaboradores, clique no ícone de **lápis** (Editar)
2. Atualize o cargo, nome ou outras informações
3. Clique em **"Salvar Alterações"**

### Como Inativar um Colaborador?

1. Na lista de colaboradores, clique no ícone de **X** (Inativar)
2. O colaborador fica marcado como "Inativo" e perde acesso ao portal
3. Para reativar, clique no mesmo ícone novamente

---

## 2️⃣ Gestão de Férias

### Como Aprovar/Rejeitar Solicitações de Férias?

1. Acesse: **Painel do RH** > **Férias**
2. Você verá uma tabela com todas as solicitações de férias da empresa
3. Para cada solicitação:
   - **Aprovar**: Clique em ✅ (Aprovar)
   - **Rejeitar**: Clique em ❌ (Rejeitar) e adicione um motivo
4. O colaborador recebe notificação automática da decisão

### Como Visualizar o Histórico Completo?

- Clique em **"Histórico Completo"** para ver todas as férias (aprovadas, rejeitadas, pendentes)
- Filtre por período ou colaborador conforme necessário

---

## 3️⃣ Upload de Contracheques

### Como Subir um Contracheque?

1. Acesse: **Painel do RH** > **Contracheques**
2. Clique no botão **"Subir Novo"**
3. Preencha os campos:
   - **Colaborador**: Selecione o funcionário
   - **Mês/Ano**: Escolha o período (ex: Junho/2026)
   - **Arquivo PDF**: Clique e selecione o arquivo do seu computador
4. Clique em **"Enviar"**
5. O arquivo é armazenado no Supabase Storage e fica disponível instantaneamente para o colaborador

### Como o Colaborador Acessa o Contracheque?

- O colaborador vai em **Contracheques** no seu dashboard pessoal
- Vê todos os contracheques que você enviou
- Pode baixar ou visualizar diretamente no navegador

---

## 4️⃣ Gestão de Benefícios

### Como Adicionar um Novo Benefício?

1. Acesse: **Painel do RH** > **Benefícios**
2. Clique em **"+ Novo Benefício"**
3. Preencha:
   - **Nome**: Ex: "Gympass", "Seguro de Vida"
   - **Descrição**: Detalhe o que é o benefício
   - **Link do Parceiro** (opcional): URL para acessar o benefício
4. Clique em **"Criar"**
5. O benefício aparece imediatamente no dashboard de todos os colaboradores

### Como Editar um Benefício?

1. Na lista de benefícios, clique no ícone de **lápis**
2. Atualize as informações
3. Clique em **"Salvar"**

### Como Remover um Benefício?

1. Na lista, clique no ícone de **lixeira**
2. Confirme a exclusão
3. O benefício é removido e não aparece mais para os colaboradores

---

## 5️⃣ Pesquisas de Clima Organizacional

### Como Criar uma Nova Pesquisa?

1. Acesse: **Painel do RH** > **Pesquisas de Clima**
2. Clique em **"+ Nova Pesquisa"**
3. Preencha:
   - **Título**: Ex: "Pesquisa de Satisfação - Junho 2026"
   - **Descrição**: Contexto e objetivos da pesquisa
   - **Data de Expiração**: Quando a pesquisa fecha
   - **Anônima?**: Marque se as respostas devem ser anônimas
4. Clique em **"Criar Pesquisa"**
5. A pesquisa fica ativa e aparece no dashboard de todos os colaboradores

### Como Visualizar Resultados?

1. Na lista de pesquisas, clique em **"Ver Resultados"**
2. Veja gráficos e estatísticas das respostas
3. Exporte relatório em PDF se necessário

---

## 6️⃣ Manual do Colaborador (Gestão)

### Como Criar/Editar o Manual?

1. Acesse: **Painel do RH** > **Manuais**
2. Clique em **"+ Novo Manual"** ou edite um existente
3. Escreva o conteúdo (suporta formatação básica)
4. Clique em **"Publicar"**
5. Todos os colaboradores veem o manual no seu dashboard

---

## 7️⃣ Gestão de Empresas (Apenas Super Admin)

### Como Visualizar Todas as Empresas?

1. Acesse: **Gestão de Empresas** (link no menu lateral)
2. Você verá cards de todas as empresas cadastradas no sistema
3. Cada card mostra: Nome, slug, status (Ativa/Inativa)

### Como Criar uma Nova Empresa?

Atualmente, a criação de novas empresas é feita via script SQL para garantir a correta aplicação das políticas de segurança. Entre em contato com o desenvolvedor para adicionar uma nova empresa.

---

## 🎯 Atalhos Rápidos

No **Painel do RH**, você verá cards coloridos com atalhos para:
- 👥 Colaboradores
- 📅 Férias
- 📄 Contracheques
- ❤️ Benefícios
- 📊 Pesquisas
- 📖 Manuais
- 🏢 Empresas (Super Admin)

Clique em qualquer um para acessar rapidamente!

---

## ❓ Dúvidas Frequentes

**P: Como redefinir a senha de um colaborador?**
R: O colaborador pode usar "Esqueci minha senha" na tela de login. Se precisar de ajuda, entre em contato com o suporte.

**P: Posso editar um contracheque depois de enviado?**
R: Atualmente, você precisa deletar e enviar novamente. Estamos trabalhando em melhorias.

**P: Os colaboradores podem ver os dados uns dos outros?**
R: Não! Cada colaborador vê apenas seus próprios dados (suas férias, seus contracheques, etc.). O RH vê tudo da empresa.

**P: Como funciona a segurança dos dados?**
R: Todos os dados são criptografados no Supabase com políticas de RLS (Row Level Security). Apenas usuários autorizados veem informações específicas.

---

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas, entre em contato com o time de desenvolvimento.

**Última atualização**: Junho 2026
