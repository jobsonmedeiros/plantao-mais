# Plantão+ — Plano Diretor de Correção e Engenharia

> **Documento normativo.** Este arquivo é a fonte de verdade para qualquer agente ou
> desenvolvedor que altere o Plantão+. Ele substitui a versão anterior (que descrevia
> apenas o estado do código) por um plano de correção com lacunas de requisito
> explicitadas, severidade, critério de aceite e rastreabilidade.

**Produto:** SaaS multi-instituição de escalas e trocas de plantão de enfermagem.
**Idioma:** todo código, comentário, mensagem de erro, commit e documento em português do Brasil.
**Revisão deste documento:** 2026-02 · substitui a revisão anterior.

---

## 0. Como trabalhar neste repositório

1. **Uma etapa por vez.** Não avance de fase sem a anterior estar com o critério de aceite cumprido e verificado.
2. **Rode antes de dizer que está pronto.** `npm run typecheck`, `npm run build` e o teste SQL do banco. Se não rodou, não está pronto.
3. **Nunca simule funcionalidade.** Tela sem backend diz, na própria tela, que não está conectada (ver §4.6).
4. **Nunca marque como concluído** um item do `README.md` sem que o critério de aceite da §7 tenha sido verificado.
5. **Commits pequenos e atômicos**, em português, no imperativo (`corrige`, `adiciona`, `remove`). Um commit por item de correção, referenciando o ID (`fix(DB-05): ...`).
6. **Antes de qualquer feature nova**, o repositório precisa estar limpo (§2.1). Trabalho não commitado não é base confiável.

### Comandos

```bash
supabase start          # sobe o Supabase local
supabase db reset       # reaplica 0001..000N do zero
npm install
npm run typecheck       # tsc --noEmit
npm run dev             # servidor de desenvolvimento
```

### Variáveis de ambiente

