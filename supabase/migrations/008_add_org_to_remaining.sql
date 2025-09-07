create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

do $$
declare v_org uuid;
begin
  select id into v_org from public.organizations where name = 'Default Org' limit 1;
  if v_org is null then
    insert into public.organizations(name) values ('Default Org') returning id into v_org;
  end if;

  alter table if exists public.teams            add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.team_members     add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.projects         add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.tasks            add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.calendars        add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.events           add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.event_attendees  add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.event_tasks      add column if not exists org_id uuid references public.organizations(id);
  alter table if exists public.task_assignees   add column if not exists org_id uuid references public.organizations(id);

update public.teams t
set org_id = coalesce(t.org_id, v_org)
where t.org_id is null;

update public.projects p
set org_id = coalesce(p.org_id, t.org_id, v_org)
from public.teams t
where t.id = p.team_id
  and p.org_id is null;

update public.tasks tk
set org_id = coalesce(tk.org_id, p.org_id, v_org)
from public.projects p
where p.id = tk.project_id
  and tk.org_id is null;

update public.calendars c
set org_id = coalesce(c.org_id, t.org_id, v_org)
from public.teams t
where t.id = c.team_id
  and c.org_id is null;

update public.events e
set org_id = coalesce(e.org_id, c.org_id, v_org)
from public.calendars c
where c.id = e.calendar_id
  and e.org_id is null;

update public.event_attendees ea
set org_id = coalesce(ea.org_id, e.org_id, v_org)
from public.events e
where e.id = ea.event_id
  and ea.org_id is null;

update public.event_tasks et
set org_id = coalesce(et.org_id, e.org_id, tk.org_id, v_org)
from public.events e, public.tasks tk
where e.id = et.event_id
  and tk.id = et.task_id
  and et.org_id is null;

update public.team_members tm
set org_id = coalesce(tm.org_id, t.org_id, v_org)
from public.teams t
where t.id = tm.team_id
  and tm.org_id is null;

update public.task_assignees ta
set org_id = coalesce(ta.org_id, tk.org_id, v_org)
from public.tasks tk
where tk.id = ta.task_id
  and ta.org_id is null;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='teams' and column_name='org_id')
     and not exists (select 1 from public.teams where org_id is null)
  then execute 'alter table public.teams alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='team_members' and column_name='org_id')
     and not exists (select 1 from public.team_members where org_id is null)
  then execute 'alter table public.team_members alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='org_id')
     and not exists (select 1 from public.projects where org_id is null)
  then execute 'alter table public.projects alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='org_id')
     and not exists (select 1 from public.tasks where org_id is null)
  then execute 'alter table public.tasks alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='calendars' and column_name='org_id')
     and not exists (select 1 from public.calendars where org_id is null)
  then execute 'alter table public.calendars alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='events' and column_name='org_id')
     and not exists (select 1 from public.events where org_id is null)
  then execute 'alter table public.events alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='event_attendees' and column_name='org_id')
     and not exists (select 1 from public.event_attendees where org_id is null)
  then execute 'alter table public.event_attendees alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='event_tasks' and column_name='org_id')
     and not exists (select 1 from public.event_tasks where org_id is null)
  then execute 'alter table public.event_tasks alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='task_assignees' and column_name='org_id')
     and not exists (select 1 from public.task_assignees where org_id is null)
  then execute 'alter table public.task_assignees alter column org_id set not null'; end if;

end $$;
