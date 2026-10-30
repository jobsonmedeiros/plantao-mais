-- Plantão+ · Etapas 2–7 · 0001 — Esquema (tabelas, constraints e índices)
-- Convenções:
--  * UUID em todas as chaves; datas de eventos em timestamptz.
--  * Toda tabela institucional carrega institution_id e usa FKs compostas
--    (id, institution_id) para impedir referências entre instituições diferentes.
--  * Escritas sensíveis NÃO são feitas direto pelo cliente: passam por funções (0003).

create extension if not exists btree_gist with schema extensions;

create type public.member_role as enum ('institution_admin', 'manager', 'professional');
create type public.record_status as enum ('active', 'inactive');
create type public.schedule_status as enum ('draft', 'published', 'archived');
create type public.shift_kind as enum ('work', 'day_off', 'vacation', 'leave');
create type public.request_type as enum ('direct', 'open');
-- Estados da SOLICITAÇÃO. "accepted" pertence à PROPOSTA (aceite do colega), nunca à solicitação.
create type public.request_status as enum ('pending', 'awaiting_manager', 'approved', 'denied', 'cancelled');
create type public.proposal_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

-- ───────────── Instituições, unidades e setores ─────────────
create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  cnpj text,
  timezone text not null default 'America/Sao_Paulo',
  status public.record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  name text not null check (length(trim(name)) > 0),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (id, institution_id),
  unique (institution_id, name)
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  unit_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  status public.record_status not null default 'active',
  -- Intervalo mínimo entre jornadas (horas), configurável por setor. Validar com a instituição.
  min_rest_hours smallint not null default 11 check (min_rest_hours between 0 and 48),
  created_at timestamptz not null default now(),
  unique (id, institution_id),
  unique (unit_id, name),
  foreign key (unit_id, institution_id) references public.units (id, institution_id)
);

-- ───────────── Pessoas e vínculos ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  -- Só pode ser alterado por SQL de quem administra o banco. Nenhum privilégio de UPDATE no cliente.
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  user_id uuid not null references public.profiles (id),
  role public.member_role not null,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (institution_id, user_id),
  unique (id, institution_id)
);

create table public.sector_members (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  sector_id uuid not null,
  membership_id uuid not null,
  position text, -- cargo: Enfermeiro, Técnico de enfermagem, Auxiliar...
  is_manager boolean not null default false, -- gerencia ESTE setor
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (sector_id, membership_id),
  foreign key (sector_id, institution_id) references public.sectors (id, institution_id),
  foreign key (membership_id, institution_id) references public.memberships (id, institution_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id),
  sector_id uuid,
  email text not null check (email = lower(email)),
  role public.member_role not null,
  position text,
  is_manager boolean not null default false,
  token uuid not null unique default gen_random_uuid(),
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id),
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  foreign key (sector_id, institution_id) references public.sectors (id, institution_id)
);

-- ───────────── Escalas ─────────────
create table public.shift_types (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  sector_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  code text not null check (length(code) between 1 and 3),
  start_time time not null,
  end_time time not null, -- se end_time <= start_time, o plantão atravessa a meia-noite
  color text not null default '#1F5FA6' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  required_position text, -- cargo exigido (opcional); comparado com sector_members.position
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (id, institution_id),
  unique (id, sector_id),
  foreign key (sector_id, institution_id) references public.sectors (id, institution_id)
);

create table public.coverage_rules (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  sector_id uuid not null,
  shift_type_id uuid not null,
  min_professionals smallint not null check (min_professionals >= 0),
  unique (sector_id, shift_type_id),
  foreign key (sector_id, institution_id) references public.sectors (id, institution_id),
  foreign key (shift_type_id, sector_id) references public.shift_types (id, sector_id)
);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  sector_id uuid not null,
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2020 and 2100),
  status public.schedule_status not null default 'draft',
  version integer not null default 1,
  created_by uuid references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (sector_id, month, year), -- uma escala por setor/mês/ano
  unique (id, institution_id),
  unique (id, sector_id, institution_id),
  foreign key (sector_id, institution_id) references public.sectors (id, institution_id)
);

