-- ============================================
-- MIGRACIÓ: Assegurar RLS a totes les taules
-- ============================================

alter table public.work_calendars enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.holidays enable row level security;
alter table public.system_settings enable row level security;
alter table public.user_notification_preferences enable row level security;
alter table public.weekly_schedules enable row level security;
alter table public.time_entries enable row level security;
alter table public.breaks enable row level security;
alter table public.audit_log enable row level security;
alter table public.report_exports enable row level security;
