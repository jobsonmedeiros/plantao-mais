-- Plantão+ · 0002 — Funções de autorização, gatilhos e políticas RLS
-- Regra: nenhuma política confia em valores enviados pelo frontend. Tudo parte de auth.uid()
-- e do vínculo ATIVO do usuário (memberships/sector_members).
-- As funções abaixo são SECURITY DEFINER (ignoram RLS) para evitar recursão entre políticas.

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_platform_admin from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.is_member(p_institution uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m
    where m.institution_id = p_institution and m.user_id = auth.uid() and m.status = 'active')
$$;

create or replace function public.is_institution_admin(p_institution uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m
    where m.institution_id = p_institution and m.user_id = auth.uid()
      and m.status = 'active' and m.role = 'institution_admin')
$$;

create or replace function public.my_membership_id(p_institution uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.id from public.memberships m
  where m.institution_id = p_institution and m.user_id = auth.uid() and m.status = 'active'
$$;

create or replace function public.is_my_membership(p_membership uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m
    where m.id = p_membership and m.user_id = auth.uid() and m.status = 'active')
$$;

-- Administra o setor: administrador da instituição OU gerente vinculado a ESTE setor.
create or replace function public.manages_sector(p_sector uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.sectors s
    join public.memberships m
      on m.institution_id = s.institution_id and m.user_id = auth.uid() and m.status = 'active'
    where s.id = p_sector
      and (
        m.role = 'institution_admin'
        or (m.role = 'manager' and exists (
              select 1 from public.sector_members sm
              where sm.sector_id = s.id and sm.membership_id = m.id
                and sm.is_manager and sm.status = 'active'))
      ))
$$;

-- Participa do setor (qualquer papel) com vínculos ativos.
create or replace function public.in_sector(p_sector uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sector_members sm
    join public.memberships m on m.id = sm.membership_id
    where sm.sector_id = p_sector and sm.status = 'active'
      and m.user_id = auth.uid() and m.status = 'active')
$$;

create or replace function public.can_view_sector(p_sector uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.manages_sector(p_sector) or public.in_sector(p_sector)
$$;

create or replace function public.is_active_sector_member(p_sector uuid, p_membership uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.sector_members sm
    join public.memberships m on m.id = sm.membership_id
    where sm.sector_id = p_sector and sm.membership_id = p_membership
      and sm.status = 'active' and m.status = 'active')
$$;

create or replace function public.can_see_membership(p_membership uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships t
    where t.id = p_membership
      and (
        t.user_id = auth.uid()
        or public.is_institution_admin(t.institution_id)
        or exists (select 1 from public.sector_members sm
                   where sm.membership_id = t.id and public.can_view_sector(sm.sector_id))
      ))
$$;

create or replace function public.can_see_profile(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user = auth.uid()
    or exists (select 1 from public.memberships t
               where t.user_id = p_user and public.can_see_membership(t.id))
$$;

create or replace function public.owns_or_manages_request(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.swap_requests r
    where r.id = p_request
      and (public.is_my_membership(r.requester_membership_id) or public.manages_sector(r.sector_id)))
$$;

create or replace function public.can_see_request(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.swap_requests r
    where r.id = p_request
      and (
        public.is_my_membership(r.requester_membership_id)
        or public.manages_sector(r.sector_id)
        or (r.request_type = 'open' and r.status = 'pending' and public.in_sector(r.sector_id))
        or exists (select 1 from public.swap_proposals p
                   where p.request_id = r.id
                     and (public.is_my_membership(p.proposer_membership_id)
                          or public.is_my_membership(p.recipient_membership_id)
                          or public.is_my_membership(p.taker_membership_id)))
      ))
$$;

-- ───────────── Gatilhos ─────────────
-- Cria o perfil quando alguém se cadastra. Cadastro público NÃO concede acesso a nenhuma instituição.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auditoria genérica: registra ator, ação e estado anterior/novo.
create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_old jsonb; v_new jsonb; v_row jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new, v_old);
  insert into public.audit_logs (institution_id, actor_id, action, entity_type, entity_id, metadata)
  values (nullif(v_row ->> 'institution_id', '')::uuid, auth.uid(), tg_op, tg_table_name,
          nullif(v_row ->> 'id', '')::uuid, jsonb_build_object('old', v_old, 'new', v_new));
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['institutions','units','sectors','memberships','sector_members','invitations',
    'shift_types','coverage_rules','schedules','shifts','swap_requests','swap_proposals','swap_approvals']
  loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$s
                    for each row execute function public.audit_trigger()', t);
  end loop;
end $$;

-- ───────────── RLS ─────────────
alter table public.institutions enable row level security;
alter table public.units enable row level security;
alter table public.sectors enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.sector_members enable row level security;
alter table public.invitations enable row level security;
alter table public.shift_types enable row level security;
alter table public.coverage_rules enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_versions enable row level security;
alter table public.shifts enable row level security;
alter table public.swap_requests enable row level security;
alter table public.swap_proposals enable row level security;
alter table public.swap_approvals enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Instituições: o administrador da plataforma gerencia o cadastro; membros só enxergam a própria.
create policy institutions_select on public.institutions for select to authenticated
  using (public.is_platform_admin() or public.is_member(id));
create policy institutions_insert on public.institutions for insert to authenticated
  with check (public.is_platform_admin());
create policy institutions_update on public.institutions for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy units_select on public.units for select to authenticated
  using (public.is_member(institution_id));
create policy units_insert on public.units for insert to authenticated
  with check (public.is_institution_admin(institution_id));
create policy units_update on public.units for update to authenticated
  using (public.is_institution_admin(institution_id)) with check (public.is_institution_admin(institution_id));

create policy sectors_select on public.sectors for select to authenticated
  using (public.is_institution_admin(institution_id) or public.can_view_sector(id));
create policy sectors_insert on public.sectors for insert to authenticated
  with check (public.is_institution_admin(institution_id));
create policy sectors_update on public.sectors for update to authenticated
  using (public.is_institution_admin(institution_id)) with check (public.is_institution_admin(institution_id));

create policy profiles_select on public.profiles for select to authenticated
  using (public.can_see_profile(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Vínculos: sem política de escrita. Alterações só por funções (0003), com checagem de papel.
create policy memberships_select on public.memberships for select to authenticated
  using (public.can_see_membership(id));
create policy sector_members_select on public.sector_members for select to authenticated
  using (public.is_institution_admin(institution_id) or public.can_view_sector(sector_id));

create policy invitations_select on public.invitations for select to authenticated
  using (public.is_institution_admin(institution_id)
         or (sector_id is not null and public.manages_sector(sector_id))
         or public.is_platform_admin());

create policy shift_types_select on public.shift_types for select to authenticated
  using (public.is_institution_admin(institution_id) or public.can_view_sector(sector_id));
create policy shift_types_insert on public.shift_types for insert to authenticated
  with check (public.manages_sector(sector_id));
create policy shift_types_update on public.shift_types for update to authenticated
  using (public.manages_sector(sector_id)) with check (public.manages_sector(sector_id));

create policy coverage_rules_select on public.coverage_rules for select to authenticated
  using (public.manages_sector(sector_id));
create policy coverage_rules_insert on public.coverage_rules for insert to authenticated
  with check (public.manages_sector(sector_id));
create policy coverage_rules_update on public.coverage_rules for update to authenticated
  using (public.manages_sector(sector_id)) with check (public.manages_sector(sector_id));

-- Rascunho: só a gerência vê. Publicada: gerência + participantes do setor.
create policy schedules_select on public.schedules for select to authenticated
  using (public.manages_sector(sector_id) or (status = 'published' and public.in_sector(sector_id)));
create policy schedule_versions_select on public.schedule_versions for select to authenticated
  using (exists (select 1 from public.schedules s
                 where s.id = schedule_id and public.manages_sector(s.sector_id)));

create policy shifts_select on public.shifts for select to authenticated
  using (
    public.manages_sector(sector_id)
    or (public.in_sector(sector_id)
        and exists (select 1 from public.schedules s where s.id = schedule_id and s.status = 'published'))
  );

create policy swap_requests_select on public.swap_requests for select to authenticated
  using (public.can_see_request(id));
create policy swap_proposals_select on public.swap_proposals for select to authenticated
  using (
    public.is_my_membership(proposer_membership_id)
    or public.is_my_membership(recipient_membership_id)
    or public.is_my_membership(taker_membership_id)
    or public.owns_or_manages_request(request_id)
  );
create policy swap_approvals_select on public.swap_approvals for select to authenticated
  using (public.can_see_request(request_id));

create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());

create policy audit_logs_select on public.audit_logs for select to authenticated
  using (institution_id is not null and public.is_institution_admin(institution_id));