create table public.schedule_versions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  schedule_id uuid not null,
  version integer not null,
  snapshot jsonb not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  foreign key (schedule_id, institution_id) references public.schedules (id, institution_id)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  schedule_id uuid not null,
  sector_id uuid not null,
  shift_type_id uuid,
  membership_id uuid, -- NULL em plantão de tipo "work" = vaga aberta (descoberta)
  kind public.shift_kind not null default 'work',
  shift_date date not null, -- data local da escala (fuso da instituição)
  start_at timestamptz,
  end_at timestamptz,
  notes text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, institution_id),
  foreign key (schedule_id, sector_id, institution_id) references public.schedules (id, sector_id, institution_id),
  foreign key (shift_type_id, institution_id) references public.shift_types (id, institution_id),
  foreign key (membership_id, institution_id) references public.memberships (id, institution_id),
  constraint shifts_kind_fields check (
    (kind = 'work' and shift_type_id is not null and start_at is not null and end_at is not null and end_at > start_at)
    or (kind <> 'work' and membership_id is not null)
  ),
  -- Impede sobreposição de plantões do mesmo vínculo (inclusive plantões que cruzam a meia-noite).
  constraint shifts_no_overlap exclude using gist (
    membership_id with =,
    (tstzrange(start_at, end_at)) with &&
  ) where (kind = 'work' and is_active and membership_id is not null)
);

-- Uma folga/férias/afastamento por pessoa por dia.
create unique index shifts_one_absence_per_day
  on public.shifts (membership_id, shift_date) where kind <> 'work' and is_active;

-- ───────────── Trocas ─────────────
create table public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  sector_id uuid not null,
  requester_membership_id uuid not null,
  shift_id uuid not null,
  request_type public.request_type not null,
  description text,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, institution_id),
  foreign key (sector_id, institution_id) references public.sectors (id, institution_id),
  foreign key (requester_membership_id, institution_id) references public.memberships (id, institution_id),
  foreign key (shift_id, institution_id) references public.shifts (id, institution_id)
);

-- Um plantão só pode estar em uma negociação ativa por vez.
create unique index swap_requests_one_active_per_shift
  on public.swap_requests (shift_id) where status in ('pending', 'awaiting_manager');

create table public.swap_proposals (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  request_id uuid not null,
  proposer_membership_id uuid not null, -- quem enviou a proposta
  recipient_membership_id uuid not null, -- quem precisa aceitar/recusar
  taker_membership_id uuid not null, -- quem FICA com o plantão da solicitação se a troca for aprovada
  target_shift_id uuid, -- plantão do "taker" que vai para o solicitante (contrapartida, opcional)
  message text,
  status public.proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (id, institution_id),
  foreign key (request_id, institution_id) references public.swap_requests (id, institution_id),
  foreign key (proposer_membership_id, institution_id) references public.memberships (id, institution_id),
  foreign key (recipient_membership_id, institution_id) references public.memberships (id, institution_id),
  foreign key (taker_membership_id, institution_id) references public.memberships (id, institution_id),
  foreign key (target_shift_id, institution_id) references public.shifts (id, institution_id)
);

create unique index swap_proposals_one_pending_per_proposer
  on public.swap_proposals (request_id, proposer_membership_id) where status = 'pending';

create table public.swap_approvals (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  request_id uuid not null,
  proposal_id uuid not null,
  decided_by uuid not null references public.profiles (id),
  decision text not null check (decision in ('approved', 'denied')),
  reason text,
  created_at timestamptz not null default now(),
  foreign key (request_id, institution_id) references public.swap_requests (id, institution_id),
  foreign key (proposal_id, institution_id) references public.swap_proposals (id, institution_id)
);

-- ───────────── Notificações e auditoria ─────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  institution_id uuid references public.institutions (id),
  type text not null,
  title text not null,
  message text not null,
  link text,
  ref_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Lembrete de plantão: no máximo um por usuário e plantão.
create unique index notifications_one_reminder
  on public.notifications (user_id, type, ref_id) where type = 'shift_reminder';

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ───────────── Índices ─────────────
create index memberships_user_idx on public.memberships (user_id);
create index sector_members_sector_idx on public.sector_members (sector_id) where status = 'active';
create index sector_members_membership_idx on public.sector_members (membership_id);
create index schedules_sector_period_idx on public.schedules (institution_id, sector_id, year, month);
create index shifts_inst_sector_date_idx on public.shifts (institution_id, sector_id, shift_date);
create index shifts_schedule_idx on public.shifts (schedule_id) where is_active;
create index shifts_membership_date_idx on public.shifts (membership_id, shift_date);
create index swap_requests_sector_status_idx on public.swap_requests (institution_id, sector_id, status);
create index swap_proposals_request_idx on public.swap_proposals (request_id);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index audit_logs_inst_idx on public.audit_logs (institution_id, created_at desc);
create index invitations_inst_idx on public.invitations (institution_id, status);