`.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
**Nunca** coloque a `service_role` no navegador nem em qualquer arquivo versionado.

### Primeiro administrador de plataforma

```sql
update public.profiles set is_platform_admin = true where email = '...';
```

---

## 1. Regras invioláveis (não podem quebrar em nenhuma alteração)

| # | Regra | Consequência da violação |
|---|---|---|
| R1 | Backend é **Supabase direto**. Nunca Lovable Cloud. Nunca `service_role` no cliente. | Vazamento total de dados entre instituições |
| R2 | **RLS habilitada em toda tabela institucional.** Autorização no banco, não só na interface. | Cliente lê dados de outro hospital |
| R3 | Cadastro público **não** concede acesso institucional. Acesso vem de `invitations`. | Qualquer pessoa entra numa instituição |
| R4 | `shifts`, `memberships`, `sector_members`, `swap_*` só mudam por funções SQL transacionais (`security definer`, `set search_path = ''`). Cliente não tem INSERT/UPDATE nessas tabelas. | Bypass de todas as regras de negócio |
| R5 | Toda tabela institucional carrega `institution_id` e usa **FK composta `(id, institution_id)`**. | Referência cruzada entre instituições |
| R6 | **Não armazenar dados clínicos de pacientes.** Nenhum campo, nenhum texto livre obrigatório, nenhum comentário. | Exposição de dado sensível de saúde (LGPD art. 11) |
| R7 | Alertas trabalhistas do sistema **não são parecer jurídico**. A interface deve dizer isso onde o alerta aparece. | Passivo jurídico por promessa indevida |
| R8 | `swap_requests.status` ∈ `pending, awaiting_manager, approved, denied, cancelled`. `swap_proposals.status` ∈ `pending, accepted, rejected, cancelled`. **`accepted` é aceite do colega, nunca aprovação final.** | Confusão de estado, escala muda sem gerência |
| R9 | Mensagens de erro em português; falta de permissão usa `errcode 42501`; conflito de horário usa `23P01`. | Frontend não consegue tratar erro programaticamente |
| R10 | Rotas privadas exigem sessão **e** vínculo institucional ativo **ou** `is_platform_admin`. | Usuário sem vínculo acessa dados |

---

## 2. Achados — estado atual do repositório

Levantamento feito sobre o código em `src/` (4.813 linhas TS/TSX), `supabase/migrations/`
(1.394 linhas SQL), `supabase/tests/` e arquivos de configuração.

### 2.1 Linha de base (baseline)

| Artefato | Situação medida |
|---|---|
| `supabase/migrations/0001_schema.sql` | 298 linhas — esquema completo (Etapas 2–7) |
| `supabase/migrations/0002_security.sql` | 263 linhas — helpers de autorização, gatilho de auditoria, 17 políticas RLS |
| `supabase/migrations/0003_functions.sql` | 771 linhas — 23 funções de negócio |
| `supabase/migrations/0004_grants.sql` | 62 linhas — `revoke all` + concessões explícitas + Realtime |
| `supabase/tests/01_isolamento_e_trocas.sql` | 333 linhas, **49 verificações** (`_t_check`), transação + `ROLLBACK` |
| `supabase/tests/CONCORRENCIA.md` | Guia **manual** de teste de concorrência (não automatizado) |
| `npm run typecheck` | **Passa** (0 erros) com `strict: true` |
| Cobertura de testes de frontend | **0%** — nenhum Vitest/Jest, nenhuma Testing Library |
| Lint / formatação | **Ausente** — sem ESLint, sem Prettier |
| Integração contínua | **Ausente** — sem `.github/workflows` |
| Tipos gerados do banco | **Ausente** — sem `database.types.ts` |
| Working tree do git | **Sujo** — 5 arquivos com modificação não commitada |

### 2.2 O achado estrutural: duas realidades divergentes

O backend está implementado e é de boa qualidade. O frontend **não está integrado a ele**.

| Camada | Estado real |
|---|---|
| Banco de dados | Etapas 2–7 implementadas (esquema, RLS, funções, grants) |
| Frontend | **4 chamadas ao backend** no total: `get_invitation`, `accept_invitation`, `create_institution`, `update profiles` |
| Escalas | **Dados fictícios no arquivo** — grade "Novembro 2026 / Hospital Santa Maria" fixa em `SchedulesPage.tsx` |
| Profissionais | **8 profissionais fictícios** em `ProfessionalsPage.tsx`; convite apenas altera `useState` |
| Trocas | **Mural fictício** em `SwapsPage.tsx` (`muralInicial`) |
| Aprovações | **Fictício** em `ApprovalsPage.tsx` |
| Dashboard | Indicadores descritivos, **sem números** — correto, mas não entrega valor |
| Notificações | Função `mark_notifications_read` concedida; **tela não existe**, sino sem contador, Realtime não assinado |
| Setores / Configurações | **Tela não existe** — só placeholder `ModulePage` |
| RPCs prontas e **nunca chamadas** | `create_invitation`, `create_schedule`, `upsert_shift`, `remove_shift`, `coverage_gaps`, `publish_schedule`, `create_swap_request`, `propose_swap`, `respond_swap_proposal`, `cancel_swap_request`, `decide_swap`, `set_membership_status`, `set_sector_member_status`, `mark_notifications_read`, `send_shift_reminders` |

**Consequência:** o produto parece pronto em demonstração e não é. Isso viola R-§0.3 e
contradiz o `README.md` atual, que declara a Etapa 1 concluída e a Etapa 2 como "próxima".

---

## 3. Registro de defeitos priorizados

**Severidade:** `S1` bloqueia uso real / risco de segurança · `S2` dívida grave / bloqueia escalabilidade · `S3` qualidade e manutenibilidade.
**Status:** `Aberto` · `Em correção` · `Corrigido` · `Aceito (não faremos)`.

### 3.1 Segurança e operação — fase 1

| ID | Sev | Achado | Evidência | Correção exigida | Critério de aceite |
|---|---|---|---|---|---|
| SEC-01 | S1 | `.env` com anon key real no diretório de trabalho e working tree sujo com 5 arquivos modificados não commitados | `git status --short` → `MM src/components/AppShell.tsx`, `MM src/lib/auth-context.tsx`, `MM src/pages/Login.tsx`, `M src/pages/Dashboard.tsx`, `M src/pages/InstitutionsPage.tsx` | Commitar o estado atual numa branch `chore/baseline`; instalar `gitleaks` ou `git-secrets` em pre-commit hook; documentar no README que `.env*` nunca é versionado | `git status` limpo; hook bloqueia commit com padrão de chave; `.gitignore` cobre `.env.local` |
| SEC-02 | S1 | Política de senha fraca: mínimo **6 caracteres**, sem exigência de composição | `supabase/config.toml:183` `minimum_password_length = 6`; `:184` `password_requirements = ""` | Elevar para **10** caracteres e `password_requirements = "lower_upper_letters_digits"` | Config atualizado em `config.toml`; cadastro com senha fraca é rejeitado no teste manual |
| SEC-03 | S1 | Confirmação hospedada e recuperação de senha verificadas; uma chamada automatizada isolada retornou URL localhost, divergindo do fluxo real confirmado pelo responsável | Auth settings: `mailer_autoconfirm = false`; responsável confirmou que recebeu o e-mail de recuperação, redefiniu a senha e retornou ao portal Vercel; signup local exige confirmação e preserva o redirect de convite | Manter confirmação obrigatória e monitorar redirects se o problema reaparecer | Auth hospedado exige confirmação; e-mail chega; recuperação retorna ao portal Vercel; confirmação e convite testados localmente; telas oferecem reenvio |
| SEC-04 | S2 | Modo demonstração vaza para o código de produção: `demoRole` e `definirDemoRole` vivem no contexto público e `createDemoUser` fabrica um `User` falso | `src/lib/auth-context.tsx` (`createDemoUser`, `createDemoContext`, `aplicarDemoMode`, `demoRole`) | Isolar em `src/lib/demo/` carregado só quando `!isSupabaseConfigured` **e** `import.meta.env.DEV`; remover `demoRole` do tipo do contexto em produção | Build de produção não contém as strings `demo@plantao-mais.local` nem `createDemoContext` (verificável por `grep` no `dist/`) |
| SEC-05 | S2 | `institutions` recebe `insert`/`update` diretos ao cliente **e** existe a RPC `create_institution` que faz validação de fuso e cria convite | `0004_grants.sql`: `grant insert, update on public.institutions ...` | Revogar o grant direto em `institutions`; escrita só pela RPC | Tentativa de `insert` direto em `institutions` retorna erro de permissão; teste SQL cobre |
| SEC-06 | S2 | Lembrete de plantão nunca dispara: `send_shift_reminders()` existe, não é concedida (correto) mas **nenhum agendamento `pg_cron` foi criado** | `0003_functions.sql:754`; comentário em `:752` sugere o schedule; nenhuma migration o cria | Criar `0005_cron.sql` com `cron.schedule('shift-reminders', '0 * * * *', ...)`; adicionar índice que a função já usa | Inserir plantão em <24 h e verificar que a notificação `shift_reminder` aparece após o job; índice único impede duplicata |
| SEC-07 | S3 | Anon key presente em `.env.local` com prefixo `sb_publi…` (chave publicável nova), enquanto `.env` usa JWT `eyJ…`. Dois formatos com semânticas diferentes | `.env` e `.env.local` | Padronizar um único formato; documentar qual é o esperado no README | `.env.example` descreve exatamente o formato usado |

### 3.2 Banco de dados e regras de negócio — fase 2

| ID | Sev | Achado | Evidência | Correção exigida | Critério de aceite |
|---|---|---|---|---|---|
| DB-01 | S1 | `decide_swap` **não revalida cobertura mínima** após a troca. O comentário justifica "troca 1:1 não muda a contagem", mas a troca **1:0** (quando `target_shift_id` é `null`) retira o plantão do solicitante sem contrapartida | `0003_functions.sql:634` — comentário nas linhas 632–633 | Chamar `coverage_gaps(s1.schedule_id)` antes do `update` final; se houver lacuna nova, `raise exception` com mensagem em português | Teste: troca 1:0 que zera cobertura mínima é recusada; troca 1:1 no mesmo turno é aceita |
| DB-02 | S1 | `upsert_shift` **não valida `min_rest_hours`**. A regra de descanso só é aplicada na aprovação da troca, então a gerência monta escala ilegal e o sistema só reclama depois | `0003_functions.sql:234` não chama `has_rest_violation` | Adicionar validação em `upsert_shift` com parâmetro `p_force boolean default false` (mesmo padrão de `publish_schedule`), retornando `hint = 'rest_violation'` | Escala com 2 plantões colados em setor com `min_rest_hours = 11` é recusada; com `p_force` é aceita e notificada |
| DB-03 | S2 | `shift_types.required_position` é comparado com `sector_members.position` por igualdade de texto exato (`lower(trim())`). Qualquer variação ("Enf.", "Enfermeiro(a)") quebra silenciosamente | `0003_functions.sql:53` `position_ok` | Normalizar: criar tabela `positions` institucional ou ao menos um `check` de domínio + `unaccent`; comparar por id, não por texto | Trocas com cargos equivalentes passam; cargos diferentes falham com mensagem clara |
| DB-04 | S2 | Faltam índices para consultas de produção: `has_rest_violation` faz range scan por `membership_id + start_at + end_at` sem índice gist próprio; `audit_logs` sem índice por entidade | `0001_schema.sql:281-296` (lista de índices) | `create index shifts_membership_work_range_idx on shifts using gist (membership_id, tstzrange(start_at, end_at)) where (kind='work' and is_active)`; índice em `audit_logs (entity_type, entity_id, created_at desc)` | `explain analyze` mostra Index Scan nas duas consultas |
| DB-05 | S2 | `audit_logs` cresce sem limite e sem política de retenção; grava `to_jsonb(old)`/`to_jsonb(new)` completos | `0002_security.sql:118` `audit_trigger` | Definir retenção (12 meses) via `pg_cron`; particionar por mês ou ao menos criar rotina de purga documentada | Documento de operação descreve a retenção; job existe e é idempotente |
| DB-06 | S3 | `institutions`, `units`, `sectors` têm `status record_status` mas **nenhuma RPC o altera** (exceto `set_membership_status`, que é de vínculo). Instituição criada errada fica para sempre | `0001_schema.sql:24`; ausência em `0003` | Criar `set_institution_status`, `set_unit_status`, `set_sector_status` com as mesmas regras de papel; bloqueio se houver plantão futuro ativo | Instituição desativada some das listas e bloqueia criação de escala; dados históricos preservados |
| DB-07 | S3 | `send_shift_reminders` agendada por hora envia lembrete para plantão que começa em 23 h. Regra de negócio não definida | `0003_functions.sql:754` | **Requisito a elicitar** (§5, Q-04) | Regra registrada em `docs/requisitos.md` e refletida no SQL |
| DB-08 | S3 | `coverage_rules` não considera cargo: `min_professionals` conta pessoas, não qualificação. Se a instituição exigir "2 enfermeiros + 2 técnicos", o modelo não comporta | `0001_schema.sql` tabela `coverage_rules` | **Requisito a elicitar** (§5, Q-05) | Decisão registrada; se necessário, migração `coverage_rules (sector_id, shift_type_id, position, min_professionals)` |

### 3.3 Frontend e arquitetura — fase 3

| ID | Sev | Achado | Evidência | Correção exigida | Critério de aceite |
|---|---|---|---|---|---|
| FE-01 | S1 | **15 RPCs prontas no banco e não chamadas pelo frontend.** Produto não funciona de ponta a ponta | §2.2 | Integrar por ordem de dependência: Escalas → Trocas → Aprovações → Notificações → Setores/Configurações | Fluxo completo (montar → publicar → propor → aceitar → aprovar → notificar) executável na interface |
| FE-02 | S1 | **Duas rotas para o mesmo componente e uma delas é inalcançável por navegação**: `App.tsx` tem `<Route path="meu-perfil" element={<ProfilePage />} />` e `ModuleRoute` também renderiza `ProfilePage`; além disso a lista `sharedPaths` em `nav.ts` contém `"/app/meu-perfil"` enquanto o profissional já o tem em `navByRole` | `src/App.tsx:26`; `src/pages/ModuleRoute.tsx:24`; `src/lib/nav.ts:76` | Uma única fonte: manter `App.tsx` explícito para rotas compartilhadas e remover `meu-perfil` de `sharedPaths` ou do `ModuleRoute` | Teste de rota: `/app/meu-perfil` renderiza `ProfilePage` uma vez, sem redirect |
| FE-03 | S2 | **`auth-context.tsx` reimplementa React Query à mão** (491 linhas): 4 queries encadeadas, controle manual de versão (`versaoCarregamento`, `queueMicrotask`, `finally`) | `src/lib/auth-context.tsx:158-260` | Adotar `@tanstack/react-query`; `useQuery(['perfil', userId])` + `useMutation` com `invalidateQueries` | `auth-context.tsx` abaixo de 200 linhas; carregamento e erro com estados explícitos |
| FE-04 | S2 | **Tipos do banco não são gerados.** `supabase.rpc("...")` aceita qualquer string; erro de nome de coluna ou RPC só aparece em runtime | `src/lib/supabase.ts` — `createClient` sem genérico | `supabase gen types typescript --local > src/lib/database.types.ts`; `createClient<Database>(...)`; script `npm run gen:types` | `npm run typecheck` falha se um nome de RPC ou coluna estiver errado |
| FE-05 | S2 | **Duas taxonomias de papel conflitantes.** `@"admin"` existe no front e **não existe no banco** (`member_role` = `institution_admin | manager | professional`). `rotuloPapel` ("Coordenadora") é um segundo vocabulário que não vem do banco | `src/pages/ProfessionalsPage.tsx:31-32` (`papel: "manager" \| "professional" \| "admin"`) | Criar `src/lib/roles.ts` com os tipos derivados de `Database["public"]["Enums"]["member_role"]` e `labelFor(role)` único | Nenhum literal `"admin"` no código; `grep -r '"admin"' src` retorna vazio |
| FE-06 | S2 | **Navegação por `if`-chain**: três slugs (`escalas`, `minha-escala`, `escala-colegas`) renderizam o mesmo `SchedulesPage` sem informar o modo, então o componente não sabe se está em visão de gerência, própria ou de colegas | `src/pages/ModuleRoute.tsx:19-25` | Rotas declarativas com prop `mode="management" \| "mine" \| "peers"`; ou rotas aninhadas por perfil | `SchedulesPage` recebe `mode` obrigatório; não há mais `if (slug === ...)` |
| FE-07 | S2 | **Componentes gigantes misturando fetch, estado, mock, filtro, modal e CSS de impressão** | `ProfessionalsPage.tsx` 627 linhas; `SchedulesPage.tsx` 493; `auth-context.tsx` 491; `SwapsPage.tsx` 432 | Reestruturar em `src/features/<domínio>/` com `api.ts`, `use<Dominio>.ts`, componentes de apresentação e página só compondo (alvo: página < 80 linhas) | Nenhum arquivo em `src/` acima de 250 linhas; Regra de Dependência respeitada (apresentação não importa `supabase`) |
| FE-08 | S2 | **Tela de Notificações não existe**, sino do `AppShell` é um `<Link>` sem contador, Realtime não é assinado — apesar de `notifications` estar na publicação | `src/components/AppShell.tsx:180`; `0004_grants.sql:57` publica a tabela | Implementar `/app/notificacoes` com `mark_notifications_read`; contador no sino com `postgres_changes` | Badge reflete não lidas em tempo real; marcar como lida atualiza contador |
| FE-09 | S2 | **Telas de Setores e Configurações não existem** (só placeholder `ModulePage`) embora o menu as exponha e os grants existam | `src/lib/nav.ts:38-44`; `src/lib/modules.ts` | Implementar CRUD de unidades/setores, tipos de plantão, cobertura mínima e descanso | Setor criado na interface aparece na escala; `min_rest_hours` editável |
| FE-10 | S3 | **`src/features/`, `public/` e componentes de impressão** dependem de `window.print()` com layout hardcoded em duas quinzenas | `SchedulesPage.tsx` (bloco `hidden print:block`) | Extrair template de PDF e gerar no servidor (Edge Function) com dados reais de `coverage_gaps` | PDF de 1 quinzena e de mês completo saem corretos com 2, 3 ou 5 tipos de plantão |

### 3.4 Qualidade, testes e processo — fase 4

| ID | Sev | Achado | Evidência | Correção exigida | Critério de aceite |
|---|---|---|---|---|---|
| QA-01 | S1 | **Nenhum CI.** Nada impede build quebrado de ir para produção | ausência de `.github/workflows` | Workflow: `npm ci` → `typecheck` → `build` → `supabase start` → `db reset` → testes SQL | Workflow verde em PR; bloqueia merge quando vermelho |
| QA-02 | S2 | **Teste de concorrência é manual** (documento, não código). Exatamente o cenário mais crítico do produto (dupla aprovação) não é verificado automaticamente | `supabase/tests/CONCORRENCIA.md` | Automatizar com dois `psql` em background no CI, ou `pgbench`, cobrindo os 3 cenários (A dupla aprovação, B dois pedidos no mesmo plantão, C aprovar × cancelar) | Os 3 cenários rodam no CI e falham o build quando o `for update` é removido |
| QA-03 | S2 | **Zero testes de frontend** | `package.json` sem `vitest`/`testing-library` | Adicionar Vitest + Testing Library; cobrir `isPathAllowed`, `mensagemErro`, fluxo de login e aceite de convite | Cobertura mínima de 60% nos módulos `src/lib` e `src/features/*/api.ts` |
| QA-04 | S2 | **Ausência de ESLint/Prettier.** `@typescript-eslint` não configurado; estilo inconsistente (2 espaços vs 4 em `nav.ts`, `modules.ts`) | `package.json` sem `eslint`/`prettier` | Configurar ESLint (flat config) + Prettier; script `npm run lint` no CI | `npm run lint` sem erro; formatação uniforme |
| QA-05 | S3 | **Teste SQL cobre caminho feliz.** 49 verificações boas, mas não cobrem fuso horário/DST, `min_rest_hours` na montagem, cobertura após troca 1:0, desativação de instituição/setor, convite expirado | `01_isolamento_e_trocas.sql` | Ampliar para ≥ 70 verificações cobrindo os itens de DB-01 a DB-06 | Todos os defeitos da §3.2 têm verificação no arquivo |
| QA-06 | S3 | **`dist/` presente no diretório** apesar de estar no `.gitignore` (build antigo, engana quem inspeciona o repositório) | `ls` mostra `dist/` com `assets/` e `index.html` | Remover do disco de trabalho; nenhum artefato de build no repositório | `ls` não lista `dist/` após `npm run clean` |

### 3.5 Produto e documentação — fase 4

| ID | Sev | Achado | Evidência | Correção exigida | Critério de aceite |
|---|---|---|---|---|---|
| DOC-01 | S2 | **`README.md` desinforma**: declara "Etapa 1 concluída" e "Etapa 2 próxima", enquanto o banco tem as Etapas 2–7 implementadas e o frontend tem 4 chamadas | `README.md` tabela de roadmap | Reescrever com duas trilhas (backend × frontend) e rastreamento por checkbox (§7) | README reflete o estado verificado; cada ✅ tem critério de aceite cumprido |
| DOC-02 | S3 | **`CLAUDE.md` descrevia estado, não plano.** Sem severidade, sem critério de aceite, sem rastreabilidade | versão anterior deste arquivo | Este documento | — |
| DOC-03 | S3 | **Nenhum registro de requisitos elicitados.** Regras de negócio ambíguas ficam só na cabeça do autor (ver §5) | ausência de `docs/requisitos.md` | Criar e manter `docs/requisitos.md` com as decisões de Q-01..Q-12 | Toda decisão tem data, responsável e impacto no código |

---

## 4. Arquitetura-alvo

### 4.1 Estrutura de pastas pretendida

```
src/
  lib/                    ← infraestrutura transversal
    supabase.ts           ← cliente tipado (createClient<Database>)
    database.types.ts     ← GERADO, nunca editado à mão
    roles.ts              ← tipos de papel derivados do banco + labelFor()
    nav.ts
    query-client.ts
    utils.ts
  features/               ← um diretório por domínio de negócio
    auth/                 { api.ts, useSession.ts, useSignIn.ts, ... }
    instituicoes/         { api.ts, useInstituicoes.ts, InstituicoesTable.tsx, InstituicaoForm.tsx }
    setores/
    profissionais/
    escalas/
    trocas/
    aprovacoes/
    notificacoes/
    perfil/
  components/             ← apresentação pura, SEM import de supabase
    AppShell.tsx, AuthLayout.tsx, ShiftChip.tsx, PageHeader.tsx
    ui/                   ← Button, Card, Badge, Input, Label, Dialog, Table...
  pages/                  ← só composição (alvo: < 80 linhas por arquivo)
  demo/                   ← modo demonstração, carregado apenas em DEV
```

### 4.2 Regra de dependência (obrigatória)

`pages` → `features` → `lib` · `pages` → `components` → `ui`
**Proibido:** `components/` importar `supabase`; `features/` importar `pages/`; dois `features/` se importarem diretamente (use `lib`).

### 4.3 Camada de dados

Toda chamada ao backend vive em `features/<domínio>/api.ts`, tipada por `database.types.ts`,
com erro traduzido por uma única função `traduzirErro(error)` que mapeia:

| Código / mensagem | Tradução para o usuário |
|---|---|
| `42501` | "Você não tem permissão para esta ação." |
| `23P01` / `exclusion_violation` | "Conflito de horário: o profissional já tem plantão neste período." |
| `23505` / `unique_violation` | Conforme a entidade (ex.: "Este plantão já está em negociação.") |
| `hint = 'coverage_gaps'` | Abre o painel de lacunas de cobertura |
| `hint = 'rest_violation'` | "Intervalo mínimo entre jornadas não respeitado. Deseja publicar mesmo assim?" |
| demais | Mensagem do banco, já em português |

### 4.4 Estados de interface — obrigatórios em toda tela de dados

`carregando` (skeleton, não spinner de página inteira) · `vazio` (com o que fazer a seguir) ·
`erro` (com ação "Tentar novamente") · `sem permissão` (explica por que e como obter acesso).

### 4.5 Acessibilidade (requisito, não extra)

Contraste mínimo AA · navegação completa por teclado · skip link · `aria-live` em toda
mensagem assíncrona · foco visível global · significado nunca só por cor (chips com `D`,
`N`, `F`, `Fé`) · respeito a `prefers-reduced-motion` · alvos de toque ≥ 44 px.

### 4.6 Honestidade da interface (R-§0.3)

Tela sem backend **deve dizer isso na tela**, com o motivo e o que se espera dela.
É proibido popular componente com dados fictícios sem rótulo explícito de demonstração.
`ProfessionalsPage`, `SchedulesPage`, `SwapsPage` e `ApprovalsPage` estão
**em violação desta regra hoje** e isso é tratado em FE-01.

### 4.7 Tempo e fuso horário

`shift_date` é sempre data local no fuso da instituição (`institutions.timezone`).
`start_at`/`end_at` são `timestamptz`. Toda conversão passa por
`at time zone v_tz` no SQL — nunca no cliente. Testar explicitamente: plantão noturno
cruzando meia-noite e transição de horário de verão.

---

## 5. Elicitação de requisitos — decisões pendentes

Itens abaixo **bloqueiam** a implementação correspondente ou geram retrabalho se
decididos tarde. Cada um tem a pergunta, o impacto, o padrão assumido até a resposta e o
item de código afetado. Devem ser registrados em `docs/requisitos.md` com data e responsável.

| ID | Pergunta de requisito | Impacto se não decidido | Padrão assumido (provisório) | Afeta |
|---|---|---|---|---|
| Q-01 | **Escala publicada pode ser alterada?** Hoje `upsert_shift` permite alterar escala publicada, incrementa `version` e notifica. É o comportamento desejado ou deve exigir "despublicar" e aprovação? | Alteração silenciosa de escala oficial é passivo trabalhista | Manter como está, mas registrar a justificativa obrigatória na alteração pós-publicação | `upsert_shift`, `remove_shift` |
| Q-02 | **Quem pode trocar plantão?** Hoje o profissional troca o próprio plantão sem restrição de tipo, cargo ou antecedência mínima. Existe antecedência mínima (ex.: 48 h) exigida pela instituição? | Precisa entrar como parâmetro, não hardcode | Sem antecedência mínima; validar somente `start_at > now()` | `create_swap_request` |
| Q-03 | **Limite de jornada.** `sectors.min_rest_hours` cobre intervalo, mas não há limite semanal/mensal de horas nem teto de plantões consecutivos. A instituição exige? | Sem isso o sistema não previne jornada exaustiva | Não validar por ora; registrar como alerta educativo | `upsert_shift`, `coverage_gaps` |
| Q-04 | **Janela do lembrete de plantão.** 24 h antes é adequado? Deve ser configurável por setor? | Lembrete inútil gera ruído e descrédito no canal | Fixo em 24 h, execução horária | `send_shift_reminders`, DB-07 |
| Q-05 | **Cobertura mínima por cargo.** `min_professionals` conta pessoas. A instituição exige composição (ex.: 2 enfermeiros + 2 técnicos por turno)? | Modelo não comporta; migração de esquema depois é cara | Contagem por pessoa, sem cargo | `coverage_rules`, DB-08 |
| Q-06 | **Vaga aberta (`shifts.membership_id IS NULL`)** é um conceito que deve existir no produto (plantão descoberto oferecido no mural) ou a escala sempre exige titular? | Define se existe um segundo tipo de mural | Existe e é publicável com alerta de lacuna | `publish_schedule`, `coverage_gaps` |
| Q-07 | **Notificação por e-mail/push.** Hoje só existe notificação in-app. A instituição espera e-mail para troca aprovada e escala publicada? | Muda arquitetura (SMTP, Edge Function, filas) | Somente in-app; documentar a limitação | §4, `push_notification*` |
| Q-08 | **Escopo do administrador de plataforma.** `is_platform_admin` hoje enxerga e cria instituições. Ele pode ler **dados de dentro** de uma instituição (escalas, profissionais) para suporte? | Hoje as políticas em `shifts`, `schedules` **não** concedem ao platform admin — decisão correta, mas precisa ser explícita | Plataforma **não** lê dados operacionais; só metadados de instituição | `0002_security.sql` políticas de `shifts`/`schedules` |
| Q-09 | **Múltiplos vínculos simultâneos.** Um profissional pode ter vínculo ativo em 2 instituições? Um gerente pode gerenciar setores em instituições diferentes? | Já suportado por `memberships` + seletor de instituição; confirmar que é requisito e não acidente | Sim, N vínculos; `institution_admin` de uma, `professional` de outra | `auth-context`, `AppShell` |
| Q-10 | **Saída de funcionário.** Profissional desligado com plantões futuros: os plantões voltam a ser vaga aberta automaticamente, ou a gerência precisa remanejar manualmente? | Hoje `set_membership_status('inactive')` **não** trata os plantões futuros — eles ficam presos a um vínculo inativo | Vaga aberta automática + notificação à gerência | `set_membership_status` |
| Q-11 | **Auditoria visível.** `audit_logs` existe mas nenhuma tela o lê. A instituição precisa de trilha auditável (LGPD) consultável pela gerência? | Se sim, é uma tela nova na fase 3 | Sim, somente leitura para `institution_admin` | `audit_logs`, nova tela |
| Q-12 | **Retenção e exclusão de dados (LGPD).** Qual o prazo de retenção de escala, proposta e auditoria? Há direito de eliminação a atender? | Afeta DB-05 e a política de privacidade | Auditoria 12 meses; escalas enquanto a instituição existir | DB-05 |

**Regra:** se a decisão já existe no código mas não está documentada, ela é **requisito
tácito** — deve ser promovida a requisito explícito em `docs/requisitos.md` com a marca
`(tácito → explícito)`.

---

## 6. Fases de execução

Ordem obrigatória. Cada fase termina com os critérios da §7 verificados.

### Fase 1 — Estabilização (bloqueia todo o resto)
`SEC-01` `SEC-02` `SEC-03` `SEC-04` `SEC-05` `SEC-06` `SEC-07` `QA-01` `QA-04` `QA-06` `DOC-01` `DOC-02`
**Saída:** repositório limpo, CI verde, política de senha e e-mail corretas, modo demo isolado, cron ativo, documentação verdadeira.

### Fase 2 — Integridade do banco
`DB-01` `DB-02` `DB-03` `DB-04` `DB-05` `DB-06` `QA-02` `QA-05`
**Saída:** regras de negócio completas e testadas, concorrência automatizada, índices criados.

### Fase 3 — Integração do frontend
`FE-03` `FE-04` `FE-05` `FE-06` `FE-07` `FE-02` → depois `FE-01` por domínio (escalas → trocas → aprovações → notificações → setores/configurações) → `FE-08` `FE-09` `FE-10`
**Saída:** fluxo completo executável na interface, sem dado fictício, com estados de carregamento/erro/vazio.

### Fase 4 — Requisitos e fechamento
Resolver `Q-01..Q-12` → criar `docs/requisitos.md` (`DOC-03`) → implementar o que as
respostas exigirem → revisar README e roadmap → relatório final de Etapa 8 com
o que passou, o que falhou e o que ficou pendente.

---

## 7. Critérios de aceite por etapa (definição de "pronto")

Uma etapa só recebe ✅ quando **todos** os itens abaixo forem verdadeiros.

### Etapa 1 — Fundação visual
- [x] Layout, navegação por perfil, `AppShell`, `AuthLayout`, `ui/` implementados
- [x] Skip link, foco visível, `aria-live`, chips com letra além de cor
- [x] `npm run typecheck` passa
- [ ] `npm run lint` existe e passa (QA-04)
- [ ] Tokens de cor com contraste AA verificados (auditar `warn` `#8A4B06` sobre `#FDF0DE`)

### Etapa 2 — Autenticação
- [x] Login, cadastro, recuperação e redefinição de senha via Supabase Auth
- [x] Cadastro público **não** cria vínculo institucional (teste SQL cobre)
- [x] Rotas privadas exigem sessão + vínculo ativo ou `is_platform_admin`
- [x] Confirmação exigida no Auth hospedado e entrega/retorno da recuperação de senha verificados pelo responsável (SEC-03)
- [x] Política de senha forte (SEC-02)
- [x] Modo demonstração isolado do bundle de produção (SEC-04)
- [x] Testes de frontend do fluxo de login e convite (QA-03; cobertura global ainda pendente)

### Etapa 3 — Instituições, unidades, setores, equipe, configurações
- [x] Backend: `create_institution`, `create_invitation`, `accept_invitation`, `set_membership_status`, `set_sector_member_status`
- [x] Tela de instituições (platform admin) com link de convite
- [ ] Tela de unidades e setores (FE-09)
- [ ] Tela de profissionais ligada a `create_invitation` (FE-01)
- [ ] Tela de configurações: tipos de plantão, cobertura, `min_rest_hours` (FE-09)
- [ ] RPCs de desativação de instituição/unidade/setor (DB-06)
- [ ] Revogar `insert`/`update` direto em `institutions` (SEC-05)

### Etapa 4 — Escalas
- [x] Backend: `create_schedule`, `upsert_shift`, `remove_shift`, `coverage_gaps`, `publish_schedule`
- [x] Exclusão gist impede sobreposição, inclusive cruzando meia-noite
- [ ] Interface ligada ao backend (FE-01) — **hoje é grade fictícia**
- [ ] Validação de `min_rest_hours` na montagem (DB-02)
- [ ] Exportação PDF gerada no servidor (FE-10)
- [ ] Teste de fuso horário e DST (QA-05)

### Etapa 5 — Trocas
- [x] Backend: `create_swap_request`, `propose_swap`, `respond_swap_proposal`, `cancel_swap_request`
- [x] `accepted` é aceite do colega, não aprovação final
- [ ] Interface ligada ao backend (FE-01) — **hoje o mural é fictício**
- [ ] Antecedência mínima definida (Q-02)

### Etapa 6 — Aprovação pela gerência
- [x] Backend: `decide_swap` com revalidação completa e trava em ordem de id
- [x] Rollback total em qualquer falha
- [ ] Revalidar cobertura mínima após troca 1:0 (DB-01)
- [ ] Interface ligada ao backend (FE-01) — **hoje é fictícia**
- [ ] Concorrência automatizada no CI (QA-02)

### Etapa 7 — Notificações
- [x] Backend: `push_notification*`, `mark_notifications_read`, `send_shift_reminders`
- [x] Idempotência por índice único (`shift_reminder`)
- [x] `notifications`, `shifts`, `swap_requests`, `swap_proposals` na publicação Realtime
- [ ] `pg_cron` agendado (SEC-06)
- [ ] Tela de notificações + contador no sino (FE-08)

### Etapa 8 — Testes, concorrência e auditoria
- [x] `01_isolamento_e_trocas.sql` com 49 verificações em transação com rollback
- [ ] ≥ 70 verificações cobrindo §3.2 (QA-05)
- [ ] Concorrência automatizada: dupla aprovação, dois pedidos no mesmo plantão, aprovar × cancelar (QA-02)
- [ ] Testes de frontend (QA-03)
- [ ] Relatório final com passou / falhou / pendente

### Versão 2 — Relatórios
- [ ] Distribuição de plantões por profissional
- [ ] Cobertura por turno e período
- [ ] Trocas aprovadas e recusadas
- Depende de Q-11 (auditoria visível)

---

## 8. Modelo de dados — referência

- **Vínculo:** `memberships(role: institution_admin | manager | professional)`.
  Setor: `sector_members(position, is_manager)`. Gerente só administra setores onde
  `is_manager = true`; `institution_admin` administra todos da instituição.
  `profiles.is_platform_admin` só é alterável por SQL.
- **`shifts`:** `kind` ∈ work | day_off | vacation | leave; `membership_id` NULL em `work`
  = vaga aberta; `start_at`/`end_at` `timestamptz`; `shift_date` = data local no fuso
  da instituição; exclusão gist impede sobreposição por vínculo; um índice único garante
  uma ausência por pessoa por dia.
- **Trocas:** `swap_proposals` tem `proposer`, `recipient` (quem decide o aceite) e
  `taker` (quem fica com o plantão da solicitação). `target_shift_id` = plantão do taker
  que vai ao solicitante (opcional). Troca direta: `proposer` = solicitante,
  `recipient` = `taker` = colega. Mural (`open`): `proposer` = `taker` = interessado,
  `recipient` = solicitante.

### Funções de `0003_functions.sql` (23)

`push_notification`, `push_notification_membership`, `push_notification_managers`,
`has_rest_violation`, `position_ok`, `create_institution`, `create_invitation`,
`get_invitation`, `accept_invitation`, `set_membership_status`,
`set_sector_member_status`, `create_schedule`, `upsert_shift`, `remove_shift`,
`coverage_gaps`, `publish_schedule`, `create_swap_request`, `propose_swap`,
`respond_swap_proposal`, `cancel_swap_request`, `decide_swap`,
`mark_notifications_read`, `send_shift_reminders`.
Auxiliares internos **não** executáveis pelo cliente (`0004`).

### Helpers de autorização de `0002_security.sql`

`is_platform_admin`, `is_member`, `is_institution_admin`, `my_membership_id`,
`is_my_membership`, `manages_sector`, `in_sector`, `can_view_sector`,
`is_active_sector_member`, `can_see_membership`, `can_see_profile`,
`owns_or_manages_request`, `can_see_request`.

---

## 9. Checklist obrigatório antes de qualquer merge

- [ ] `npm run typecheck` sem erro
- [ ] `npm run build` sem erro
- [ ] `npm run lint` sem erro
- [ ] `supabase db reset` aplica todas as migrations sem erro
- [ ] `psql "$DB_URL" -f supabase/tests/01_isolamento_e_trocas.sql` → 0 FALHOU
- [ ] Se mexeu em SQL de autorização: teste de acesso cruzado entre duas instituições incluído
- [ ] Se mexeu em regra de negócio: critério de aceite do item correspondente da §3 atualizado
- [ ] Se alterou o comportamento entregue: linha do roadmap do `README.md` atualizada
- [ ] Nenhum dado fictício sem rótulo de demonstração (§4.6)
- [ ] Nenhum `any` novo; nenhuma RPC chamada com string solta (FE-04)
