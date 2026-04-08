-- ============================================
-- CONTROL HORARI - RESET I CONFIGURACIÓ COMPLETA
-- ============================================
-- Aquest fitxer esborra tot el que existeix i ho crea de nou.
-- ÚS NOMÉS SI ESTÀS SEGUR QUE VOLS ESBORRAR TOT EL QUE HI HA.
-- ============================================

-- ============================================
-- PART 0: ESBORRAR TAULES I TIUS EXISTENTS
-- ============================================

-- Esborrar triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists guard_profiles_before_update on public.profiles;
drop trigger if exists guard_time_entries_before_mutation on public.time_entries;
drop trigger if exists guard_breaks_before_mutation on public.breaks;
drop trigger if exists audit_profiles_changes on public.profiles;
drop trigger if exists audit_teams_changes on public.teams;
drop trigger if exists audit_team_members_changes on public.team_members;
drop trigger if exists audit_work_calendars_changes on public.work_calendars;
drop trigger if exists audit_holidays_changes on public.holidays;
drop trigger if exists audit_system_settings_changes on public.system_settings;
drop trigger if exists audit_time_entries_changes on public.time_entries;
drop trigger if exists audit_breaks_changes on public.breaks;
drop trigger if exists set_work_calendars_updated_at on public.work_calendars;
drop trigger if exists set_profiles_updated_at on public.profiles;
drop trigger if exists set_teams_updated_at on public.teams;
drop trigger if exists set_holidays_updated_at on public.holidays;
drop trigger if exists set_system_settings_updated_at on public.system_settings;
drop trigger if exists set_notification_preferences_updated_at on public.user_notification_preferences;
drop trigger if exists set_time_entries_updated_at on public.time_entries;
drop trigger if exists set_breaks_updated_at on public.breaks;

-- Esborrar funcions
drop function if exists public.set_updated_at() cascade;
drop function if exists public.current_user_role() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.is_coordinator() cascade;
drop function if exists public.coordinator_can_access_user(uuid) cascade;
drop function if exists public.can_access_user(uuid) cascade;
drop function if exists public.can_manage_user(uuid) cascade;
drop function if exists public.can_access_team(uuid) cascade;
drop function if exists public.can_manage_team(uuid) cascade;
drop function if exists public.can_access_entry(uuid) cascade;
drop function if exists public.can_manage_entry(uuid) cascade;
drop function if exists public.can_access_audit_row(text, text, uuid) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.guard_profile_update() cascade;
drop function if exists public.guard_time_entry_mutation() cascade;
drop function if exists public.guard_break_mutation() cascade;
drop function if exists public.audit_changes() cascade;

-- Esborrar taules
drop table if exists public.report_exports cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.breaks cascade;
drop table if exists public.time_entries cascade;
drop table if exists public.user_notification_preferences cascade;
drop table if exists public.system_settings cascade;
drop table if exists public.holidays cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;
drop table if exists public.profiles cascade;
drop table if exists public.work_calendars cascade;

-- Esborrar tipus
drop type if exists public.app_role cascade;
drop type if exists public.break_type cascade;
drop type if exists public.holiday_scope cascade;
drop type if exists public.holiday_type cascade;
drop type if exists public.export_format cascade;

-- ============================================
-- PART 1: SCHEMA INICIAL
-- ============================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

