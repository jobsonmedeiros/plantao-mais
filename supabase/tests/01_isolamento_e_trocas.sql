-- Plantão+ · Etapa 8 — Testes de isolamento, permissões e fluxo de troca
-- Como rodar (Supabase local):  psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -f supabase/tests/01_isolamento_e_trocas.sql
-- O script roda numa transação e termina com ROLLBACK: não deixa dados no banco.
-- Cada linha do resultado final mostra PASSOU (ok = true) ou FALHOU (ok = false).

begin;

create table public._t_results (n serial, name text, ok boolean, detail text);
create table public._t_ctx (k text primary key, v uuid);

create function public._t_check(p_name text, p_ok boolean, p_detail text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public._t_results (name, ok, detail) values (p_name, coalesce(p_ok, false), p_detail)
$$;
create function public._t_claims(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true)
$$;
grant execute on function public._t_check(text, boolean, text), public._t_claims(uuid) to authenticated;
grant select on public._t_ctx to authenticated;

-- ───────────── Dados de teste (como administrador do banco) ─────────────
-- Usuários: 01 adminA · 02 gerenteA · 03 profA1 · 04 profA2 · 05 adminB · 06 profB1 · 07 admin plataforma · 08 convidado
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'admin.a@teste.local'),
  ('00000000-0000-0000-0000-000000000002', 'gerente.a@teste.local'),
  ('00000000-0000-0000-0000-000000000003', 'prof.a1@teste.local'),
  ('00000000-0000-0000-0000-000000000004', 'prof.a2@teste.local'),
  ('00000000-0000-0000-0000-000000000005', 'admin.b@teste.local'),
  ('00000000-0000-0000-0000-000000000006', 'prof.b1@teste.local'),
  ('00000000-0000-0000-0000-000000000007', 'plataforma@teste.local'),
  ('00000000-0000-0000-0000-000000000008', 'novo@teste.local');
update public.profiles set is_platform_admin = true where id = '00000000-0000-0000-0000-000000000007';

insert into public.institutions (id, name) values
  ('00000000-0000-0000-0000-0000000000a1', 'Hospital A'),
  ('00000000-0000-0000-0000-0000000000b1', 'Hospital B');
insert into public.units (id, institution_id, name) values
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a1', 'Unidade A'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b1', 'Unidade B');
insert into public.sectors (id, institution_id, unit_id, name) values
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2', 'UTI A'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2', 'UTI B');
insert into public.memberships (id, institution_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'institution_admin'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000002', 'manager'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000003', 'professional'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000004', 'professional'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000005', 'institution_admin'),
  ('00000000-0000-0000-0000-0000000000c6', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000006', 'professional');
insert into public.sector_members (institution_id, sector_id, membership_id, position, is_manager) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c2', 'Enfermeiro', true),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c3', 'Enfermeiro', false),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c4', 'Enfermeiro', false),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000c6', 'Enfermeiro', false);
insert into public.shift_types (id, institution_id, sector_id, name, code, start_time, end_time) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3', 'Diurno', 'D', '07:00', '19:00'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3', 'Noturno', 'N', '19:00', '07:00');

-- ───────────── Leitura: isolamento entre instituições ─────────────
select public._t_claims('00000000-0000-0000-0000-000000000006');  -- profB1
set local role authenticated;
select public._t_check('B não enxerga setores da instituição A',
  (select count(*) from public.sectors where institution_id = '00000000-0000-0000-0000-0000000000a1') = 0);
select public._t_check('B não enxerga vínculos da instituição A',
  (select count(*) from public.memberships where institution_id = '00000000-0000-0000-0000-0000000000a1') = 0);
select public._t_check('B enxerga apenas a própria instituição',
  (select count(*) from public.institutions) = 1);
