# Plantão+ — instruções para o Claude Code

SaaS multi-instituição de escalas e trocas de plantão de enfermagem. Idioma da interface e dos comentários: português do Brasil.
O usuário já autorizou a implementação ("agora sim"). Trabalhe uma etapa por vez, **rodando e testando** antes de avançar.

## Regras que não podem quebrar
- Backend: **Supabase direto** (não usar Lovable Cloud). Nunca usar `service_role` no navegador.
- RLS em toda tabela institucional. Autorização no banco, não só na interface. Teste sempre o acesso cruzado entre instituições.
- Cadastro público NÃO dá acesso a instituição; acesso vem de convite (`invitations`).
- Escalas e trocas só mudam por funções SQL transacionais (`security definer`, `set search_path = ''`). Cliente não tem INSERT/UPDATE em `shifts`, `memberships`, `sector_members`, `swap_*`.
- Não armazenar dados clínicos de pacientes. Aviso de regras trabalhistas: alertas do sistema não são parecer jurídico.
- Não simular funcionalidade como se estivesse pronta. Telas sem backend devem dizer isso.
- Status de troca: `swap_requests.status` ∈ pending, awaiting_manager, approved, denied, cancelled. `swap_proposals.status` ∈ pending, accepted, rejected, cancelled. "accepted" é aceite do colega, nunca aprovação final.

## Estado atual
- Etapa 1 (fundação visual) pronta em `src/`, com um seletor de perfil de **pré-visualização** (`src/lib/role-context.tsx`, `AppShell`). Ele deve ser removido na Etapa 2 e o papel passar a vir de `memberships`.
- `supabase/migrations/0001_schema.sql` e `0002_security.sql` escritos mas **nunca executados**. Primeiro passo: `supabase start`, `supabase db reset`, corrigir erros de SQL.
- Faltam: 0003 (funções), 0004 (grants/realtime), testes SQL, integração do frontend (Etapas 2–7) e auditoria (Etapa 8).

## Modelo (resumo; ver 0001)
- Vínculo: `memberships(role: institution_admin|manager|professional)`; setor: `sector_members(position, is_manager)`. Gerente só administra setores onde `is_manager = true`; `institution_admin` administra todos da instituição. `profiles.is_platform_admin` só é alterável por SQL.
- `shifts`: `kind` work|day_off|vacation|leave; `membership_id` NULL em `work` = vaga aberta; `start_at/end_at` timestamptz (atravessam meia-noite); `shift_date` = data local no fuso da instituição; exclusão gist impede sobreposição por vínculo.
- Trocas: `swap_proposals` tem `proposer`, `recipient` (quem decide o aceite) e `taker` (quem fica com o plantão da solicitação). `target_shift_id` = plantão do taker que vai ao solicitante (opcional). Troca direta: proposer = solicitante, recipient = taker = colega. Mural (open): proposer = taker = interessado, recipient = solicitante.

## Etapa 2–3 — 0003_functions.sql (a escrever)
Todas `security definer`, `set search_path = ''`, mensagens de erro em português, `errcode 42501` para falta de permissão.
- `create_institution(name, cnpj, timezone, admin_email) → jsonb{institution_id, invitation_id, token}` (só platform admin; valida fuso em `pg_timezone_names`).
- `create_invitation(institution, sector, email, role, position, is_manager) → jsonb{id, token}`: institution_admin só por platform/institution admin; manager só por institution admin e exige setor; professional por institution admin ou `manages_sector`. Revoga convite pendente anterior igual.
- `get_invitation(token) → jsonb` (executável por anon; só dados mínimos). `accept_invitation(token) → uuid`: e-mail do perfil deve ser igual ao do convite, não expirado; upsert de `memberships` (nunca rebaixa papel; ranking professional < manager < institution_admin) e `sector_members`; marca aceito.
- `set_membership_status(id, status)` (institution admin, não a si mesmo) e `set_sector_member_status(id, status)` (`manages_sector`; só institution admin altera gerente).
- Helpers internos: `notify(user, inst, type, title, msg, link, ref)`, `notify_membership(...)`, `notify_sector_managers(sector, ...)`, `has_rest_violation(membership, start, end, exclude uuid[], min_hours)`. Não executáveis pelo cliente.

