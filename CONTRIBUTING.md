# 🤝 Guia de Contribuição

Obrigado por contribuir com o **Portal do Colaborador RGA**! Este guia descreve o fluxo de trabalho adotado pela equipe.

---

## 📋 Antes de começar

- Leia o `README.md` principal
- Configure seu ambiente conforme `README_HUBS_3_6.md`
- Tenha acesso ao repositório e ao projeto Supabase de desenvolvimento

---

## 🌳 Fluxo Git (Git Flow simplificado)

```
main          ←─── produção (protegida)
  ↑
develop       ←─── homologação
  ↑
feature/*     ←─── novas funcionalidades
fix/*         ←─── correções
hotfix/*      ←─── correções urgentes em produção
```

### Criando uma branch

```bash
# Atualize sua base
git checkout develop
git pull origin develop

# Crie sua branch
git checkout -b feature/nome-descritivo
```

### Nomeação de branches

- `feature/hub-7-ponto-eletronico`
- `fix/contracheque-download-erro-500`
- `docs/atualiza-readme-deploy`
- `refactor/extrai-componente-tabela`
- `hotfix/correcao-rls-perfis`

---

## ✍️ Convenção de commits (Conventional Commits)

```
<tipo>(<escopo opcional>): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

### Tipos aceitos

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação, sem alteração de código |
| `refactor` | Refatoração sem mudança de comportamento |
| `perf` | Melhoria de performance |
| `test` | Testes |
| `chore` | Tarefas auxiliares (deps, configs) |
| `ci` | Mudanças em CI/CD |

### Exemplos

```bash
feat(ferias): adiciona validação CLT Art. 135 (30 dias antecedência)

fix(admin): corrige race condition no convite duplicado

docs(readme): atualiza instruções de deploy no Vercel

chore(deps): atualiza next para 14.1.0
```

---

## 🔍 Antes de abrir um PR

```bash
# 1. Lint
npm run lint

# 2. Type check
npx tsc --noEmit

# 3. Build
npm run build

# 4. (Opcional) Testes
npm test
```

---

## 📤 Abrindo um Pull Request

1. Faça push da sua branch: `git push origin feature/sua-branch`
2. Abra o PR para `develop` (ou `main` em caso de hotfix)
3. Preencha o template (gerado automaticamente)
4. Aguarde o CI passar (lint + typecheck + build)
5. Solicite review de pelo menos 1 pessoa
6. Após aprovação, faça merge usando **Squash and merge**

---

## 🔒 Regras de segurança

- ❌ **NUNCA** commite `.env.local` ou qualquer arquivo com segredos
- ❌ **NUNCA** exponha `SUPABASE_SERVICE_ROLE_KEY` em componentes cliente
- ✅ Sempre valide `empresa_id` em Server Actions (multi-tenant)
- ✅ Sempre gere `audit_logs` em mutações administrativas (LGPD)
- ✅ Use Zod para validação dupla (cliente + servidor)

---

## 🆘 Dúvidas?

Abra uma issue com o template "✨ Solicitação de feature" ou contate o time de arquitetura.
