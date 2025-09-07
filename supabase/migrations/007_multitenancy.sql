create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text check (role in ('admin','manager','member')) default 'member',
  org_id uuid references public.organizations(id),
  created_at timestamptz default now()
);

insert into public.profiles (id, email, created_at)
select u.id, u.email, now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

do $$
declare v_org uuid;
begin
  select id into v_org from public.organizations order by created_at limit 1;
  if v_org is null then
    insert into public.organizations(name) values ('Default Org') returning id into v_org;
  end if;
  update public.profiles set org_id = coalesce(org_id, v_org);
end $$;

alter table public.profiles alter column org_id set not null;
create index if not exists idx_profiles_org_id on public.profiles(org_id);

create or replace function public.auth_org_id() returns uuid
language sql stable as $$
  select org_id from public.profiles where id = auth.uid()
$$;

alter table if exists public.teams             add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.team_members      add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.projects          add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.tasks             add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.events            add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.event_attendees   add column if not exists org_id uuid references public.organizations(id);

alter table if exists public.tasks
  add column if not exists status text
    check (status in ('todo','in_progress','blocked','done'))
    default 'todo' not null,
  add column if not exists priority text
    check (priority in ('low','medium','high','urgent'))
    default 'medium' not null,
  add column if not exists start_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table if exists public.projects
  add column if not exists status text
    check (status in ('planned','active','paused','done'))
    default 'planned' not null;

do $$
declare v_org uuid;
begin
  select id into v_org from public.organizations order by created_at limit 1;

  update public.teams           set org_id = coalesce(org_id, v_org);
  update public.projects        set org_id = coalesce(org_id, v_org);
  update public.tasks           set org_id = coalesce(org_id, v_org);
  update public.events          set org_id = coalesce(org_id, v_org);

  update public.team_members tm
     set org_id = coalesce(tm.org_id, t.org_id, v_org)
    from public.teams t
   where tm.team_id = t.id;

  update public.event_attendees ea
     set org_id = coalesce(ea.org_id, e.org_id, v_org)
    from public.events e
   where ea.event_id = e.id;
end $$;

do $$
begin
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

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='events' and column_name='org_id')
     and not exists (select 1 from public.events where org_id is null)
  then execute 'alter table public.events alter column org_id set not null'; end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='event_attendees' and column_name='org_id')
     and not exists (select 1 from public.event_attendees where org_id is null)
  then execute 'alter table public.event_attendees alter column org_id set not null'; end if;
end $$;

do $$
begin
  if to_regclass('public.idx_tasks_org_status_due') is not null then
    execute 'drop index if exists public.idx_tasks_org_status_due';
  end if;
  if to_regclass('public.idx_tasks_org_only') is not null then
    execute 'drop index if exists public.idx_tasks_org_only';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='org_id')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='status')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='due_at')
  then
    execute 'create index if not exists idx_tasks_org_status_due on public.tasks(org_id, status, due_at)';
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='org_id') then
    execute 'create index if not exists idx_tasks_org_only on public.tasks(org_id)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.idx_projects_org_status') is not null then
    execute 'drop index if exists public.idx_projects_org_status';
  end if;
  if to_regclass('public.idx_projects_org_only') is not null then
    execute 'drop index if exists public.idx_projects_org_only';
  end if;

  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='org_id')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='status')
  then
    execute 'create index if not exists idx_projects_org_status on public.projects(org_id, status)';
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='org_id') then
    execute 'create index if not exists idx_projects_org_only on public.projects(org_id)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.idx_events_org_start') is null
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='events' and column_name='org_id')
     and exists (select 1 from information_schema.columns where table_schema='public' and table_name='events' and column_name='starts_at')
  then
    execute 'create index if not exists idx_events_org_start on public.events(org_id, starts_at)';
  end if;
end $$;

create or replace function public.set_org_id_from_auth()
returns trigger language plpgsql as $$
begin
  if new.org_id is null then
    new.org_id := public.auth_org_id();
  end if;
  return new;
end $$;

create or replace function public.set_org_id_from_team()
returns trigger language plpgsql as $$
declare v_org uuid;
begin
  select org_id into v_org from public.teams where id = new.team_id;
  new.org_id := coalesce(new.org_id, v_org, public.auth_org_id());
  return new;
end $$;

create or replace function public.set_org_id_from_event()
returns trigger language plpgsql as $$
declare v_org uuid;
begin
  select org_id into v_org from public.events where id = new.event_id;
  new.org_id := coalesce(new.org_id, v_org, public.auth_org_id());
  return new;
end $$;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists trg_set_org_profiles on public.profiles';
    execute 'create trigger trg_set_org_profiles before insert on public.profiles for each row execute function public.set_org_id_from_auth()';
  end if;
  if to_regclass('public.teams') is not null then
    execute 'drop trigger if exists trg_set_org_teams on public.teams';
    execute 'create trigger trg_set_org_teams before insert on public.teams for each row execute function public.set_org_id_from_auth()';
  end if;
  if to_regclass('public.projects') is not null then
    execute 'drop trigger if exists trg_set_org_projects on public.projects';
    execute 'create trigger trg_set_org_projects before insert on public.projects for each row execute function public.set_org_id_from_auth()';
  end if;
  if to_regclass('public.tasks') is not null then
    execute 'drop trigger if exists trg_set_org_tasks on public.tasks';
    execute 'create trigger trg_set_org_tasks before insert on public.tasks for each row execute function public.set_org_id_from_auth()';
  end if;
  if to_regclass('public.events') is not null then
    execute 'drop trigger if exists trg_set_org_events on public.events';
    execute 'create trigger trg_set_org_events before insert on public.events for each row execute function public.set_org_id_from_auth()';
  end if;
  if to_regclass('public.team_members') is not null then
    execute 'drop trigger if exists trg_set_org_tm on public.team_members';
    execute 'create trigger trg_set_org_tm before insert on public.team_members for each row execute function public.set_org_id_from_team()';
  end if;
  if to_regclass('public.event_attendees') is not null then
    execute 'drop trigger if exists trg_set_org_ea on public.event_attendees';
    execute 'create trigger trg_set_org_ea before insert on public.event_attendees for each row execute function public.set_org_id_from_event()';
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'public.organizations',
    'public.profiles',
    'public.teams',
    'public.team_members',
    'public.projects',
    'public.tasks',
    'public.events',
    'public.event_attendees'
  ]
  loop
    execute format('alter table %s enable row level security', t);
    execute format('drop policy if exists org_select on %s', t);
    execute format('drop policy if exists org_insert on %s', t);
    execute format('drop policy if exists org_update on %s', t);
    execute format('drop policy if exists org_delete on %s', t);
    execute format('create policy org_select on %s for select using (org_id = public.auth_org_id())', t);
    execute format('create policy org_insert on %s for insert with check (org_id = public.auth_org_id())', t);
    execute format('create policy org_update on %s for update using (org_id = public.auth_org_id()) with check (org_id = public.auth_org_id())', t);
    execute format('create policy org_delete on %s for delete using (org_id = public.auth_org_id())', t);
  end loop;
end $$;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid());

do $$
begin
  if exists (select 1 from public.profiles) and
     not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles
       set role = 'admin'
     where id = (select id from public.profiles order by created_at nulls first limit 1);
  end if;
end $$;
