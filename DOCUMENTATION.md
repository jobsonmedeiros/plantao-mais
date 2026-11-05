# Arquitetura e engenharia — Plantão+

Este documento descreve a arquitetura e as capacidades implementadas no repositório.
Revisão: 5 de novembro de 2026. Para o estado resumido do produto e os resultados de
validação, consulte o [README](./README.md); para o plano de correção, critérios de aceite
e requisitos pendentes, consulte o [CLAUDE.md](./CLAUDE.md).

## 1. Objetivo do produto

O Plantão+ é uma aplicação multi-instituição para organizar escalas de enfermagem e
apoiar trocas entre profissionais com aprovação gerencial. O sistema não deve coletar
nem armazenar dados clínicos de pacientes.

## 2. Estado da implementação

O backend Supabase/PostgreSQL está implementado nas migrations `0001_schema.sql` a
`0004_grants.sql`: esquema, políticas RLS, funções transacionais de negócio e concessões.
O repositório inclui 23 funções de negócio. A suíte SQL verifica isolamento e regras de
negócio em transação e termina com `ROLLBACK`; resultados recentes estão registrados no
README.

O frontend está parcialmente integrado. Autenticação e instituições usam o backend;
escalas, trocas, aprovações, notificações, setores e configurações ainda não estão
integrados aos fluxos operacionais do banco. O README e as telas indicam as limitações
atuais, sem apresentar dados fictícios como dados reais.

O CI está configurado em `.github/workflows/ci.yml`. O workflow executa typecheck, testes
de frontend e build; quando a configuração local do Supabase está presente, inicia o
banco, aplica as migrations e executa os testes SQL. Os resultados podem ser consultados
no histórico do GitHub Actions. Esse workflow valida o código, mas não publica a aplicação.

## 3. Arquitetura

### Stack

| Área | Tecnologia | Uso |
|---|---|---|
| Interface | React 18 e TypeScript 5 | Componentes e páginas |
| Build e desenvolvimento | Vite | Servidor local e build estático |
| Estilos | Tailwind CSS | Layout responsivo e tokens visuais |
| Navegação | React Router | Rotas da aplicação de página única |
| Ícones | Lucide | Ícones da interface |
| Backend e autenticação | Supabase/PostgreSQL | Auth, persistência, RLS e funções RPC |
| Hospedagem | Vercel | Publicação da aplicação e fallback das rotas SPA |

### Fluxo de dados

O frontend usa a sessão Supabase Auth para identificar o usuário. As políticas RLS
controlam as leituras autorizadas, e as operações de negócio previstas são realizadas por
funções SQL transacionais. A chave `service_role` não deve ser usada no navegador.

### Estrutura atual

```text
src/
  components/       layout, navegação e componentes reutilizáveis
  components/ui/    elementos de interface
  lib/              cliente Supabase, autenticação, navegação e utilitários
  pages/            páginas e roteamento dos módulos
supabase/
  migrations/       esquema, segurança, funções e grants
  tests/            verificações de isolamento e regras de negócio
.github/workflows/
  ci.yml            validação contínua da aplicação e do banco
```

Arquivos de referência:

- `src/App.tsx`: declara as rotas da aplicação.
- `src/pages/ModuleRoute.tsx`: encaminha módulos para as páginas correspondentes.
- `src/components/AppShell.tsx`: estrutura principal e navegação.
- `src/lib/auth-context.tsx`: estado de autenticação e operações relacionadas.
- `src/lib/supabase.ts`: cliente Supabase configurado por variáveis `VITE_*`.
- `supabase/migrations/`: definição versionada do backend.
- `.github/workflows/ci.yml`: pipeline de validação.
- `vercel.json`: fallback para as rotas da SPA.

## 4. Segurança

- RLS protege as tabelas institucionais e limita o acesso por instituição e vínculo.
- Operações de negócio são executadas por funções SQL com validação e controle
  transacional; o cliente não recebe escrita direta nas tabelas de escala e troca.
- Cadastro público não concede vínculo institucional. O acesso institucional depende
  de convite.
- A conta de administrador de plataforma não deve receber acesso a dados operacionais
  das instituições.
- A autorização não depende de papel ou instituição declarados pelo navegador.
- A aplicação não deve armazenar dados clínicos de pacientes.
- Alertas trabalhistas são informativos e não constituem parecer jurídico.

## 5. Qualidade e validação

O workflow de integração contínua é executado em pushes para `main` e pull requests
direcionados a `main`. Ele instala dependências, verifica tipos, executa testes de
interface e build. Com Supabase local disponível na branch, também aplica as migrations
e executa a suíte SQL. A proteção da branch `main` está desabilitada no momento, então o
resultado do CI ainda não bloqueia automaticamente a mesclagem.

Há testes iniciais de frontend; cobertura global e testes dos demais módulos ainda estão
pendentes. A quantidade de testes e os resultados recentes de validação estão registrados
no README e no histórico de Actions.

## 6. Publicação

O código é hospedado no GitHub, na branch `main`, e a aplicação é publicada na Vercel.
O `vercel.json` configura o fallback necessário para acessar diretamente rotas da SPA.
O workflow de GitHub Actions valida alterações; não é um mecanismo de deploy.

## 7. Documentação do projeto

- [README](./README.md): visão do produto, estado atual, instruções e roadmap público.
- [CLAUDE.md](./CLAUDE.md): plano diretor, achados priorizados, requisitos e critérios
  de aceite.
- Este documento: descrição técnica da arquitetura e das capacidades implementadas.

As próximas entregas e os respectivos estados estão no roadmap do README. Um item só
deve ser marcado como concluído após a verificação de seu critério de aceite.

## Transparência de autoria

O projeto é de Jobson Medeiros e foi desenvolvido com apoio de ferramentas de IA. O
histórico de publicação identifica a autoria dos commits.
