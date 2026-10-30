-- Plantão+ · 0003 — Funções de negócio (convites, escalas, trocas, notificações)
-- Todas são SECURITY DEFINER com search_path vazio: o cliente não escreve direto nas tabelas
-- sensíveis, então cada função confere papel/escopo antes de agir.
-- Erros de permissão usam errcode 42501; conflitos de horário usam 23P01.

-- ───────────── Auxiliares internos (não executáveis pelo cliente; ver 0004) ─────────────
create or replace function public.push_notification(
  p_user uuid, p_institution uuid, p_type text, p_title text, p_message text,
  p_link text default null, p_ref uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, institution_id, type, title, message, link, ref_id)
  values (p_user, p_institution, p_type, p_title, p_message, p_link, p_ref)
$$;

create or replace function public.push_notification_membership(
  p_membership uuid, p_type text, p_title text, p_message text,
  p_link text default null, p_ref uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, institution_id, type, title, message, link, ref_id)
  select m.user_id, m.institution_id, p_type, p_title, p_message, p_link, p_ref
  from public.memberships m where m.id = p_membership
$$;

create or replace function public.push_notification_managers(
  p_sector uuid, p_type text, p_title text, p_message text,
  p_link text default null, p_ref uuid default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, institution_id, type, title, message, link, ref_id)
  select m.user_id, m.institution_id, p_type, p_title, p_message, p_link, p_ref
  from public.memberships m
  join public.sectors s on s.institution_id = m.institution_id
  where s.id = p_sector and m.status = 'active'
    and (m.role = 'institution_admin'
         or exists (select 1 from public.sector_members sm
                    where sm.sector_id = s.id and sm.membership_id = m.id
                      and sm.is_manager and sm.status = 'active'))
$$;

-- Verdadeiro se, ao assumir um plantão, o vínculo ficaria com menos que o descanso mínimo
-- (ou sobreposto) em relação a OUTROS plantões ativos dele.
create or replace function public.has_rest_violation(
  p_membership uuid, p_start timestamptz, p_end timestamptz, p_exclude uuid[], p_min_hours integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shifts sh
    where sh.membership_id = p_membership and sh.kind = 'work' and sh.is_active
      and sh.id <> all (p_exclude)
      and sh.start_at < p_end + make_interval(hours => p_min_hours)
      and sh.end_at > p_start - make_interval(hours => p_min_hours))
$$;

-- O cargo do vínculo no setor atende o cargo exigido pelo tipo de plantão (se houver exigência).
create or replace function public.position_ok(p_sector uuid, p_membership uuid, p_shift_type uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.shift_types st
                     where st.id = p_shift_type and st.required_position is not null)
      or exists (select 1 from public.shift_types st
                 join public.sector_members sm
                   on sm.sector_id = p_sector and sm.membership_id = p_membership and sm.status = 'active'
                 where st.id = p_shift_type
                   and lower(trim(coalesce(sm.position, ''))) = lower(trim(st.required_position)))
$$;

-- ───────────── Instituições, convites e vínculos ─────────────
create or replace function public.create_institution(
  p_name text, p_cnpj text, p_timezone text, p_admin_email text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_inst uuid; v_tz text; v_inv_id uuid; v_token uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_admin_email), '') = '' then
    raise exception 'Informe o nome da instituição e o e-mail do administrador';
  end if;
  v_tz := coalesce(nullif(trim(p_timezone), ''), 'America/Sao_Paulo');
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = v_tz) then
    raise exception 'Fuso horário inválido: %', v_tz;
  end if;
  insert into public.institutions (name, cnpj, timezone)
  values (trim(p_name), nullif(trim(p_cnpj), ''), v_tz) returning id into v_inst;
  insert into public.invitations (institution_id, email, role, invited_by)
  values (v_inst, lower(trim(p_admin_email)), 'institution_admin', auth.uid())
  returning id, token into v_inv_id, v_token;
  return jsonb_build_object('institution_id', v_inst, 'invitation_id', v_inv_id, 'token', v_token);
end $$;

