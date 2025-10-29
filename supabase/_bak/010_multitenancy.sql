
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table if exists public.profiles          add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.teams             add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.team_members      add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.projects          add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.tasks             add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.events            add column if not exists org_id uuid references public.organizations(id);
alter table if exists public.event_attendees   add column if not exists org_id uuid references public.organizations(id);

do $$
declare v_org uuid;
begin
  select id into v_org from public.organizations where name = 'Default Org';
  if v_org is null then
    insert into public.organizations(name) values ('Default Org') returning id into v_org;
  end if;
  update public.profiles        set org_id = coalesce(org_id, v_org);
  update public.teams           set org_id = coalesce(org_id, v_org);
  update public.projects        set org_id = coalesce(org_id, v_org);
  update public.tasks           set org_id = coalesce(org_id, v_org);
  update public.events          set org_id = coalesce(org_id, v_org);
  update public.team_members    tm
     set org_id = coalesce(tm.org_id, t.org_id, v_org)
    from public.teams t
   where tm.team_id = t.id;

  update public.event_attendees ea
     set org_id = coalesce(ea.org_id, e.org_id, v_org)
    from public.events e
   where ea.event_id = e.id;
end$$;

alter table if exists public.profiles        alter column org_id set not null;
alter table if exists public.teams           alter column org_id set not null;
alter table if exists public.team_members    alter column org_id set not null;
alter table if exists public.projects        alter column org_id set not null;
alter table if exists public.tasks           alter column org_id set not null;
alter table if exists public.events          alter column org_id set not null;
alter table if exists public.event_attendees alter column org_id set not null;

create index if not exists idx_profiles_org_id         on public.profiles(org_id);
create index if not exists idx_teams_org_id            on public.teams(org_id);
create index if not exists idx_team_members_org_id     on public.team_members(org_id);
create index if not exists idx_projects_org_id         on public.projects(org_id);
create index if not exists idx_tasks_org_status_due    on public.tasks(org_id, status, due_at);
create index if not exists idx_events_org_start        on public.events(org_id, starts_at);
create index if not exists idx_event_attendees_org_id  on public.event_attendees(org_id);

create or replace function public.auth_org_id() returns uuid
language sql stable as $$
  select org_id from public.profiles where id = auth.uid()
$$;

create or replace function public.set_org_id_from_auth()
returns trigger language plpgsql as $$
begin
  if new.org_id is null then
    new.org_id := public.auth_org_id();
  end if;
  return new;
end$$;

create or replace function public.set_org_id_from_team()
returns trigger language plpgsql as $$
declare v_org uuid;
begin
  select org_id into v_org from public.teams where id = new.team_id;
  new.org_id := coalesce(new.org_id, v_org, public.auth_org_id());
  return new;
end$$;

create or replace function public.set_org_id_from_event()
returns trigger language plpgsql as $$
declare v_org uuid;
begin
  select org_id into v_org from public.events where id = new.event_id;
  new.org_id := coalesce(new.org_id, v_org, public.auth_org_id());
  return new;
end$$;

drop trigger if exists trg_set_org_profiles  on public.profiles;
drop trigger if exists trg_set_org_teams     on public.teams;
drop trigger if exists trg_set_org_projects  on public.projects;
drop trigger if exists trg_set_org_tasks     on public.tasks;
drop trigger if exists trg_set_org_events    on public.events;
drop trigger if exists trg_set_org_tm        on public.team_members;
drop trigger if exists trg_set_org_ea        on public.event_attendees;

create trigger trg_set_org_profiles  before insert on public.profiles        for each row execute function public.set_org_id_from_auth();
create trigger trg_set_org_teams     before insert on public.teams           for each row execute function public.set_org_id_from_auth();
create trigger trg_set_org_projects  before insert on public.projects        for each row execute function public.set_org_id_from_auth();
create trigger trg_set_org_tasks     before insert on public.tasks           for each row execute function public.set_org_id_from_auth();
create trigger trg_set_org_events    before insert on public.events          for each row execute function public.set_org_id_from_auth();
create trigger trg_set_org_tm        before insert on public.team_members    for each row execute function public.set_org_id_from_team();
create trigger trg_set_org_ea        before insert on public.event_attendees for each row execute function public.set_org_id_from_event();

alter table public.organizations   enable row level security;
alter table public.profiles        enable row level security;
alter table public.teams           enable row level security;
alter table public.team_members    enable row level security;
alter table public.projects        enable row level security;
alter table public.tasks           enable row level security;
alter table public.events          enable row level security;
alter table public.event_attendees enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
for select using (id = auth.uid());

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'public.organizations',
      'public.profiles',
      'public.teams',
      'public.team_members',
      'public.projects',
      'public.tasks',
      'public.events',
      'public.event_attendees'
    ])
  loop
    execute format('drop policy if exists %I on %s', 'org_select', t);
    execute format('drop policy if exists %I on %s', 'org_insert', t);
    execute format('drop policy if exists %I on %s', 'org_update', t);
    execute format('drop policy if exists %I on %s', 'org_delete', t);

    execute format('create policy org_select on %s for select using (org_id = public.auth_org_id())', t);
    execute format('create policy org_insert on %s for insert with check (org_id = public.auth_org_id())', t);
    execute format('create policy org_update on %s for update using (org_id = public.auth_org_id()) with check (org_id = public.auth_org_id())', t);
    execute format('create policy org_delete on %s for delete using (org_id = public.auth_org_id())', t);
  end loop;
end$$;

do $$
begin
  if exists (select 1 from public.profiles) and
     not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles
       set role = 'admin'
     where id = (select id from public.profiles order by created_at nulls first limit 1);
  end if;
end$$;