create type public.app_role as enum ('worker', 'admin');
create type public.break_type as enum ('breakfast', 'lunch', 'personal', 'meeting');
create type public.holiday_scope as enum ('national', 'regional', 'school');
create type public.holiday_type as enum ('holiday', 'closure', 'vacation');
create type public.export_format as enum ('pdf', 'csv');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.work_calendars (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hours_per_day numeric(4,2) not null default 7.50,
  working_days smallint[] not null default array[1,2,3,4,5],
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_calendars_hours_positive check (hours_per_day > 0),
  constraint work_calendars_days_not_empty check (cardinality(working_days) > 0)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'worker',
  weekly_hours numeric(5,2) not null default 30.00,
  department text,
  avatar_url text,
  preferred_language text not null default 'ca',
  is_active boolean not null default true,
  calendar_id uuid references public.work_calendars (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_weekly_hours_positive check (weekly_hours > 0),
  constraint profiles_preferred_language_valid check (preferred_language in ('ca', 'es', 'en'))
);

create index profiles_role_idx on public.profiles (role);
create index profiles_department_idx on public.profiles (department);
create index profiles_active_idx on public.profiles (is_active);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  coordinator_id uuid references public.profiles (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teams_coordinator_idx on public.teams (coordinator_id);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index team_members_user_idx on public.team_members (user_id);
create index team_members_team_idx on public.team_members (team_id);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null,
  name text not null,
  scope public.holiday_scope not null,
  type public.holiday_type not null,
  region_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (holiday_date, name)
);

create index holidays_date_idx on public.holidays (holiday_date);

create table public.system_settings (
  id integer primary key default 1,
  ordinary_day_limit_hours numeric(4,2) not null default 9.00,
  overtime_limit_hours numeric(4,2) not null default 2.00,
  min_break_minutes integer not null default 30,
  geofencing_enabled boolean not null default false,
  allowed_radius_meters integer not null default 150,
  google_oauth_enabled boolean not null default false,
  weekly_summary_enabled boolean not null default false,
  inactivity_logout_hours integer not null default 4,
  trusted_session_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_settings_singleton check (id = 1),
  constraint system_settings_ordinary_positive check (ordinary_day_limit_hours > 0),
  constraint system_settings_overtime_non_negative check (overtime_limit_hours >= 0),
  constraint system_settings_break_non_negative check (min_break_minutes >= 0),
  constraint system_settings_radius_non_negative check (allowed_radius_meters >= 0),
  constraint system_settings_inactivity_positive check (inactivity_logout_hours > 0),
  constraint system_settings_trusted_days_positive check (trusted_session_days > 0)
);

create table public.user_notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  notify_missing_clock_out boolean not null default true,
  notify_weekly_summary boolean not null default false,
  notify_entry_corrections boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz,
  clock_in_timezone text not null default 'Europe/Madrid',
  clock_out_timezone text,
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_in_accuracy_meters numeric(6,2),
  clock_out_lat double precision,
  clock_out_lng double precision,
  clock_out_accuracy_meters numeric(6,2),
  notes text,
  source text not null default 'web',
  is_manual boolean not null default false,
  edited_by uuid references public.profiles (id) on delete set null,
  edit_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_clock_order check (clock_out is null or clock_out >= clock_in),
  constraint time_entries_source_valid check (source in ('web', 'mobile', 'admin', 'import')),
  constraint time_entries_clock_in_accuracy_non_negative check (clock_in_accuracy_meters is null or clock_in_accuracy_meters >= 0),
  constraint time_entries_clock_out_accuracy_non_negative check (clock_out_accuracy_meters is null or clock_out_accuracy_meters >= 0)
);

create index time_entries_user_clock_in_idx on public.time_entries (user_id, clock_in desc);
create index time_entries_clock_in_idx on public.time_entries (clock_in desc);
create unique index time_entries_one_active_per_user_idx on public.time_entries (user_id) where clock_out is null;

create table public.breaks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.time_entries (id) on delete cascade,
  break_type public.break_type not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  is_manual boolean not null default false,
  edited_by uuid references public.profiles (id) on delete set null,
  edit_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint breaks_time_order check (ended_at is null or ended_at >= started_at)
);

create index breaks_entry_started_idx on public.breaks (entry_id, started_at);
create unique index breaks_one_active_per_entry_idx on public.breaks (entry_id) where ended_at is null;
alter table public.breaks
  add constraint breaks_no_overlap
  exclude using gist (
    entry_id with =,
    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&
  );

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_table text,
  target_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_actor_created_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_target_idx on public.audit_log (target_table, target_id, created_at desc);