## Etapa 4 — escalas
- `create_schedule(sector, month, year) → uuid` (`manages_sector`).
- `upsert_shift(schedule, membership, date, kind, shift_type, notes) → uuid`: valida gerência, mês da escala, vínculo ativo no setor, tipo do setor; calcula `start_at/end_at` com o fuso da instituição (fim <= início ⇒ dia seguinte); folga/férias/afastamento por `on conflict (membership_id, shift_date) where kind <> 'work' and is_active`; não permite `work` e ausência no mesmo dia; traduz `exclusion_violation` em "Conflito de horário"; se publicada, incrementa `version` e notifica o profissional (`schedule_changed`).
- `remove_shift(id)` (soft: `is_active=false`; recusa se há troca ativa).
- `coverage_gaps(schedule)` usando `coverage_rules`; `publish_schedule(schedule, force=false) → jsonb`: trava a escala, exige não vazia, recusa se há lacunas de cobertura sem `force` (usar `hint = 'coverage_gaps'`), grava `schedule_versions` (snapshot), notifica participantes (`schedule_published`).
- Exportação PDF: `window.print()` com CSS `print:` (esconder menus).

## Etapas 5–6 — trocas
- `create_swap_request(shift, type, description, target_membership, target_shift) → uuid`: plantão é do chamador, escala publicada, ainda não começou, sem negociação ativa; travar linhas em ordem de id; no `direct` cria proposta e notifica o colega.
- `propose_swap(request, target_shift, message) → uuid` (mural; participante do setor, não o solicitante).
- `respond_swap_proposal(proposal, accept)`: só o `recipient`; travar solicitação antes da proposta; aceitar ⇒ proposta `accepted`, demais `rejected`, solicitação `awaiting_manager`, notifica gerentes; recusar em `direct` ⇒ solicitação `cancelled`.
- `cancel_swap_request(request)` (solicitante).
- `decide_swap(request, approve, reason)`: `manages_sector`; `for update` na solicitação, proposta e plantões (ordem de id); revalida estado, titularidade, escala publicada, não iniciado, vínculos ativos, cargo exigido (`shift_types.required_position`), descanso mínimo (`sectors.min_rest_hours`); zera `membership_id` dos dois plantões e depois atribui (evita falso conflito); grava `swap_approvals`; notifica; rejeição exige motivo. Qualquer falha ⇒ rollback total. (Troca 1:1 preserva a contagem de cobertura por tipo; documentar.)

## Etapa 7 — notificações
- `mark_notifications_read(ids uuid[] default null)`; `send_shift_reminders()` (agendar com pg_cron; idempotente pelo índice único); tipos: schedule_published, schedule_changed, swap_received, swap_accepted, swap_rejected, swap_awaiting_approval, swap_approved, swap_denied, swap_cancelled, shift_reminder.
- Realtime em `notifications`, `shifts`, `swap_requests`, `swap_proposals` (`alter publication supabase_realtime add table ...`).

## 0004_grants.sql
`revoke all` em tabelas e funções de `anon`/`authenticated`/`public`; `grant select` nas tabelas; `grant update (full_name, phone) on profiles`; `grant insert, update` em `institutions, units, sectors, shift_types, coverage_rules`; `grant execute` só nas funções públicas da API (nunca nas internas nem nas de gatilho); `get_invitation` também para `anon`.

## Frontend (Etapas 2–7)
Adicionar `@supabase/supabase-js`. Criar `src/lib/supabase.ts`, `auth.tsx` (sessão, perfil, vínculos, instituição ativa, papel: platform_admin | institution_admin | manager | professional), hook de consulta simples e componentes de página. Rotas: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/convite/:token`, `/app/...`.
Telas reais: Instituições (platform admin, mostra link do convite), Setores/unidades, Profissionais + convites, Escalas (grade, criar, editar célula, publicar, cobertura), Minha escala, Escala dos colegas, Trocar plantão, Mural, Minhas solicitações, Trocas e Aprovações (gerência), Notificações (Realtime + contador no sino), Configurações (tipos de plantão, cobertura mínima, descanso), Perfil. Relatórios fica para a Versão 2.
Remover o seletor "Ver como" e a faixa de pré-visualização. Manter acessibilidade, responsividade e texto além de cor nos status.

## Etapa 8 — testes
- `supabase/tests/`: script SQL com transação e rollback cobrindo isolamento entre duas instituições, escrita direta negada, escalada de privilégio negada, rascunho invisível ao profissional, sobreposição, fluxo completo de troca (aceite não altera escala; aprovação troca os dois plantões; segunda aprovação falha; não-gerente falha), notificações isoladas, auditoria.
- Concorrência: duas sessões chamando `decide_swap` ao mesmo tempo; uma deve falhar.
- Interface: responsividade (celular), acessibilidade, erros e carregamento.
- Entregar relatório com o que passou, falhou e ficou pendente.

## Comandos
`supabase start` · `supabase db reset` · `npm install` · `npm run typecheck` · `npm run dev`.
Variáveis em `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Primeiro platform admin: `update public.profiles set is_platform_admin = true where email = '...';`.