create or replace function public.create_invitation(
  p_institution uuid, p_sector uuid, p_email text, p_role public.member_role,
  p_position text default null, p_is_manager boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, ''))); v_id uuid; v_token uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+$' then raise exception 'E-mail inválido'; end if;
  if p_is_manager and p_role <> 'manager' then
    raise exception 'Somente um gerente pode administrar um setor';
  end if;
  if p_sector is not null and not exists (
       select 1 from public.sectors s where s.id = p_sector and s.institution_id = p_institution) then
    raise exception 'O setor não pertence à instituição';
  end if;

  if p_role = 'institution_admin' then
    if not (public.is_platform_admin() or public.is_institution_admin(p_institution)) then
      raise exception 'Sem permissão para esta operação' using errcode = '42501';
    end if;
  elsif p_role = 'manager' then
    if p_sector is null then raise exception 'Informe o setor do gerente'; end if;
    if not public.is_institution_admin(p_institution) then
      raise exception 'Sem permissão para esta operação' using errcode = '42501';
    end if;
  else
    if p_sector is null then raise exception 'Informe o setor do profissional'; end if;
    if not (public.is_institution_admin(p_institution) or public.manages_sector(p_sector)) then
      raise exception 'Sem permissão para esta operação' using errcode = '42501';
    end if;
  end if;

  update public.invitations set status = 'revoked'
  where institution_id = p_institution and email = v_email and status = 'pending'
    and sector_id is not distinct from p_sector and role = p_role;

  insert into public.invitations (institution_id, sector_id, email, role, position, is_manager, invited_by)
  values (p_institution, p_sector, v_email, p_role, nullif(trim(p_position), ''),
          p_is_manager, auth.uid())
  returning id, token into v_id, v_token;
  return jsonb_build_object('id', v_id, 'token', v_token);
end $$;

-- Dados mínimos do convite para a tela de aceite (o token é o segredo). Pode ser chamada sem login.
create or replace function public.get_invitation(p_token uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'email', i.email, 'role', i.role, 'status', i.status,
    'expired', i.expires_at < now(), 'institution', inst.name, 'sector', s.name)
  from public.invitations i
  join public.institutions inst on inst.id = i.institution_id
  left join public.sectors s on s.id = i.sector_id
  where i.token = p_token
$$;