create table public.report_exports (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles (id) on delete cascade,
  subject_user_id uuid references public.profiles (id) on delete set null,
  team_id uuid references public.teams (id) on delete set null,
  export_format public.export_format not null,
  filters jsonb not null default '{}'::jsonb,
  storage_path text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index report_exports_requester_idx on public.report_exports (requested_by, created_at desc);

-- ============================================
-- PART 2: FUNCIONS
-- ============================================

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- La funció is_coordinator() s'ha eliminat perquè el rol de coordinador ja no existeix

-- La funció coordinator_can_access_user() s'ha eliminat perquè el rol de coordinador ja no existeix

create or replace function public.can_access_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    auth.uid() = target_user_id
    or public.is_admin()
  )
$$;

create or replace function public.can_manage_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
$$;

create or replace function public.can_access_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
$$;

create or replace function public.can_manage_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
$$;

create or replace function public.can_access_entry(target_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.time_entries te
    where te.id = target_entry_id
      and public.can_access_user(te.user_id)
  )
$$;

create or replace function public.can_manage_entry(target_entry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.time_entries te
    where te.id = target_entry_id
      and public.can_manage_user(te.user_id)
  )
$$;

create or replace function public.can_access_audit_row(target_table_name text, target_row_id text, target_actor_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return true;
  end if;

  if target_actor_id = auth.uid() then
    return true;
  end if;

  if target_table_name = 'profiles' and target_row_id ~* '^[0-9a-f-]{36}$' then
    return public.can_access_user(target_row_id::uuid);
  end if;

  if target_table_name = 'time_entries' and target_row_id ~* '^[0-9a-f-]{36}$' then
    return exists (
      select 1
      from public.time_entries te
      where te.id = target_row_id::uuid
        and public.can_access_user(te.user_id)
    );
  end if;

  if target_table_name = 'breaks' and target_row_id ~* '^[0-9a-f-]{36}$' then
    return exists (
      select 1
      from public.breaks b
      join public.time_entries te on te.id = b.entry_id
      where b.id = target_row_id::uuid
        and public.can_access_user(te.user_id)
    );
  end if;

  return false;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_calendar_id uuid;
begin
  select id
  into default_calendar_id
  from public.work_calendars
  where is_default = true
  order by created_at asc
  limit 1;

  insert into public.profiles (id, full_name, role, calendar_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'worker',
    default_calendar_id
  )
  on conflict (id) do nothing;

  insert into public.user_notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  -- Permet actualitzacions del propi perfil sense restriccions
  if auth.uid() = old.id then
    return new;
  end if;

  -- Permet actualitzacions si és administrador
  if public.is_admin() then
    return new;
  end if;

  -- Per a altres casos, impedir actualitzacions
  raise exception 'Only admins can update other profiles';
end;
$$;

create or replace function public.guard_time_entry_mutation()
returns trigger
language plpgsql
as $$
declare
  is_manager boolean;
  changed_core_fields boolean;
begin
  if tg_op = 'INSERT' then
    is_manager := public.can_manage_user(new.user_id);

    if auth.uid() is null then
      raise exception 'Authentication required';
    end if;

    if new.user_id <> auth.uid() and not is_manager then
      raise exception 'You cannot create entries for another user';
    end if;

    if new.clock_out is not null and new.clock_out < new.clock_in then
      raise exception 'clock_out must be greater than or equal to clock_in';
    end if;

    if is_manager and (new.user_id <> auth.uid() or new.clock_out is not null or new.is_manual) then
      if coalesce(btrim(new.edit_reason), '') = '' then
        raise exception 'edit_reason is required for manual entries';
      end if;
      new.is_manual := true;
      new.edited_by := auth.uid();
    else
      new.is_manual := false;
      new.edited_by := null;
      new.edit_reason := null;
      if new.clock_out is not null then
        raise exception 'Workers cannot create closed entries directly';
      end if;
    end if;

    return new;
  end if;

  is_manager := public.can_manage_user(old.user_id);

  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed';
  end if;

  if new.clock_out is not null and new.clock_out < new.clock_in then
    raise exception 'clock_out must be greater than or equal to clock_in';
  end if;

  changed_core_fields :=
    new.clock_in is distinct from old.clock_in
    or new.clock_out is distinct from old.clock_out
    or new.clock_in_lat is distinct from old.clock_in_lat
    or new.clock_in_lng is distinct from old.clock_in_lng
    or new.clock_in_accuracy_meters is distinct from old.clock_in_accuracy_meters
    or new.clock_out_lat is distinct from old.clock_out_lat
    or new.clock_out_lng is distinct from old.clock_out_lng
    or new.clock_out_accuracy_meters is distinct from old.clock_out_accuracy_meters
    or new.clock_in_timezone is distinct from old.clock_in_timezone
    or new.clock_out_timezone is distinct from old.clock_out_timezone
    or new.notes is distinct from old.notes;

  if is_manager and (auth.uid() <> old.user_id or coalesce(btrim(new.edit_reason), '') <> '') then
    if changed_core_fields and coalesce(btrim(new.edit_reason), '') = '' then
      raise exception 'edit_reason is required when correcting an entry';
    end if;
    new.is_manual := true;
    new.edited_by := auth.uid();
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'You cannot update another user entry';
  end if;

  if old.clock_out is not null then
    raise exception 'Closed entries cannot be modified by workers';
  end if;

  if new.clock_in is distinct from old.clock_in
     or new.user_id is distinct from old.user_id
     or new.clock_in_lat is distinct from old.clock_in_lat
     or new.clock_in_lng is distinct from old.clock_in_lng
     or new.clock_in_accuracy_meters is distinct from old.clock_in_accuracy_meters
     or new.is_manual is distinct from old.is_manual
     or new.edited_by is distinct from old.edited_by
     or new.edit_reason is distinct from old.edit_reason then
    raise exception 'Workers can only close their active entry and update notes';
  end if;

  return new;
end;
$$;

create or replace function public.guard_break_mutation()
returns trigger
language plpgsql
as $$
declare
  parent_entry public.time_entries;
  is_manager boolean;
begin
  if tg_op = 'INSERT' then
    select *
    into parent_entry
    from public.time_entries
    where id = new.entry_id;

    if not found then
      raise exception 'Parent entry not found';
    end if;

    is_manager := public.can_manage_user(parent_entry.user_id);

    if parent_entry.user_id <> auth.uid() and not is_manager then
      raise exception 'You cannot create a break for another user';
    end if;

    if parent_entry.clock_out is not null and new.ended_at is null then
      raise exception 'Cannot create an active break on a closed entry';
    end if;

    if new.started_at < parent_entry.clock_in then
      raise exception 'Break cannot start before the entry clock_in';
    end if;

    if parent_entry.clock_out is not null and new.ended_at is not null and new.ended_at > parent_entry.clock_out then
      raise exception 'Break cannot end after the entry clock_out';
    end if;

    if is_manager and (parent_entry.user_id <> auth.uid() or new.ended_at is not null or new.is_manual) then
      if coalesce(btrim(new.edit_reason), '') = '' then
        raise exception 'edit_reason is required for manual breaks';
      end if;
      new.is_manual := true;
      new.edited_by := auth.uid();
    else
      new.is_manual := false;
      new.edited_by := null;
      new.edit_reason := null;
      if new.ended_at is not null then
        raise exception 'Workers cannot create closed breaks directly';
      end if;
    end if;

    return new;
  end if;

  select te.*
  into parent_entry
  from public.time_entries te
  where te.id = old.entry_id;

  is_manager := public.can_manage_user(parent_entry.user_id);

  if new.entry_id is distinct from old.entry_id then
    raise exception 'entry_id cannot be changed';
  end if;

  if is_manager and (auth.uid() <> parent_entry.user_id or coalesce(btrim(new.edit_reason), '') <> '') then
    if (new.break_type is distinct from old.break_type
        or new.started_at is distinct from old.started_at
        or new.ended_at is distinct from old.ended_at)
       and coalesce(btrim(new.edit_reason), '') = '' then
      raise exception 'edit_reason is required when correcting a break';
    end if;
    new.is_manual := true;
    new.edited_by := auth.uid();
    return new;
  end if;

  if parent_entry.user_id <> auth.uid() then
    raise exception 'You cannot update another user break';
  end if;

  if old.ended_at is not null then
    raise exception 'Closed breaks cannot be modified by workers';
  end if;

  if new.break_type is distinct from old.break_type
     or new.started_at is distinct from old.started_at
     or new.is_manual is distinct from old.is_manual
     or new.edited_by is distinct from old.edited_by
     or new.edit_reason is distinct from old.edit_reason then
    raise exception 'Workers can only close their active break';
  end if;

  return new;
end;
$$;

create or replace function public.audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload_old jsonb;
  payload_new jsonb;
  resolved_target_id text;
begin
  if tg_op = 'DELETE' then
    payload_old := to_jsonb(old);
    payload_new := null;
    resolved_target_id := payload_old ->> 'id';
  elsif tg_op = 'UPDATE' then
    payload_old := to_jsonb(old);
    payload_new := to_jsonb(new);
    resolved_target_id := payload_new ->> 'id';
  else
    payload_old := null;
    payload_new := to_jsonb(new);
    resolved_target_id := payload_new ->> 'id';
  end if;

  insert into public.audit_log (actor_id, action, target_table, target_id, old_data, new_data)
  values (
    auth.uid(),
    tg_op || '_' || upper(tg_table_name),
    tg_table_name,
    nullif(resolved_target_id, ''),
    payload_old,
    payload_new
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- ============================================
-- PART 3: DADES INICIALS
-- ============================================

insert into public.work_calendars (name, hours_per_day, working_days, is_default)
values ('Calendari general', 7.50, array[1,2,3,4,5], true);

insert into public.system_settings (
  id,
  ordinary_day_limit_hours,
  overtime_limit_hours,
  min_break_minutes,
  geofencing_enabled,
  allowed_radius_meters,
  google_oauth_enabled,
  weekly_summary_enabled,
  inactivity_logout_hours,
  trusted_session_days
)
values (1, 9.00, 2.00, 30, false, 150, false, false, 4, 30);

-- ============================================
-- PART 4: TRIGGERS
-- ============================================

create trigger set_work_calendars_updated_at
before update on public.work_calendars
for each row
execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_teams_updated_at
before update on public.teams
for each row
execute function public.set_updated_at();

create trigger set_holidays_updated_at
before update on public.holidays
for each row
execute function public.set_updated_at();

create trigger set_system_settings_updated_at
before update on public.system_settings
for each row
execute function public.set_updated_at();

create trigger set_notification_preferences_updated_at
before update on public.user_notification_preferences
for each row
execute function public.set_updated_at();

create trigger set_time_entries_updated_at
before update on public.time_entries
for each row
execute function public.set_updated_at();

create trigger set_breaks_updated_at
before update on public.breaks
for each row
execute function public.set_updated_at();

create trigger guard_profiles_before_update
before update on public.profiles
for each row
execute function public.guard_profile_update();

create trigger guard_time_entries_before_mutation
before insert or update on public.time_entries
for each row
execute function public.guard_time_entry_mutation();

create trigger guard_breaks_before_mutation
before insert or update on public.breaks
for each row
execute function public.guard_break_mutation();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create trigger audit_profiles_changes
after insert or update or delete on public.profiles
for each row
execute function public.audit_changes();

create trigger audit_teams_changes
after insert or update or delete on public.teams
for each row
execute function public.audit_changes();

create trigger audit_team_members_changes
after insert or update or delete on public.team_members
for each row
execute function public.audit_changes();

create trigger audit_work_calendars_changes
after insert or update or delete on public.work_calendars
for each row
execute function public.audit_changes();

create trigger audit_holidays_changes
after insert or update or delete on public.holidays
for each row
execute function public.audit_changes();

create trigger audit_system_settings_changes
after insert or update or delete on public.system_settings
for each row
execute function public.audit_changes();

create trigger audit_time_entries_changes
after insert or update or delete on public.time_entries
for each row
execute function public.audit_changes();

create trigger audit_breaks_changes
after insert or update or delete on public.breaks
for each row
execute function public.audit_changes();

-- ============================================
-- PART 5: RLS POLICIES
-- ============================================

alter table public.work_calendars enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.holidays enable row level security;
alter table public.system_settings enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.time_entries enable row level security;
alter table public.breaks enable row level security;
alter table public.audit_log enable row level security;
alter table public.report_exports enable row level security;

create policy work_calendars_select_authenticated
on public.work_calendars
for select
to authenticated
using (true);

create policy work_calendars_manage_admin
on public.work_calendars
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy profiles_select_visible
on public.profiles
for select
to authenticated
using (public.can_access_user(id));

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy profiles_update_admin
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy teams_select_visible
on public.teams
for select
to authenticated
using (public.can_access_team(id));

create policy teams_manage_admin
on public.teams
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy team_members_select_visible
on public.team_members
for select
to authenticated
using (public.can_access_team(team_id));

create policy team_members_manage_admin
on public.team_members
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy holidays_select_authenticated
on public.holidays
for select
to authenticated
using (true);

create policy holidays_manage_admin
on public.holidays
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy system_settings_select_authenticated
on public.system_settings
for select
to authenticated
using (true);

create policy system_settings_manage_admin
on public.system_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy notification_preferences_select_own_or_admin
on public.user_notification_preferences
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy notification_preferences_update_own_or_admin
on public.user_notification_preferences
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy notification_preferences_insert_own_or_admin
on public.user_notification_preferences
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin());

create policy time_entries_select_visible
on public.time_entries
for select
to authenticated
using (public.can_access_user(user_id));

create policy time_entries_insert_self
on public.time_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy time_entries_insert_managed
on public.time_entries
for insert
to authenticated
with check (public.can_manage_user(user_id));

create policy time_entries_update_self_active_only
on public.time_entries
for update
to authenticated
using (auth.uid() = user_id and clock_out is null)
with check (auth.uid() = user_id);

create policy time_entries_update_managed
on public.time_entries
for update
to authenticated
using (public.can_manage_user(user_id))
with check (public.can_manage_user(user_id));

create policy time_entries_delete_admin_only
on public.time_entries
for delete
to authenticated
using (public.is_admin());

create policy breaks_select_visible
on public.breaks
for select
to authenticated
using (public.can_access_entry(entry_id));

create policy breaks_insert_self
on public.breaks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.time_entries te
    where te.id = entry_id
      and te.user_id = auth.uid()
  )
);

