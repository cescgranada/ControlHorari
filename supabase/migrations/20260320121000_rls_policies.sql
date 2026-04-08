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
