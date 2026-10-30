-- Plantão+ · 0004 — Permissões e Realtime
-- Princípio: o cliente (anon/authenticated) só LÊ tabelas (filtrado por RLS) e escreve por funções.
-- Exceções com política RLS: cadastros administrativos (institutions, units, sectors, shift_types,
-- coverage_rules) e os campos full_name/phone do próprio perfil.

revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- Novas funções criadas depois NÃO ficam executáveis pelo cliente por padrão.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to authenticated;

grant update (full_name, phone) on public.profiles to authenticated;
grant insert, update on public.institutions, public.units, public.sectors,
                        public.shift_types, public.coverage_rules to authenticated;

-- Funções usadas pelas políticas RLS (a checagem de EXECUTE é feita com o papel do chamador).
grant execute on function
  public.is_platform_admin(), public.is_member(uuid), public.is_institution_admin(uuid),
  public.my_membership_id(uuid), public.is_my_membership(uuid), public.manages_sector(uuid),
  public.in_sector(uuid), public.can_view_sector(uuid), public.is_active_sector_member(uuid, uuid),
  public.can_see_membership(uuid), public.can_see_profile(uuid),
  public.owns_or_manages_request(uuid), public.can_see_request(uuid)
to authenticated;

-- API (RPC) do aplicativo.
grant execute on function
  public.create_institution(text, text, text, text),
  public.create_invitation(uuid, uuid, text, public.member_role, text, boolean),
  public.accept_invitation(uuid),
  public.set_membership_status(uuid, public.record_status),
  public.set_sector_member_status(uuid, public.record_status),
  public.create_schedule(uuid, integer, integer),
  public.upsert_shift(uuid, uuid, date, public.shift_kind, uuid, text),
  public.remove_shift(uuid),
  public.coverage_gaps(uuid),
  public.publish_schedule(uuid, boolean),
  public.create_swap_request(uuid, public.request_type, text, uuid, uuid),
  public.propose_swap(uuid, uuid, text),
  public.respond_swap_proposal(uuid, boolean),
  public.cancel_swap_request(uuid),
  public.decide_swap(uuid, boolean, text),
  public.mark_notifications_read(uuid[])
to authenticated;

-- A tela de convite pode mostrar dados mínimos antes do login.
grant execute on function public.get_invitation(uuid) to anon, authenticated;

-- NÃO concedidos ao cliente: push_notification*, has_rest_violation, position_ok,
-- send_shift_reminders, handle_new_user, audit_trigger.

-- Realtime (as políticas RLS continuam valendo para quem assina as mudanças).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      public.notifications, public.shifts, public.swap_requests, public.swap_proposals;
  end if;
end $$;
