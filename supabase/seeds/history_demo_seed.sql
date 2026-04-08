begin;

create temporary table tmp_seed_days (
  seed_key text primary key,
  day_date date not null,
  clock_in time not null,
  clock_out time not null,
  notes text not null
) on commit drop;

create temporary table tmp_seed_breaks (
  seed_key text not null,
  break_type public.break_type not null,
  started_at time not null,
  ended_at time not null
) on commit drop;

create temporary table tmp_seed_entry_map (
  profile_id uuid not null,
  seed_key text not null,
  entry_id uuid not null,
  primary key (profile_id, seed_key)
) on commit drop;

insert into tmp_seed_days (seed_key, day_date, clock_in, clock_out, notes)
values
  ('d01', date '2026-03-09', time '08:02', time '15:36', 'seed:history-demo:d01'),
  ('d02', date '2026-03-10', time '08:00', time '16:05', 'seed:history-demo:d02'),
  ('d03', date '2026-03-11', time '08:14', time '15:49', 'seed:history-demo:d03'),
  ('d04', date '2026-03-12', time '08:07', time '17:02', 'seed:history-demo:d04'),
  ('d05', date '2026-03-13', time '07:56', time '14:41', 'seed:history-demo:d05'),
  ('d06', date '2026-03-16', time '08:05', time '15:33', 'seed:history-demo:d06'),
  ('d07', date '2026-03-17', time '07:59', time '16:12', 'seed:history-demo:d07'),
  ('d08', date '2026-03-18', time '08:11', time '15:47', 'seed:history-demo:d08'),
  ('d09', date '2026-03-19', time '08:03', time '17:00', 'seed:history-demo:d09'),
  ('d10', date '2026-03-20', time '08:08', time '14:52', 'seed:history-demo:d10');

insert into tmp_seed_breaks (seed_key, break_type, started_at, ended_at)
values
  ('d02', 'lunch', time '11:05', time '11:35'),
  ('d03', 'breakfast', time '10:40', time '10:55'),
  ('d04', 'lunch', time '11:52', time '12:36'),
  ('d04', 'personal', time '14:45', time '14:55'),
  ('d06', 'breakfast', time '10:45', time '11:00'),
  ('d07', 'lunch', time '12:02', time '12:34'),
  ('d08', 'personal', time '12:35', time '12:45'),
  ('d09', 'lunch', time '11:50', time '12:30'),
  ('d09', 'meeting', time '13:10', time '13:25');

do $$
declare
  profile_row record;
  day_row record;
  break_row record;
  new_entry_id uuid;
begin
  if not exists (select 1 from public.profiles where is_active) then
    raise exception 'No hi ha perfils actius a public.profiles. Crea primer un usuari i el seu perfil.';
  end if;

  alter table public.breaks disable trigger user;
  alter table public.time_entries disable trigger user;

  delete from public.breaks
  where entry_id in (
    select id
    from public.time_entries
    where notes like 'seed:history-demo:%'
  );

  delete from public.time_entries
  where notes like 'seed:history-demo:%';

  for profile_row in
    select id
    from public.profiles
    where is_active
    order by created_at asc
  loop
    for day_row in
      select seed_key, day_date, clock_in, clock_out, notes
      from tmp_seed_days
      order by day_date asc
    loop
      insert into public.time_entries (
        id,
        user_id,
        clock_in,
        clock_out,
        clock_in_timezone,
        clock_out_timezone,
        notes,
        source,
        is_manual
      )
      values (
        gen_random_uuid(),
        profile_row.id,
        (day_row.day_date + day_row.clock_in) at time zone 'Europe/Madrid',
        (day_row.day_date + day_row.clock_out) at time zone 'Europe/Madrid',
        'Europe/Madrid',
        'Europe/Madrid',
        day_row.notes,
        'import',
        false
      )
      returning id into new_entry_id;

      insert into tmp_seed_entry_map (profile_id, seed_key, entry_id)
      values (profile_row.id, day_row.seed_key, new_entry_id);
    end loop;
  end loop;

  for break_row in
    select m.entry_id, b.break_type, d.day_date, b.started_at, b.ended_at
    from tmp_seed_entry_map m
    join tmp_seed_breaks b on b.seed_key = m.seed_key
    join tmp_seed_days d on d.seed_key = m.seed_key
    order by d.day_date asc, b.started_at asc
  loop
    insert into public.breaks (
      id,
      entry_id,
      break_type,
      started_at,
      ended_at,
      is_manual
    )
    values (
      gen_random_uuid(),
      break_row.entry_id,
      break_row.break_type,
      (break_row.day_date + break_row.started_at) at time zone 'Europe/Madrid',
      (break_row.day_date + break_row.ended_at) at time zone 'Europe/Madrid',
      false
    );
  end loop;

  alter table public.time_entries enable trigger user;
  alter table public.breaks enable trigger user;
end
$$;

commit;