-- IMPORTANTE: ative "Confirm email" no Supabase Auth. O aceite compara o e-mail do convite com o
-- e-mail do perfil; sem confirmação, alguém poderia se cadastrar com e-mail de terceiros.
create or replace function public.accept_invitation(p_token uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_inv public.invitations%rowtype; v_email text; v_membership uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login para aceitar o convite' using errcode = '42501';
  end if;
  select * into v_inv from public.invitations where token = p_token for update;
  if not found then raise exception 'Convite não encontrado'; end if;
  if v_inv.status <> 'pending' then raise exception 'Este convite não está mais disponível'; end if;
  if v_inv.expires_at < now() then raise exception 'Este convite expirou'; end if;

  select lower(p.email) into v_email from public.profiles p where p.id = auth.uid();
  if v_email is distinct from v_inv.email then
    raise exception 'Este convite foi enviado para outro e-mail' using errcode = '42501';
  end if;

  -- Nunca rebaixa o papel de quem já tem vínculo: professional < manager < institution_admin.
  insert into public.memberships as mb (institution_id, user_id, role)
  values (v_inv.institution_id, auth.uid(), v_inv.role)
  on conflict (institution_id, user_id) do update
    set status = 'active',
        role = case
          when array_position(array['professional','manager','institution_admin'], excluded.role::text)
             > array_position(array['professional','manager','institution_admin'], mb.role::text)
          then excluded.role else mb.role end
  returning mb.id into v_membership;

  if v_inv.sector_id is not null then
    insert into public.sector_members as sm (institution_id, sector_id, membership_id, position, is_manager)
    values (v_inv.institution_id, v_inv.sector_id, v_membership, v_inv.position, v_inv.is_manager)
    on conflict (sector_id, membership_id) do update
      set status = 'active',
          position = coalesce(excluded.position, sm.position),
          is_manager = sm.is_manager or excluded.is_manager;
  end if;

  update public.invitations set status = 'accepted', accepted_at = now() where id = v_inv.id;
  return v_membership;
end $$;

create or replace function public.set_membership_status(p_membership uuid, p_status public.record_status)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.memberships%rowtype;
begin
  select * into v from public.memberships where id = p_membership for update;
  if not found then raise exception 'Vínculo não encontrado'; end if;
  if not public.is_institution_admin(v.institution_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if v.user_id = auth.uid() then raise exception 'Você não pode alterar o próprio vínculo'; end if;
  update public.memberships set status = p_status where id = p_membership;
end $$;

create or replace function public.set_sector_member_status(p_sector_member uuid, p_status public.record_status)
returns void language plpgsql security definer set search_path = '' as $$
declare v public.sector_members%rowtype;
begin
  select * into v from public.sector_members where id = p_sector_member for update;
  if not found then raise exception 'Vínculo não encontrado'; end if;
  if not public.manages_sector(v.sector_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if v.is_manager and not public.is_institution_admin(v.institution_id) then
    raise exception 'Somente o administrador da instituição altera um gerente' using errcode = '42501';
  end if;
  if public.is_my_membership(v.membership_id) then
    raise exception 'Você não pode alterar o próprio vínculo';
  end if;
  update public.sector_members set status = p_status where id = p_sector_member;
end $$;

-- ───────────── Escalas ─────────────
create or replace function public.create_schedule(p_sector uuid, p_month integer, p_year integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_inst uuid; v_id uuid;
begin
  if not public.manages_sector(p_sector) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  select institution_id into v_inst from public.sectors where id = p_sector;
  begin
    insert into public.schedules (institution_id, sector_id, month, year, created_by)
    values (v_inst, p_sector, p_month, p_year, auth.uid()) returning id into v_id;
  exception when unique_violation then
    raise exception 'Já existe uma escala para este setor neste mês';
  end;
  return v_id;
end $$;

create or replace function public.upsert_shift(
  p_schedule uuid, p_membership uuid, p_date date, p_kind public.shift_kind,
  p_shift_type uuid default null, p_notes text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  s public.schedules%rowtype; v_tz text; st public.shift_types%rowtype;
  v_start timestamptz; v_end timestamptz; v_id uuid;
begin
  select * into s from public.schedules where id = p_schedule;
  if not found then raise exception 'Escala não encontrada'; end if;
  if not public.manages_sector(s.sector_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if s.status = 'archived' then raise exception 'Uma escala arquivada não pode ser alterada'; end if;
  if extract(month from p_date)::int <> s.month or extract(year from p_date)::int <> s.year then
    raise exception 'A data está fora do mês desta escala';
  end if;
  select timezone into v_tz from public.institutions where id = s.institution_id;

  if p_membership is not null and not public.is_active_sector_member(s.sector_id, p_membership) then
    raise exception 'O profissional não está ativo neste setor';
  end if;

  if p_kind = 'work' then
    select * into st from public.shift_types
    where id = p_shift_type and sector_id = s.sector_id and status = 'active';
    if not found then raise exception 'Tipo de plantão inválido para este setor'; end if;
    v_start := (p_date + st.start_time) at time zone v_tz;
    v_end := case when st.end_time > st.start_time
                  then (p_date + st.end_time) at time zone v_tz
                  else ((p_date + 1) + st.end_time) at time zone v_tz end;
    if p_membership is not null and exists (
         select 1 from public.shifts x where x.membership_id = p_membership and x.shift_date = p_date
           and x.kind <> 'work' and x.is_active) then
      raise exception 'O profissional está de folga, férias ou afastado neste dia';
    end if;
  else
    if p_membership is null then
      raise exception 'Informe o profissional para folga, férias ou afastamento';
    end if;
    if exists (select 1 from public.shifts x where x.membership_id = p_membership and x.shift_date = p_date
                 and x.kind = 'work' and x.is_active) then
      raise exception 'O profissional já tem plantão neste dia';
    end if;
  end if;

  begin
    insert into public.shifts as sh (institution_id, schedule_id, sector_id, shift_type_id, membership_id,
                                     kind, shift_date, start_at, end_at, notes, created_by)
    values (s.institution_id, s.id, s.sector_id,
            case when p_kind = 'work' then p_shift_type end,
            p_membership, p_kind, p_date, v_start, v_end, p_notes, auth.uid())
    on conflict (membership_id, shift_date) where kind <> 'work' and is_active
    do update set kind = excluded.kind, notes = excluded.notes, updated_at = now()
    returning sh.id into v_id;
  exception when exclusion_violation then
    raise exception 'Conflito de horário: o profissional já tem plantão neste período'
      using errcode = '23P01';
  end;

  if s.status = 'published' then
    update public.schedules set version = version + 1 where id = s.id;
    if p_membership is not null then
      perform public.push_notification_membership(p_membership, 'schedule_changed',
        'Sua escala foi alterada',
        format('A escala %s/%s do seu setor foi alterada. Confira seus plantões.',
               lpad(s.month::text, 2, '0'), s.year),
        '/app/minha-escala', s.id);
    end if;
  end if;
  return v_id;
end $$;

create or replace function public.remove_shift(p_shift uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare sh public.shifts%rowtype; sc public.schedules%rowtype;
begin
  select * into sh from public.shifts where id = p_shift for update;
  if not found or not sh.is_active then raise exception 'Plantão não encontrado'; end if;
  if not public.manages_sector(sh.sector_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  select * into sc from public.schedules where id = sh.schedule_id;
  if sc.status = 'archived' then raise exception 'Uma escala arquivada não pode ser alterada'; end if;
  if exists (select 1 from public.swap_requests r
             where r.shift_id = sh.id and r.status in ('pending', 'awaiting_manager')) then
    raise exception 'Este plantão está em negociação de troca. Cancele a troca antes de removê-lo.';
  end if;
  if exists (
    select 1 from public.swap_proposals p
    join public.swap_requests r on r.id = p.request_id
    where p.target_shift_id = sh.id and p.status in ('pending', 'accepted')
      and r.status in ('pending', 'awaiting_manager')
  ) then
    raise exception 'Este plantão está reservado em uma proposta de troca.';
  end if;
  update public.shifts set is_active = false, updated_at = now() where id = sh.id;
  if sc.status = 'published' then
    update public.schedules set version = version + 1 where id = sc.id;
    if sh.membership_id is not null then
      perform public.push_notification_membership(sh.membership_id, 'schedule_changed',
        'Sua escala foi alterada', 'Um plantão ou folga seu foi removido da escala publicada.',
        '/app/minha-escala', sc.id);
    end if;
  end if;
end $$;

-- Lacunas de cobertura mínima (por dia e tipo de plantão) de uma escala.
create or replace function public.coverage_gaps(p_schedule uuid)
returns table (gap_date date, gap_shift_type_id uuid, gap_shift_type_name text,
               required_count integer, assigned_count integer)
language plpgsql stable security definer set search_path = '' as $$
declare s public.schedules%rowtype; v_days integer;
begin
  select * into s from public.schedules where id = p_schedule;
  if not found or not public.manages_sector(s.sector_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  v_days := extract(day from (make_date(s.year, s.month, 1) + interval '1 month' - interval '1 day'))::int;
  return query
  with days as (
    select (make_date(s.year, s.month, 1) + g) as d from generate_series(0, v_days - 1) g
  ),
  counts as (
    select days.d, cr.shift_type_id as tid, st.name as tname, cr.min_professionals as req,
           (select count(*) from public.shifts sh
            where sh.schedule_id = s.id and sh.is_active and sh.kind = 'work'
              and sh.membership_id is not null and sh.shift_type_id = cr.shift_type_id
              and sh.shift_date = days.d) as got
    from days
    cross join public.coverage_rules cr
    join public.shift_types st on st.id = cr.shift_type_id
    where cr.sector_id = s.sector_id and st.status = 'active'
  )
  select c.d, c.tid, c.tname, c.req::int, c.got::int
  from counts c where c.got < c.req order by c.d, c.tname;
end $$;

create or replace function public.publish_schedule(p_schedule uuid, p_force boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.schedules%rowtype; v_gaps integer; v_shifts integer; v_open integer;
begin
  select * into s from public.schedules where id = p_schedule for update;
  if not found then raise exception 'Escala não encontrada'; end if;
  if not public.manages_sector(s.sector_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if s.status <> 'draft' then raise exception 'Esta escala já foi publicada'; end if;

  select count(*) into v_shifts from public.shifts where schedule_id = s.id and is_active;
  if v_shifts = 0 then
    raise exception 'A escala está vazia. Adicione plantões antes de publicar.';
  end if;
  select count(*) into v_open from public.shifts
    where schedule_id = s.id and is_active and kind = 'work' and membership_id is null;
  select count(*) into v_gaps from public.coverage_gaps(s.id);
  if v_gaps > 0 and not p_force then
    raise exception 'Cobertura mínima não atendida em % turno(s). Revise a escala ou publique mesmo assim.', v_gaps
      using hint = 'coverage_gaps';
  end if;

  update public.schedules
     set status = 'published', published_at = now(), version = version + 1
   where id = s.id;

  insert into public.schedule_versions (institution_id, schedule_id, version, snapshot, created_by)
  select s.institution_id, s.id, s.version + 1, coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb), auth.uid()
  from public.shifts x where x.schedule_id = s.id and x.is_active;

  insert into public.notifications (user_id, institution_id, type, title, message, link, ref_id)
  select m.user_id, m.institution_id, 'schedule_published', 'Nova escala publicada',
         format('A escala %s/%s do seu setor foi publicada.', lpad(s.month::text, 2, '0'), s.year),
         '/app/minha-escala', s.id
  from public.sector_members sm
  join public.memberships m on m.id = sm.membership_id
  where sm.sector_id = s.sector_id and sm.status = 'active' and m.status = 'active';

  return jsonb_build_object('published', true, 'shifts', v_shifts, 'open_shifts', v_open, 'gaps', v_gaps);
end $$;

-- ───────────── Trocas ─────────────
create or replace function public.create_swap_request(
  p_shift uuid, p_type public.request_type, p_description text default null,
  p_target_membership uuid default null, p_target_shift uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s public.shifts%rowtype; t public.shifts%rowtype; v_me uuid; v_req uuid;
begin
  -- Trava os plantões sempre em ordem de id (evita deadlock entre duas negociações cruzadas).
  perform 1 from public.shifts where id = p_shift or id = p_target_shift order by id for update;

  select * into s from public.shifts where id = p_shift;
  if not found or not s.is_active or s.kind <> 'work' then
    raise exception 'Plantão inexistente ou indisponível para troca';
  end if;
  v_me := public.my_membership_id(s.institution_id);
  if v_me is null or s.membership_id is distinct from v_me then
    raise exception 'Você só pode trocar plantões que são seus' using errcode = '42501';
  end if;
  if not public.is_active_sector_member(s.sector_id, v_me) then
    raise exception 'Você não está ativo neste setor' using errcode = '42501';
  end if;
  if not exists (select 1 from public.schedules sc where sc.id = s.schedule_id and sc.status = 'published') then
    raise exception 'A escala deste plantão ainda não foi publicada';
  end if;
  if s.start_at <= now() then raise exception 'Não é possível trocar um plantão que já começou'; end if;
  if exists (select 1 from public.swap_requests r
             where r.shift_id = s.id and r.status in ('pending', 'awaiting_manager')) then
    raise exception 'Este plantão já está em negociação';
  end if;

  if p_type = 'direct' then
    if p_target_membership is null or p_target_membership = v_me then
      raise exception 'Escolha um colega para a troca direta';
    end if;
    if not public.is_active_sector_member(s.sector_id, p_target_membership) then
      raise exception 'O colega não está ativo neste setor';
    end if;
    if p_target_shift is not null then
      select * into t from public.shifts where id = p_target_shift;
      if not found or not t.is_active or t.kind <> 'work'
         or t.membership_id is distinct from p_target_membership or t.sector_id <> s.sector_id then
        raise exception 'O plantão oferecido pelo colega não está disponível';
      end if;
      if t.start_at <= now() then raise exception 'O plantão do colega já começou'; end if;
      if not exists (select 1 from public.schedules sc where sc.id = t.schedule_id and sc.status = 'published') then
        raise exception 'A escala do plantão do colega ainda não foi publicada';
      end if;
      if exists (select 1 from public.swap_requests r
                 where r.shift_id = t.id and r.status in ('pending', 'awaiting_manager')) then
        raise exception 'O plantão do colega já está em negociação';
      end if;
      if exists (
        select 1 from public.swap_proposals p
        join public.swap_requests r on r.id = p.request_id
        where p.target_shift_id = t.id and p.status in ('pending', 'accepted')
          and r.status in ('pending', 'awaiting_manager')
      ) then
        raise exception 'O plantão do colega já está reservado em outra proposta';
      end if;
    end if;
  end if;

  insert into public.swap_requests (institution_id, sector_id, requester_membership_id, shift_id,
                                    request_type, description)
  values (s.institution_id, s.sector_id, v_me, s.id, p_type, nullif(trim(p_description), ''))
  returning id into v_req;

  if p_type = 'direct' then
    insert into public.swap_proposals (institution_id, request_id, proposer_membership_id,
                                       recipient_membership_id, taker_membership_id, target_shift_id)
    values (s.institution_id, v_req, v_me, p_target_membership, p_target_membership, p_target_shift);
    perform public.push_notification_membership(p_target_membership, 'swap_received',
      'Nova proposta de troca', 'Um colega propôs uma troca de plantão com você.',
      '/app/minhas-solicitacoes', v_req);
  end if;
  return v_req;
end $$;

-- Mural: um colega manifesta interesse em um plantão oferecido (opcionalmente com contrapartida).
create or replace function public.propose_swap(
  p_request uuid, p_target_shift uuid default null, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare r public.swap_requests%rowtype; t public.shifts%rowtype; v_me uuid; v_id uuid;
begin
  select * into r from public.swap_requests where id = p_request for update;
  if not found then raise exception 'Solicitação não encontrada'; end if;
  v_me := public.my_membership_id(r.institution_id);
  if v_me is null or not public.is_active_sector_member(r.sector_id, v_me) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if r.request_type <> 'open' or r.status <> 'pending' then
    raise exception 'Esta oportunidade não está mais disponível';
  end if;
  if r.requester_membership_id = v_me then raise exception 'Você não pode propor para a própria solicitação'; end if;

  if p_target_shift is not null then
    perform 1 from public.shifts where id = p_target_shift for update;
    select * into t from public.shifts where id = p_target_shift;
    if not found or not t.is_active or t.kind <> 'work' or t.membership_id is distinct from v_me
       or t.sector_id <> r.sector_id or t.start_at <= now() then
      raise exception 'O plantão oferecido como contrapartida não está disponível';
    end if;
    if not exists (select 1 from public.schedules sc where sc.id = t.schedule_id and sc.status = 'published') then
      raise exception 'A escala do plantão oferecido como contrapartida ainda não foi publicada';
    end if;
    if exists (select 1 from public.swap_requests x
               where x.shift_id = t.id and x.status in ('pending', 'awaiting_manager')) then
      raise exception 'O plantão oferecido como contrapartida já está em negociação';
    end if;
    if exists (
      select 1 from public.swap_proposals p
      join public.swap_requests x on x.id = p.request_id
      where p.target_shift_id = t.id and p.status in ('pending', 'accepted')
        and x.status in ('pending', 'awaiting_manager')
    ) then
      raise exception 'O plantão oferecido como contrapartida já está reservado';
    end if;
  end if;

  begin
    insert into public.swap_proposals (institution_id, request_id, proposer_membership_id,
                                       recipient_membership_id, taker_membership_id, target_shift_id, message)
    values (r.institution_id, r.id, v_me, r.requester_membership_id, v_me, p_target_shift,
            nullif(trim(p_message), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'Você já enviou uma proposta pendente para esta solicitação';
  end;

  perform public.push_notification_membership(r.requester_membership_id, 'swap_received',
    'Novo interesse no seu plantão', 'Um colega manifestou interesse em assumir seu plantão.',
    '/app/minhas-solicitacoes', r.id);
  return v_id;
end $$;

create or replace function public.respond_swap_proposal(p_proposal uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare pr public.swap_proposals%rowtype; r public.swap_requests%rowtype;
begin
  select * into pr from public.swap_proposals where id = p_proposal;
  if not found then raise exception 'Proposta não encontrada'; end if;
  -- Ordem de trava: solicitação primeiro, depois proposta (igual em todas as funções).
  select * into r from public.swap_requests where id = pr.request_id for update;
  select * into pr from public.swap_proposals where id = p_proposal for update;
  if not public.is_my_membership(pr.recipient_membership_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if pr.status <> 'pending' or r.status <> 'pending' then
    raise exception 'Esta proposta não está mais disponível';
  end if;

  if p_accept then
    perform 1 from public.shifts where id = r.shift_id or id = pr.target_shift_id order by id for update;
    if not exists (
      select 1 from public.shifts sh
      join public.schedules sc on sc.id = sh.schedule_id and sc.status = 'published'
      where sh.id = r.shift_id and sh.is_active and sh.kind = 'work'
        and sh.membership_id = r.requester_membership_id and sh.start_at > now()
    ) then
      raise exception 'O plantão foi alterado e a proposta não pode mais ser aceita';
    end if;
    if pr.target_shift_id is not null and not exists (
         select 1 from public.shifts sh
         join public.schedules sc on sc.id = sh.schedule_id and sc.status = 'published'
         where sh.id = pr.target_shift_id and sh.is_active and sh.kind = 'work'
           and sh.membership_id = pr.taker_membership_id and sh.start_at > now()) then
      raise exception 'O plantão oferecido como contrapartida foi alterado';
    end if;
    if not public.is_active_sector_member(r.sector_id, r.requester_membership_id)
       or not public.is_active_sector_member(r.sector_id, pr.taker_membership_id) then
      raise exception 'Um dos profissionais não tem mais vínculo ativo no setor';
    end if;
    update public.swap_proposals set status = 'accepted', responded_at = now() where id = pr.id;
    update public.swap_proposals set status = 'rejected', responded_at = now()
      where request_id = r.id and status = 'pending' and id <> pr.id;
    update public.swap_requests set status = 'awaiting_manager', updated_at = now() where id = r.id;
    perform public.push_notification_membership(pr.proposer_membership_id, 'swap_accepted',
      'Proposta aceita', 'A proposta foi aceita e agora aguarda a aprovação da gerência.',
      '/app/minhas-solicitacoes', r.id);
    perform public.push_notification_managers(r.sector_id, 'swap_awaiting_approval',
      'Troca aguardando aprovação', 'Uma troca de plantão aceita pelos profissionais aguarda sua decisão.',
      '/app/aprovacoes', r.id);
  else
    update public.swap_proposals set status = 'rejected', responded_at = now() where id = pr.id;
    if r.request_type = 'direct' then
      update public.swap_requests set status = 'cancelled', updated_at = now() where id = r.id;
    end if;
    perform public.push_notification_membership(pr.proposer_membership_id, 'swap_rejected',
      'Proposta recusada', 'Sua proposta de troca foi recusada.', '/app/minhas-solicitacoes', r.id);
  end if;
end $$;

create or replace function public.cancel_swap_request(p_request uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.swap_requests%rowtype; pr public.swap_proposals%rowtype;
begin
  select * into r from public.swap_requests where id = p_request for update;
  if not found then raise exception 'Solicitação não encontrada'; end if;
  if not public.is_my_membership(r.requester_membership_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if r.status not in ('pending', 'awaiting_manager') then
    raise exception 'Esta solicitação não pode mais ser cancelada';
  end if;
  for pr in select * from public.swap_proposals where request_id = r.id and status in ('pending', 'accepted') loop
    perform public.push_notification_membership(
      case when pr.proposer_membership_id = r.requester_membership_id
           then pr.recipient_membership_id else pr.proposer_membership_id end,
      'swap_cancelled', 'Troca cancelada', 'A solicitação de troca foi cancelada pelo solicitante.',
      '/app/minhas-solicitacoes', r.id);
  end loop;
  update public.swap_proposals set status = 'cancelled', responded_at = now()
    where request_id = r.id and status in ('pending', 'accepted');
  update public.swap_requests set status = 'cancelled', updated_at = now() where id = r.id;
end $$;

-- Aprovação/rejeição pela gerência. TUDO acontece numa única transação: qualquer erro desfaz tudo.
-- Cobertura: a troca é 1:1 (ou 1:0 com substituição), então a contagem de profissionais por tipo
-- de plantão não muda; por isso não há recontagem aqui. Se a regra de cobertura passar a considerar
-- cargo/qualificação, inclua a checagem neste ponto.
create or replace function public.decide_swap(p_request uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r public.swap_requests%rowtype; pr public.swap_proposals%rowtype;
  s1 public.shifts%rowtype; s2 public.shifts%rowtype;
  v_min integer; v_exclude uuid[];
begin
  select * into r from public.swap_requests where id = p_request for update;
  if not found then raise exception 'Solicitação não encontrada'; end if;
  if not public.manages_sector(r.sector_id) then
    raise exception 'Sem permissão para esta operação' using errcode = '42501';
  end if;
  if r.status <> 'awaiting_manager' then
    raise exception 'Esta solicitação não está aguardando aprovação';
  end if;
  select * into pr from public.swap_proposals where request_id = r.id and status = 'accepted' for update;
  if not found then raise exception 'Nenhuma proposta aceita para esta solicitação'; end if;

  if not p_approve then
    if coalesce(trim(p_reason), '') = '' then raise exception 'Informe o motivo da rejeição'; end if;
    update public.swap_requests set status = 'denied', updated_at = now() where id = r.id;
    insert into public.swap_approvals (institution_id, request_id, proposal_id, decided_by, decision, reason)
    values (r.institution_id, r.id, pr.id, auth.uid(), 'denied', trim(p_reason));
    perform public.push_notification_membership(r.requester_membership_id, 'swap_denied',
      'Troca rejeitada', 'A gerência rejeitou a troca de plantão. Motivo: ' || trim(p_reason),
      '/app/minhas-solicitacoes', r.id);
    perform public.push_notification_membership(pr.taker_membership_id, 'swap_denied',
      'Troca rejeitada', 'A gerência rejeitou a troca de plantão. Motivo: ' || trim(p_reason),
      '/app/minhas-solicitacoes', r.id);
    return;
  end if;

  -- Trava os plantões em ordem de id e revalida TUDO no banco, imediatamente antes de alterar.
  perform 1 from public.shifts where id = r.shift_id or id = pr.target_shift_id order by id for update;

  select * into s1 from public.shifts where id = r.shift_id;
  if not found or not s1.is_active or s1.kind <> 'work'
     or s1.membership_id is distinct from r.requester_membership_id then
    raise exception 'O plantão original foi alterado. A troca não pode ser aprovada.';
  end if;
  if s1.start_at <= now() then raise exception 'O plantão original já começou'; end if;
  if not exists (select 1 from public.schedules sc where sc.id = s1.schedule_id and sc.status = 'published') then
    raise exception 'A escala do plantão original não está publicada';
  end if;

  if pr.target_shift_id is not null then
    select * into s2 from public.shifts where id = pr.target_shift_id;
    if not found or not s2.is_active or s2.kind <> 'work'
       or s2.membership_id is distinct from pr.taker_membership_id then
      raise exception 'O plantão do colega foi alterado. A troca não pode ser aprovada.';
    end if;
    if s2.start_at <= now() then raise exception 'O plantão do colega já começou'; end if;
    if not exists (select 1 from public.schedules sc where sc.id = s2.schedule_id and sc.status = 'published') then
      raise exception 'A escala do plantão do colega não está publicada';
    end if;
  end if;

  if not public.is_active_sector_member(r.sector_id, r.requester_membership_id)
     or not public.is_active_sector_member(r.sector_id, pr.taker_membership_id) then
    raise exception 'Um dos profissionais não tem mais vínculo ativo no setor';
  end if;

  if not public.position_ok(r.sector_id, pr.taker_membership_id, s1.shift_type_id) then
    raise exception 'O colega não tem o cargo exigido para o plantão original';
  end if;
  if pr.target_shift_id is not null then
    if not public.position_ok(r.sector_id, r.requester_membership_id, s2.shift_type_id) then
      raise exception 'O solicitante não tem o cargo exigido para o plantão do colega';
    end if;
  end if;

  select min_rest_hours into v_min from public.sectors where id = r.sector_id;
  v_exclude := array[s1.id, coalesce(pr.target_shift_id, s1.id)];
  if public.has_rest_violation(pr.taker_membership_id, s1.start_at, s1.end_at, v_exclude, v_min) then
    raise exception 'Intervalo mínimo entre jornadas (% h) não respeitado para o colega', v_min;
  end if;
  if pr.target_shift_id is not null then
    if public.has_rest_violation(r.requester_membership_id, s2.start_at, s2.end_at, v_exclude, v_min) then
      raise exception 'Intervalo mínimo entre jornadas (% h) não respeitado para o solicitante', v_min;
    end if;
  end if;

  -- Esvazia os dois plantões antes de atribuir (evita falso conflito transitório de sobreposição).
  update public.shifts set membership_id = null, updated_at = now() where id = any (v_exclude);
  begin
    update public.shifts set membership_id = pr.taker_membership_id, updated_at = now() where id = s1.id;
    if pr.target_shift_id is not null then
      update public.shifts set membership_id = r.requester_membership_id, updated_at = now()
        where id = pr.target_shift_id;
    end if;
  exception when exclusion_violation then
    raise exception 'Conflito de horário: um dos profissionais já tem plantão neste período'
      using errcode = '23P01';
  end;

  update public.swap_requests set status = 'approved', updated_at = now() where id = r.id;
  insert into public.swap_approvals (institution_id, request_id, proposal_id, decided_by, decision, reason)
  values (r.institution_id, r.id, pr.id, auth.uid(), 'approved', nullif(trim(p_reason), ''));
  if pr.target_shift_id is not null then
    update public.schedules set version = version + 1
      where id in (s1.schedule_id, s2.schedule_id);
  else
    update public.schedules set version = version + 1 where id = s1.schedule_id;
  end if;

  perform public.push_notification_membership(r.requester_membership_id, 'swap_approved',
    'Troca aprovada', 'A gerência aprovou a troca. Sua escala foi atualizada.', '/app/minha-escala', r.id);
  perform public.push_notification_membership(pr.taker_membership_id, 'swap_approved',
    'Troca aprovada', 'A gerência aprovou a troca. Sua escala foi atualizada.', '/app/minha-escala', r.id);
end $$;

-- ───────────── Notificações ─────────────
create or replace function public.mark_notifications_read(p_ids uuid[] default null) returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids))
$$;

-- Lembretes de plantão nas próximas 24 h. Idempotente (índice único). Agende com pg_cron, por exemplo:
--   select cron.schedule('shift-reminders', '0 * * * *', 'select public.send_shift_reminders()');
create or replace function public.send_shift_reminders() returns integer
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  with ins as (
    insert into public.notifications (user_id, institution_id, type, title, message, link, ref_id)
    select m.user_id, sh.institution_id, 'shift_reminder', 'Lembrete de plantão',
           'Você tem um plantão nas próximas 24 horas. Confira sua escala.', '/app/minha-escala', sh.id
    from public.shifts sh
    join public.memberships m on m.id = sh.membership_id and m.status = 'active'
    join public.schedules sc on sc.id = sh.schedule_id and sc.status = 'published'
    where sh.kind = 'work' and sh.is_active
      and sh.start_at > now() and sh.start_at <= now() + interval '24 hours'
    on conflict (user_id, type, ref_id) where type = 'shift_reminder' do nothing
    returning 1)
  select count(*) into v_count from ins;
  return v_count;
end $$;
