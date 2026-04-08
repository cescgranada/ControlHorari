-- ============================================
-- MIGRACIÓ: Horaris setmanals i recordatoris
-- ============================================

-- Eliminar taula antiga si existeix amb schema incorrecte
drop trigger if exists set_weekly_schedules_updated_at on public.weekly_schedules;
drop trigger if exists audit_weekly_schedules_changes on public.weekly_schedules;
drop policy if exists weekly_schedules_select_own_or_admin on public.weekly_schedules;
drop policy if exists weekly_schedules_insert_own_or_admin on public.weekly_schedules;
drop policy if exists weekly_schedules_update_own_or_admin on public.weekly_schedules;
drop policy if exists weekly_schedules_delete_own_or_admin on public.weekly_schedules;
drop table if exists public.weekly_schedules;

-- Nova taula per horaris setmanals
create table public.weekly_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  morning_in text not null default '08:00',
  morning_out text not null default '13:00',
  afternoon_in text,
  afternoon_out text,
  has_afternoon boolean not null default false,
  reminder_minutes_before integer not null default 15,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_of_week),
  constraint weekly_schedules_day_range check (day_of_week >= 0 and day_of_week <= 6),
  constraint weekly_schedules_reminder_positive check (reminder_minutes_before > 0)
);

create index weekly_schedules_user_idx on public.weekly_schedules (user_id);

-- Afegir columna per activar/desactivar recordatoris
alter table public.profiles
add column if not exists reminders_enabled boolean not null default false;

-- RLS per weekly_schedules
alter table public.weekly_schedules enable row level security;

create policy weekly_schedules_select_own_or_admin
on public.weekly_schedules
for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

create policy weekly_schedules_insert_own_or_admin
on public.weekly_schedules
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin());

create policy weekly_schedules_update_own_or_admin
on public.weekly_schedules
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy weekly_schedules_delete_own_or_admin
on public.weekly_schedules
for delete
to authenticated
using (auth.uid() = user_id or public.is_admin());

-- Trigger per updated_at
create trigger set_weekly_schedules_updated_at
before update on public.weekly_schedules
for each row
execute function public.set_updated_at();

-- Trigger d'auditoria
create trigger audit_weekly_schedules_changes
after insert or update or delete on public.weekly_schedules
for each row
execute function public.audit_changes();

-- Grants
grant select, insert, update, delete on public.weekly_schedules to authenticated;
grant all on public.weekly_schedules to service_role;
