# Plantão+

**Gestão de escalas e trocas de plantão para instituições de saúde.**

Plataforma SaaS multi-instituição para hospitais, clínicas e UPAs montarem escalas
mensais de enfermagem, negociarem trocas de plantão com rastreabilidade e submeterem
toda alteração à aprovação da gerência antes de a escala oficial mudar.

[![React](https://img.shields.io/badge/React-18-1F5FA6)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-1F5FA6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-1F5FA6)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-1F5FA6)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-1E8F63)](https://supabase.com)

---

## Sumário

- [O problema](#o-problema)
- [A solução](#a-solução)
- [Estado atual](#estado-atual)
- [Arquitetura](#arquitetura)
- [Modelo de segurança](#modelo-de-segurança)
- [Perfis e permissões](#perfis-e-permissões)
- [Como rodar](#como-rodar)
- [Testes](#testes)
- [Roadmap](#roadmap)
- [Decisões técnicas](#decisões-técnicas)
- [Governança do repositório](#governança-do-repositório)

---

## O problema

Escalas de plantão em instituições de saúde ainda são montadas em planilhas, papel ou
grupos de mensagem. As consequências são recorrentes e mensuráveis:

| Sintoma | Causa raiz |
|---|---|
| **Plantões descobertos** — ninguém percebe que um turno ficou vazio | Falta de verificação automática de cobertura mínima |
| **Trocas informais por mensagem**, sem registro | Ausência de fluxo formal com estado e histórico |
| **Conflito de horário** descoberto na hora do plantão | Nenhuma validação de sobreposição ou de descanso entre jornadas |
| **Escala oficial divergente** da realidade | Alteração sem controle de versão nem aprovação |
| **Sem trilha de auditoria** para questionamento trabalhista | Nenhum registro de quem alterou o quê e quando |

## A solução

O Plantão+ centraliza o ciclo completo, do rascunho à escala oficial:

```
1. Administração da plataforma   cadastra a instituição e convida o administrador
2. Administração da instituição  cria unidades, setores e tipos de plantão
3. Gerência                      convida a equipe por link de convite
4. Gerência                      monta a escala mensal com validação de conflito
5. Gerência                      publica (com verificação de cobertura mínima)
6. Profissional                  consulta a própria escala
7. Profissional                  propõe troca direta ou oferece no mural
8. Colega                        aceita ou recusa a proposta
9. Gerência                      aprova ou recusa com justificativa
10. Sistema                      troca os plantões, versiona a escala e notifica todos
```

Todo passo 3 a 10 é executado no banco de dados por funções transacionais. O cliente
nunca escreve diretamente nas tabelas de negócio.

---

## Estado atual

O repositório tem **duas trilhas com maturidades diferentes**. Esta é a informação mais
importante deste README e é mantida atualizada a cada entrega verificada.

| Trilha | Situação | Detalhe |
|---|---|---|
| **Backend (Supabase/PostgreSQL)** | 🟢 Avançado | Esquema, RLS, 23 funções de negócio e grants implementados; 35 verificações automatizadas passaram no Supabase local |
| **Frontend (React)** | 🟡 Parcial | Autenticação e instituições integradas. **Escalas, trocas, aprovações, notificações, setores e configurações ainda não consomem o backend** — telas em construção |
| **Qualidade** | 🟠 Inicial | `typecheck`, build e 6 testes de frontend passam; workflow de CI configurado, mas a proteção de merge da `main` ainda não está habilitada; lint e cobertura global pendentes |
| **Documentação** | 🟢 Atualizada | Este README registra o estado do produto; `CLAUDE.md` contém o plano de correção; `DOCUMENTATION.md` descreve a arquitetura implementada |

> **Transparência:** telas sem backend integrado estão marcadas na própria interface.
> Nenhuma tela apresenta dado fictício como se fosse real. O plano completo de correção,
> com achados priorizados, critérios de aceite e requisitos pendentes de decisão, está em
> [`CLAUDE.md`](./CLAUDE.md).

### Números do repositório

| Métrica | Valor |
|---|---|
| Código de aplicação (TS/TSX) | ~4.800 linhas |
| SQL de backend | 1.394 linhas em 4 migrations |
| Funções de negócio (RPC) | 23 |
| Políticas RLS | 17 tabelas protegidas |
| Verificações de banco automatizadas | 35 passaram, 0 falharam |
| Chamadas do frontend ao backend | Autenticação e instituições; fluxos operacionais ainda pendentes |
| Testes de frontend | 6 passaram; cobertura global ainda não medida |

---

## Arquitetura

### Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 18 + TypeScript 5 (strict) + Vite 5 |
| Estilo | TailwindCSS 3 com paleta semântica (`navy`, `brand`, `ok`, `warn`, `danger`) |
| Ícones | lucide-react |
| Roteamento | react-router-dom 7 |
| Backend | Supabase (PostgreSQL 15, Row Level Security, RPC) |
| Autenticação | Supabase Auth (e-mail + senha, recuperação, convite por token) |
| Deploy | Vercel (SPA com rewrite) |

### Estrutura

```
src/
  components/          apresentação reutilizável (AppShell, AuthLayout, ShiftChip, ui/)
  lib/                 infraestrutura (supabase, auth-context, nav, modules, utils)
  pages/               uma página por rota
supabase/
  migrations/          0001_schema · 0002_security · 0003_functions · 0004_grants
  tests/               01_isolamento_e_trocas.sql (49 verificações definidas; 35 resultados na execução registrada) · CONCORRENCIA.md
```

A estrutura-alvo, com separação em `features/` por domínio e regra de dependência
explícita, está descrita na §4 do [`CLAUDE.md`](./CLAUDE.md).

### Fluxo de dados

```
Componente (React)
    │  useQuery / useMutation
    ▼
features/<domínio>/api.ts  ──► supabase.rpc("funcao_segura", {...})
                                     │
                                     ▼
                        Função SQL SECURITY DEFINER
                        • valida papel e escopo (workspace/instituição)
                        • valida regra de negócio
                        • trava linhas em ordem de id
                        • executa tudo em uma transação
                        • grava auditoria e notificação
                                     │
                                     ▼
                     Row Level Security decide o que o cliente lê
```

---

## Modelo de segurança

O Plantão+ adota **defesa em profundidade**: esconder no frontend é experiência de uso;
bloquear no banco é segurança. Nenhuma decisão de autorização depende do que o navegador
envia.

| Camada | Mecanismo | O que impede |
|---|---|---|
| **Isolamento multi-instituição** | `institution_id` em toda tabela + FKs compostas `(id, institution_id)` | Referência cruzada entre instituições |
| **Autorização** | RLS em 17 tabelas + 13 helpers `SECURITY DEFINER` avaliados sobre `auth.uid()` | Leitura de dado de outra instituição |
| **Escrita de negócio** | `revoke all` + escrita só por 19 RPCs concedidas | Bypass de regra de negócio |
| **Funções auxiliares** | `alter default privileges ... revoke execute` | Nova função nascer acessível por engano |
| **Privilégio de plataforma** | `profiles.is_platform_admin` sem privilégio de `UPDATE` no cliente | Autopromoção a administrador |
| **Convite** | Cadastro público não cria vínculo; token com expiração de 14 dias e e-mail vinculado | Entrada não autorizada |
| **Convivência de dados** | Exclusão gist (`tstzrange`) por vínculo | Dois plantões sobrepostos para a mesma pessoa |
| **Concorrência** | `for update` em ordem de id + revalidação dentro da transação | Dupla aprovação da mesma troca |
| **Rastro** | Gatilho de auditoria em 13 tabelas | "Não fui eu que alterei" |
| **Pronunciamento** | `set search_path = ''` em toda função `SECURITY DEFINER` | Sequestro de resolução de nome |

### Princípios não negociáveis

1. **Nunca `service_role` no navegador.** O cliente usa apenas a chave pública.
2. **RLS em toda tabela institucional.** Teste de acesso cruzado obrigatório em PR.
3. **Cadastro público não concede acesso.** Acesso vem sempre de `invitations`.
4. **Nenhum dado clínico de paciente é armazenado**, em nenhum campo.
5. **Alertas trabalhistas do sistema não são parecer jurídico.** A interface informa isso
   onde o alerta aparece.
6. **`accepted` em uma proposta significa aceite do colega — nunca aprovação final.**
   A escala oficial só muda em `decide_swap`.

---

## Perfis e permissões

| Perfil | Escopo | Telas |
|---|---|---|
| **Administração da plataforma** | Global. Cadastra e ativa instituições. **Não lê dados operacionais** de dentro das instituições | Instituições |
| **Administração da instituição** | Toda a instituição. Gerencia unidades, setores, equipe, configurações e todas as escalas | Dashboard, Setores, Profissionais, Configurações |
| **Gerência** | Apenas os setores onde `sector_members.is_manager = true` | Escalas, Profissionais, Setores, Trocas, Aprovações, Relatórios, Configurações |
| **Profissional** | Próprios plantões + leitura da escala publicada do próprio setor | Minha escala, Escala dos colegas, Trocar plantão, Minhas solicitações, Notificações, Perfil |

Um usuário pode ter **múltiplos vínculos** — por exemplo, profissional em uma instituição
e gerente em outra. O seletor de instituição no cabeçalho troca o contexto ativo, e o
papel exibido vem sempre do vínculo ativo, nunca de uma escolha de interface.

---

## Como rodar

### Pré-requisitos

Node.js 20+ · npm 10+ · Docker (para o Supabase local) · [Supabase CLI](https://supabase.com/docs/guides/cli)

### Passos

```bash
# 1. Clonar e instalar
git clone https://github.com/jobsonmedeiros/plantao-mais.git
cd plantao-mais
npm install

# 2. Subir o banco local e aplicar as migrations
supabase start
supabase db reset

# 3. Configurar variáveis de ambiente
cp .env.example .env
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
# obtenha os valores com: supabase status -o env

# 4. Rodar
npm run dev
```

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | `tsc --noEmit` + build de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Verificação de tipos, sem emitir arquivos |
| `npm test` | Executa os testes de interface com Vitest e Testing Library |

### Integração contínua (GitHub Actions)

O workflow [`ci.yml`](./.github/workflows/ci.yml) roda em cada push para `main` e
pull request direcionado a `main`. Ele instala as dependências, verifica os tipos,
executa os testes de interface e gera o build. Quando a configuração local do Supabase
estiver presente na branch, também inicia o banco, reaplica as migrations e executa os
testes SQL. Não precisa de secrets do Supabase; o banco usado nos testes é local ao runner.

Para exigir a validação antes de mesclar: em **Settings → Branches** (ou **Rules → Rulesets**),
crie uma regra para `main` e marque **Require status checks to pass before merging**.
Selecione o check **Validar aplicação e banco**.

### Primeiro administrador de plataforma

Após criar sua conta pela aplicação, promova-a via SQL (não há interface para isso, por
decisão de segurança):

```sql
update public.profiles set is_platform_admin = true where email = 'seu.email@dominio.com';
```

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública (anon). **Nunca** use `service_role` |

`.env`, `.env.local` e `.env.*.local` **não são versionados**. O `.env.example` mostra o
formato esperado.

### Segurança da autenticação

O Supabase local exige confirmação de e-mail e senha com pelo menos 10 caracteres,
incluindo maiúsculas, minúsculas e números. As telas de cadastro, aceite de convite,
redefinição e alteração de senha aplicam a mesma regra. É possível pedir o reenvio da
confirmação nas telas de cadastro pendente, login e convite.

O requisito de confirmação também foi verificado no projeto hospedado: a configuração
pública do Auth retorna `mailer_autoconfirm = false`. Isso confirma que o login automático
após cadastro está desativado. O fluxo hospedado de recuperação de senha foi validado
manualmente: o e-mail foi entregue, a senha foi redefinida e o link retornou à aplicação
publicada na Vercel. No ambiente local, o Mailpit recebeu o e-mail de confirmação e,
após o ajuste da allowlist, o link de convite retornou ao caminho `/convite/:token`.
Uma chamada automatizada separada retornou um redirect para `localhost`; essa divergência
não foi reproduzida no teste manual, e sua causa não foi determinada.

`supabase/config.toml` define o comportamento do **ambiente local**. No projeto
Supabase hospedado, confirme em **Authentication → Sign In / Providers → Email** que
confirmação obrigatória e requisitos de senha estão alinhados. Configure também um SMTP
próprio para entrega confiável de e-mails e inclua
as URLs de retorno do app na lista de URLs permitidas do projeto, cobrindo as rotas
`/app`, `/convite/*` e `/redefinir-senha`. No ambiente local, `supabase/config.toml`
permite `http://localhost:5173/**` e `http://127.0.0.1:5173/**`.
Esses ajustes do projeto hospedado não são aplicados por `supabase start` nem por este
repositório.

---

## Testes

### Banco de dados

O script roda em uma única transação terminando em `ROLLBACK` — não deixa dados no banco.

```bash
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" \
  -v ON_ERROR_STOP=1 \
  -f supabase/tests/01_isolamento_e_trocas.sql
```

Saída verificada em 5 de novembro de 2026: tabela com coluna `resultado` = `PASSOU`
nas 35 verificações e `falharam = 0`. Qualquer `FALHOU` interrompe com exceção.

**O que está coberto hoje:** isolamento entre duas instituições (leitura e escrita),
escrita direta negada, escalada de privilégio negada, rascunho invisível ao profissional,
sobreposição de horário, fluxo completo de troca (aceite não altera escala; aprovação
troca os dois plantões; segunda aprovação falha; não-gerente falha), notificações
isoladas por usuário, aceite de convite com e-mail correto e incorreto.

**O que falta:** teste de concorrência automatizado (hoje é roteiro manual em
`supabase/tests/CONCORRENCIA.md`) e cobertura frontend abrangente. Rastreado em `QA-02`
e `QA-03` do [`CLAUDE.md`](./CLAUDE.md).

### Frontend

Execute `npm test` para verificar os fluxos de login, reenvio de confirmação, cadastro
público e aceite de convite, além da política de senha e tradução de erros do Supabase.
Na validação local de 5 de novembro de 2026, os 6 testes passaram.
Essa cobertura inicial não conclui o item `QA-03`, que ainda exige testes para as demais
rotas e módulos da aplicação.

---

## Roadmap

**Legenda:** ✅ concluído e verificado · 🟡 em andamento · ⬜ pendente · 🔒 bloqueado por decisão

Cada item concluído tem critério de aceite verificado conforme a §7 do
[`CLAUDE.md`](./CLAUDE.md). O roadmap é atualizado **no mesmo commit** que entrega o item.

### Fase 1 — Estabilização e qualidade de base

| | Item | ID |
|---|---|---|
| ✅ | Linha de base commitada e publicada na `main` | SEC-01 |
| ⬜ | Pre-commit hook de varredura de segredos (`gitleaks`) | SEC-01 |
| ✅ | Política de senha forte (10 caracteres + composição) no código e Supabase local | SEC-02 |
| ✅ | Confirmação obrigatória e fluxo de recuperação com e-mail verificados no hospedado; confirmação/convite exercitados localmente | SEC-03 |
| ✅ | Isolar modo demonstração do bundle de produção | SEC-04 |
| 🟡 | CI configurado e validado; proteção de merge da `main` ainda não habilitada | QA-01 |
| ⬜ | ESLint + Prettier | QA-04 |
| ⬜ | Remover `dist/` do diretório de trabalho | QA-06 |
| ✅ | README e `CLAUDE.md` refletindo o estado real | DOC-01 · DOC-02 |

### Fase 2 — Integridade do banco de dados

| | Item | ID |
|---|---|---|
| ⬜ | Revalidar cobertura mínima após troca 1:0 | DB-01 |
| ⬜ | Validar `min_rest_hours` na montagem da escala | DB-02 |
| ⬜ | Normalizar comparação de cargo (`required_position`) | DB-03 |
| ⬜ | Índices gist e de auditoria | DB-04 |
| ⬜ | Política de retenção de `audit_logs` | DB-05 |
| ⬜ | RPCs de desativação de instituição, unidade e setor | DB-06 |
| ⬜ | Revogar escrita direta em `institutions` | SEC-05 |
| ⬜ | Agendar `pg_cron` de lembretes de plantão | SEC-06 |
| ⬜ | Concorrência automatizada no CI (3 cenários) | QA-02 |
| ⬜ | Ampliar suíte SQL para ≥ 70 verificações | QA-05 |

### Fase 3 — Integração do frontend

| | Item | ID |
|---|---|---|
| ⬜ | Gerar `database.types.ts` e tipar o cliente Supabase | FE-04 |
| ⬜ | Adotar TanStack Query (remover controle manual de versão) | FE-03 |
| ⬜ | Fonte única de verdade para papéis (`roles.ts`) | FE-05 |
| ⬜ | Rotas declarativas com `mode` em vez de `if`-chain | FE-06 |
| ⬜ | Unificar rota de `/app/meu-perfil` | FE-02 |
| ⬜ | Reestruturar em `features/` (nenhum arquivo > 250 linhas) | FE-07 |
| ⬜ | **Escalas**: grade real, criar, editar célula, publicar, cobertura | FE-01 |
| ⬜ | **Trocas**: propor, mural, aceitar, recusar, cancelar | FE-01 |
| ⬜ | **Aprovações**: aprovar/rejeitar com justificativa | FE-01 |
| ⬜ | **Notificações**: tela + contador no sino + Realtime | FE-08 |
| ⬜ | **Setores** e **Configurações**: CRUD e regras | FE-09 |
| ⬜ | Exportação de PDF gerada no servidor | FE-10 |
| 🟡 | Testes iniciais de frontend (6 testes); cobertura ≥ 60% em `lib` ainda pendente | QA-03 |

### Fase 4 — Requisitos e fechamento

| | Item | ID |
|---|---|---|
| 🔒 | Definir política de alteração de escala publicada | Q-01 |
| 🔒 | Definir antecedência mínima para troca | Q-02 |
| 🔒 | Definir limite de jornada | Q-03 |
| 🔒 | Definir janela do lembrete de plantão | Q-04 |
| 🔒 | Definir cobertura mínima por cargo | Q-05 |
| 🔒 | Definir vaga aberta / plantão descoberto | Q-06 |
| 🔒 | Definir notificação por e-mail ou push | Q-07 |
| 🔒 | Definir escopo de leitura do administrador de plataforma | Q-08 |
| 🔒 | Confirmar suporte a múltiplos vínculos | Q-09 |
| 🔒 | Definir tratamento de desligamento com plantões futuros | Q-10 |
| 🔒 | Definir auditoria visível à instituição | Q-11 |
| 🔒 | Definir retenção de dados (LGPD) | Q-12 |
| ⬜ | Criar `docs/requisitos.md` com as decisões | DOC-03 |
| ⬜ | Relatório final: passou / falhou / pendente | Etapa 8 |

### Versão 2 — Relatórios e analytics

| | Item |
|---|---|
| ⬜ | Distribuição de plantões por profissional |
| ⬜ | Cobertura por turno e por período |
| ⬜ | Trocas aprovadas e recusadas |
| ⬜ | Exportação de relatório em PDF |

---

## Decisões técnicas

| Decisão | Justificativa | Consequência |
|---|---|---|
| **Autorização no PostgreSQL, não na aplicação** | Um único ponto de verdade que nenhum cliente contorna; a interface pode mudar sem reabrir a discussão de segurança | Toda regra nova exige migration e teste de acesso cruzado |
| **Escrita de negócio só por RPC transacional** | Regras como "troca preserva cobertura" e "não sobrepor plantões" precisam ser atômicas | Cada operação exige função dedicada; não há CRUD genérico |
| **FKs compostas `(id, institution_id)`** | Impede no próprio esquema que uma referência atravesse instituições | Toda tabela institucional precisa de `unique (id, institution_id)` |
| **Exclusão gist com `tstzrange`** | Resolve sobreposição inclusive para plantões que cruzam a meia-noite | Requer extensão `btree_gist` |
| **`for update` em ordem de id** | evita deadlock entre duas negociações cruzadas | Toda função que trava duas linhas precisa respeitar a ordenação |
| **Snapshot de versão em `schedule_versions`** | Permite reconstruir a escala exatamente como foi publicada | Cresce com o número de publicações; ver DB-05 |
| **Acessibilidade como requisito** | Profissional consulta escala no corredor do hospital, no celular | Toda tela nova passa pelo checklist da §4.5 do `CLAUDE.md` |
| **Chips com letra além de cor** (`D`, `N`, `F`, `Fé`) | Daltonismo não pode impedir leitura da escala | Três tons diferentes para o mesmo significado |
| **Honestidade da interface** | Um protótipo que parece pronto é pior que um protótipo assumido | Tela sem backend diz, na tela, que não está conectada |

---

## Governança do repositório

### Regra de ouro

> Um item do roadmap só recebe ✅ no mesmo commit que entrega o código **e** o critério de
> aceite verificado. Progresso declarado sem verificação é regressão documental.

### Checklist antes de qualquer merge

- [ ] `npm run typecheck` sem erro
- [ ] `npm run build` sem erro
- [ ] `npm run lint` sem erro *(a partir da Fase 1)*
- [ ] `supabase db reset` aplica todas as migrations
- [ ] `supabase/tests/01_isolamento_e_trocas.sql` → 0 `FALHOU`
- [ ] Se mexeu em autorização: teste de acesso cruzado incluído
- [ ] Se mexeu em requisito: documento em `docs/requisitos.md` atualizado
- [ ] Se entregou item do roadmap: linha marcada neste README

### Convenções

**Commits** em português, no imperativo, referenciando o ID do achado:

```
fix(DB-01): revalida cobertura mínima ao aprovar troca 1:0
feat(FE-01): integra grade de escalas ao backend
docs(DOC-01): atualiza roadmap do README com estado verificado
chore(QA-01): adiciona pipeline de CI
```

**Branches:** `main` protegida · `fix/<id>` · `feat/<id>` · `chore/<id>`.

**Idioma:** código, comentários, mensagens de erro, commits e documentação em português
do Brasil.

### Documentos do repositório

| Arquivo | Papel |
|---|---|
| `README.md` | Visão de produto, arquitetura e roadmap público |
| [`CLAUDE.md`](./CLAUDE.md) | **Plano diretor de correção**: achados priorizados, requisitos pendentes, critérios de aceite, regras invioláveis |
| [`DOCUMENTATION.md`](./DOCUMENTATION.md) | Arquitetura técnica e capacidades implementadas |
| `supabase/tests/CONCORRENCIA.md` | Roteiro manual dos cenários de concorrência |
| `.env.example` | Formato das variáveis de ambiente |

### Aviso legal

O Plantão+ é uma ferramenta de apoio à gestão de escalas. Os alertas gerados pelo sistema
— conflito de horário, intervalo mínimo entre jornadas, cobertura mínima — são
verificações automatizadas de configuração e **não constituem parecer jurídico,
trabalhista ou de conformidade**. A responsabilidade pela adequação às normas aplicáveis
(leis trabalhistas, convenções coletivas, resoluções dos conselhos profissionais e LGPD)
é da instituição contratante.

O sistema **não armazena dados clínicos de pacientes**.

---

<sub>Plantão+ · documento mantido junto com o código · última revisão: Fevereiro de 2026</sub>
