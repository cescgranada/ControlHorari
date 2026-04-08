begin;

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

alter table public.time_entries enable trigger user;
alter table public.breaks enable trigger user;

commit;