select public._t_check('B não enxerga perfis de pessoas da instituição A',
  (select count(*) from public.profiles where id in
    ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004')) = 0);
reset role;

-- Administrador da plataforma não recebe acesso operacional às escalas.
select public._t_claims('00000000-0000-0000-0000-000000000007');
set local role authenticated;
select public._t_check('Admin da plataforma enxerga as instituições', (select count(*) from public.institutions) >= 2);
select public._t_check('Admin da plataforma não enxerga setores nem plantões',
  (select count(*) from public.sectors) = 0 and (select count(*) from public.shifts) = 0);
reset role;

-- ───────────── Escrita direta e escalada de privilégio ─────────────
do $$ begin
  perform public._t_claims('00000000-0000-0000-0000-000000000003'); set local role authenticated;
  begin
    update public.profiles set is_platform_admin = true where id = '00000000-0000-0000-0000-000000000003';
    perform public._t_check('Usuário comum NÃO vira admin da plataforma', false, 'update foi aceito');
  exception when insufficient_privilege then
    perform public._t_check('Usuário comum NÃO vira admin da plataforma', true);
  end;
  begin
    update public.memberships set role = 'institution_admin' where id = '00000000-0000-0000-0000-0000000000c3';
    perform public._t_check('Usuário comum NÃO altera o próprio papel', false, 'update foi aceito');
  exception when insufficient_privilege then
    perform public._t_check('Usuário comum NÃO altera o próprio papel', true);
  end;
  begin
    insert into public.shifts (institution_id, schedule_id, sector_id, kind, shift_date, membership_id)
    values ('00000000-0000-0000-0000-0000000000a1', gen_random_uuid(), '00000000-0000-0000-0000-0000000000a3',
            'day_off', current_date, '00000000-0000-0000-0000-0000000000c3');
    perform public._t_check('Cliente NÃO insere plantão direto', false, 'insert foi aceito');
  exception when insufficient_privilege then
    perform public._t_check('Cliente NÃO insere plantão direto', true);
  end;
  begin
    perform public.create_schedule('00000000-0000-0000-0000-0000000000a3', 1, 2030);
    perform public._t_check('Profissional NÃO cria escala', false, 'função executou');
  exception when insufficient_privilege then
    perform public._t_check('Profissional NÃO cria escala', true);
  end;
  reset role;
end $$;

-- ───────────── Escalas: criação, conflito, rascunho e publicação ─────────────
do $$
declare v_sched uuid; v_d1 date := date_trunc('month', current_date + interval '1 month')::date; v_id uuid;
begin
  perform public._t_claims('00000000-0000-0000-0000-000000000002'); set local role authenticated;  -- gerenteA
  v_sched := public.create_schedule('00000000-0000-0000-0000-0000000000a3',
               extract(month from v_d1)::int, extract(year from v_d1)::int);
  v_id := public.upsert_shift(v_sched, '00000000-0000-0000-0000-0000000000c3', v_d1, 'work', '00000000-0000-0000-0000-0000000000d1');
  reset role;
  insert into public._t_ctx values ('sched', v_sched), ('sh1', v_id);
  perform public._t_claims('00000000-0000-0000-0000-000000000002'); set local role authenticated;
  v_id := public.upsert_shift(v_sched, '00000000-0000-0000-0000-0000000000c4', v_d1 + 1, 'work', '00000000-0000-0000-0000-0000000000d1');
  reset role;
  insert into public._t_ctx values ('sh2', v_id);
  perform public._t_check('Gerente cria escala e plantões do próprio setor', true);

  perform public._t_claims('00000000-0000-0000-0000-000000000002'); set local role authenticated;
  begin
    perform public.upsert_shift(v_sched, '00000000-0000-0000-0000-0000000000c3', v_d1, 'work', '00000000-0000-0000-0000-0000000000d1');
    perform public._t_check('Plantão sobreposto é bloqueado', false, 'inseriu duas vezes');
  exception when exclusion_violation then
    perform public._t_check('Plantão sobreposto é bloqueado', true);
  end;
  reset role;
end $$;

-- Rascunho invisível ao profissional (profA1).
select public._t_claims('00000000-0000-0000-0000-000000000003');
set local role authenticated;
select public._t_check('Rascunho não aparece para o profissional',
  (select count(*) from public.schedules) = 0 and (select count(*) from public.shifts) = 0);
reset role;

-- Gerente de OUTRA instituição não mexe na escala de A.
do $$ begin
  perform public._t_claims('00000000-0000-0000-0000-000000000005'); set local role authenticated;  -- adminB
  begin
    perform public.upsert_shift((select v from public._t_ctx where k = 'sched'),
      '00000000-0000-0000-0000-0000000000c3', current_date, 'day_off');
    perform public._t_check('Admin de B NÃO altera escala de A', false, 'função executou');
  exception when insufficient_privilege then
    perform public._t_check('Admin de B NÃO altera escala de A', true);
  end;
  reset role;
end $$;

-- Publicação.
do $$ begin
  perform public._t_claims('00000000-0000-0000-0000-000000000002'); set local role authenticated;
  perform public.publish_schedule((select v from public._t_ctx where k = 'sched'));
  reset role;
  perform public._t_check('Gerente publica a escala', true);
end $$;

select public._t_claims('00000000-0000-0000-0000-000000000003');
set local role authenticated;
select public._t_check('Profissional vê plantões após a publicação', (select count(*) from public.shifts) >= 2);
reset role;
select public._t_claims('00000000-0000-0000-0000-000000000006');
set local role authenticated;
select public._t_check('Profissional de B não vê plantões de A', (select count(*) from public.shifts) = 0);
reset role;

-- ───────────── Troca: proposta → aceite → aprovação ─────────────
do $$
declare v_req uuid; v_prop uuid;
begin
  perform public._t_claims('00000000-0000-0000-0000-000000000003'); set local role authenticated;  -- profA1
  v_req := public.create_swap_request((select v from public._t_ctx where k = 'sh1'), 'direct', 'teste',
             '00000000-0000-0000-0000-0000000000c4', (select v from public._t_ctx where k = 'sh2'));
  reset role;
  insert into public._t_ctx values ('req', v_req);

  perform public._t_check('Criar a proposta NÃO altera a escala oficial',
    (select membership_id from public.shifts where id = (select v from public._t_ctx where k = 'sh1'))
      = '00000000-0000-0000-0000-0000000000c3');

  -- O plantão usado como contrapartida também fica reservado durante a negociação.
  perform public._t_claims('00000000-0000-0000-0000-000000000002'); set local role authenticated;
  begin
    perform public.remove_shift((select v from public._t_ctx where k = 'sh2'));
    perform public._t_check('Não remove plantão reservado como contrapartida', false, 'remoção foi aceita');
  exception when others then
    perform public._t_check('Não remove plantão reservado como contrapartida',
      sqlerrm = 'Este plantão está reservado em uma proposta de troca.', sqlerrm);
  end;
  reset role;

  -- profA2 aceita
  perform public._t_claims('00000000-0000-0000-0000-000000000004'); set local role authenticated;
  select id into v_prop from public.swap_proposals where request_id = v_req;
  perform public.respond_swap_proposal(v_prop, true);
  reset role;
  perform public._t_check('Aceite do colega leva a solicitação para a gerência',
    (select status from public.swap_requests where id = v_req) = 'awaiting_manager');
  perform public._t_check('Aceite do colega NÃO altera a escala oficial',
    (select membership_id from public.shifts where id = (select v from public._t_ctx where k = 'sh1'))
      = '00000000-0000-0000-0000-0000000000c3'
    and (select membership_id from public.shifts where id = (select v from public._t_ctx where k = 'sh2'))
      = '00000000-0000-0000-0000-0000000000c4');

  -- Quem não é gerente não aprova
  perform public._t_claims('00000000-0000-0000-0000-000000000003'); set local role authenticated;
  begin
    perform public.decide_swap(v_req, true);
    perform public._t_check('Profissional NÃO aprova troca', false, 'função executou');
  exception when insufficient_privilege then
    perform public._t_check('Profissional NÃO aprova troca', true);
  end;
  reset role;
  perform public._t_claims('00000000-0000-0000-0000-000000000005'); set local role authenticated;  -- adminB
  begin
    perform public.decide_swap(v_req, true);
    perform public._t_check('Admin de outra instituição NÃO aprova troca', false, 'função executou');
  exception when insufficient_privilege then
    perform public._t_check('Admin de outra instituição NÃO aprova troca', true);
  end;
  reset role;

  -- Gerente aprova
  perform public._t_claims('00000000-0000-0000-0000-000000000002'); set local role authenticated;
  perform public.decide_swap(v_req, true);
  reset role;
  perform public._t_check('Aprovação troca os dois plantões',
    (select membership_id from public.shifts where id = (select v from public._t_ctx where k = 'sh1'))
      = '00000000-0000-0000-0000-0000000000c4'
    and (select membership_id from public.shifts where id = (select v from public._t_ctx where k = 'sh2'))
      = '00000000-0000-0000-0000-0000000000c3');
  perform public._t_check('Aprovação registra a decisão',
    exists (select 1 from public.swap_approvals where request_id = v_req and decision = 'approved'));

  -- Segunda aprovação deve falhar
  perform public._t_claims('00000000-0000-0000-0000-000000000002'); set local role authenticated;
  begin
    perform public.decide_swap(v_req, true);
    perform public._t_check('Aprovar duas vezes é bloqueado', false, 'aprovou de novo');
  exception when others then
    perform public._t_check('Aprovar duas vezes é bloqueado', true);
  end;
  reset role;
end $$;

-- ───────────── Notificações e auditoria ─────────────
select public._t_claims('00000000-0000-0000-0000-000000000004');  -- profA2
set local role authenticated;
select public._t_check('Colega recebeu notificações próprias', (select count(*) from public.notifications) >= 1);
select public._t_check('Colega só vê notificações destinadas a ele',
  (select count(*) from public.notifications where user_id <> '00000000-0000-0000-0000-000000000004') = 0);
reset role;

select public._t_claims('00000000-0000-0000-0000-000000000003');  -- profA1
set local role authenticated;
select public._t_check('Profissional NÃO lê a auditoria', (select count(*) from public.audit_logs) = 0);
reset role;
select public._t_claims('00000000-0000-0000-0000-000000000001');  -- adminA
set local role authenticated;
select public._t_check('Administrador da instituição lê a auditoria', (select count(*) from public.audit_logs) > 0);
reset role;

-- ───────────── Convites ─────────────
do $$
declare v jsonb; v_token uuid;
begin
  perform public._t_claims('00000000-0000-0000-0000-000000000007'); set local role authenticated;  -- plataforma
  v := public.create_institution('Hospital C', null, 'America/Sao_Paulo', 'novo@teste.local');
  reset role;
  v_token := (v ->> 'token')::uuid;
  perform public._t_check('Plataforma cadastra instituição e gera convite', v_token is not null);

  perform public._t_claims('00000000-0000-0000-0000-000000000001'); set local role authenticated;  -- adminA
  perform public.create_invitation(
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3',
    'gerente2@teste.local', 'manager', 'Enfermeiro', true);
  reset role;
  perform public._t_check('Convite preserva permissão de gerente no setor',
    exists (select 1 from public.invitations
            where email = 'gerente2@teste.local' and role = 'manager' and is_manager));

  perform public._t_claims('00000000-0000-0000-0000-000000000001'); set local role authenticated;  -- adminA
  begin
    perform public.create_invitation(
      '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a3',
      'profissional@teste.local', 'professional', 'Enfermeiro', true);
    perform public._t_check('Profissional não recebe permissão de gerente', false, 'convite foi aceito');
  exception when others then
    perform public._t_check('Profissional não recebe permissão de gerente',
      sqlerrm = 'Somente um gerente pode administrar um setor', sqlerrm);
  end;
  reset role;

  perform public._t_claims('00000000-0000-0000-0000-000000000003'); set local role authenticated;  -- e-mail errado
  begin
    perform public.accept_invitation(v_token);
    perform public._t_check('Convite NÃO é aceito por outro e-mail', false, 'aceitou');
  exception when insufficient_privilege then
    perform public._t_check('Convite NÃO é aceito por outro e-mail', true);
  end;
  reset role;

  perform public._t_claims('00000000-0000-0000-0000-000000000008'); set local role authenticated;  -- e-mail certo
  perform public.accept_invitation(v_token);
  reset role;
  perform public._t_check('Convidado vira administrador da nova instituição',
    exists (select 1 from public.memberships
            where user_id = '00000000-0000-0000-0000-000000000008' and role = 'institution_admin'));
end $$;

-- ───────────── Resultado ─────────────
select n, case when ok then 'PASSOU' else 'FALHOU' end as resultado, name, detail
from public._t_results order by n;
select count(*) filter (where ok) as passaram, count(*) filter (where not ok) as falharam from public._t_results;

do $$
begin
  if exists (select 1 from public._t_results where not ok) then
    raise exception 'Testes do banco falharam; consulte as linhas FALHOU acima.';
  end if;
end $$;

rollback;