create policy breaks_insert_managed
on public.breaks
for insert
to authenticated
with check (public.can_manage_entry(entry_id));

create policy breaks_update_self_active_only
on public.breaks
for update
to authenticated
using (
  ended_at is null
  and exists (
    select 1
    from public.time_entries te
    where te.id = entry_id
      and te.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.time_entries te
    where te.id = entry_id
      and te.user_id = auth.uid()
  )
);

create policy breaks_update_managed
on public.breaks
for update
to authenticated
using (public.can_manage_entry(entry_id))
with check (public.can_manage_entry(entry_id));

create policy breaks_delete_admin_only
on public.breaks
for delete
to authenticated
using (public.is_admin());

create policy audit_log_select_visible
on public.audit_log
for select
to authenticated
using (public.can_access_audit_row(target_table, target_id, actor_id));

create policy report_exports_select_own_or_admin
on public.report_exports
for select
to authenticated
using (requested_by = auth.uid() or public.is_admin());

create policy report_exports_insert_own_or_managed
on public.report_exports
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and (
    public.is_admin()
    or subject_user_id is null
    or subject_user_id = auth.uid()
    or public.can_manage_user(subject_user_id)
  )
  and (
    team_id is null
    or public.is_admin()
    or public.can_manage_team(team_id)
  )
);

create policy report_exports_delete_own_or_admin
on public.report_exports
for delete
to authenticated
using (requested_by = auth.uid() or public.is_admin());

-- ============================================
-- PERMISOS
-- ============================================

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;

-- ============================================
-- CONFIGURACIÓ COMPLETADA
-- ============================================
-- La base de dades està configurada!
--
-- Següents passos:
-- 1. Crea un usuari a Authentication > Users
-- 2. El trigger crearà automàticament el perfil
-- 3. Configura les variables d'entorn al fitxer .env
-- 4. Executa: npm run dev
-- 5. Vés a http://localhost:3000
-- ============================================