create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$begin
  if not exists (select 1 from pg_trigger where tgname='_orgs_updated') then
    create trigger _orgs_updated
    before update on public.organizations
    for each row execute function public.trg_set_updated_at();
  end if;
end$$;

create table if not exists public.profiles (
  id          uuid primary key,
  org_id      uuid references public.organizations(id),
  email       text unique,
  full_name   text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists profiles_org_idx on public.profiles(org_id);
do $$begin
  if not exists (select 1 from pg_trigger where tgname='_profiles_updated') then
    create trigger _profiles_updated
    before update on public.profiles
    for each row execute function public.trg_set_updated_at();
  end if;
end$$;

-- Auto-create profile when new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email) on conflict do nothing;
  return new;
end $$;
do $$begin
  if not exists (select 1 from pg_trigger where tgname='on_auth_user_created') then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end$$;

-- Teams
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.auth_org_id(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists teams_org_idx on public.teams(org_id);
do $$begin
  if not exists (select 1 from pg_trigger where tgname='_teams_updated') then
    create trigger _teams_updated
    before update on public.teams
    for each row execute function public.trg_set_updated_at();
  end if;
end$$;

create unique index if not exists teams_org_name_uniq
  on public.teams (org_id, lower(name));

create table if not exists public.team_members (
  team_id    uuid not null references public.teams(id)    on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  org_id     uuid not null default public.auth_org_id(),
  role       text,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index if not exists team_members_org_idx on public.team_members(org_id);
create index if not exists team_members_user_idx on public.team_members(user_id);

-- Projects
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.auth_org_id(),
  team_id     uuid references public.teams(id) on delete set null,
  name        text not null,
  key         text,
  description text,
  status      public.project_status not null default 'active',
  start_date  date,
  due_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_org_idx on public.projects(org_id);
create index if not exists projects_team_idx on public.projects(team_id);
do $$begin
  if not exists (select 1 from pg_trigger where tgname='_projects_updated') then
    create trigger _projects_updated
    before update on public.projects
    for each row execute function public.trg_set_updated_at();
  end if;
end$$;

create unique index if not exists projects_org_name_uniq
  on public.projects (org_id, lower(name));

-- Tasks
create table if not exists public.tasks (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null default public.auth_org_id(),
  project_id    uuid references public.projects(id) on delete set null,
  parent_id     uuid references public.tasks(id)    on delete cascade,
  title         text not null,
  description   text,
  status        public.task_status not null default 'todo',
  priority      public.task_priority not null default 'medium',
  assignee_id   uuid references public.profiles(id),
  reporter_id   uuid references public.profiles(id),
  due_date      date,
  order_index   numeric,
  done          boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists tasks_org_idx      on public.tasks(org_id);
create index if not exists tasks_project_idx  on public.tasks(project_id);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);
create index if not exists tasks_parent_idx   on public.tasks(parent_id);
do $$begin
  if not exists (select 1 from pg_trigger where tgname='_tasks_updated') then
    create trigger _tasks_updated
    before update on public.tasks
    for each row execute function public.trg_set_updated_at();
  end if;
end$$;

create or replace function public.auth_org_id() returns uuid
language sql stable as $$
  select org_id from public.profiles where id = public.auth_uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.profiles p
    where p.id = public.auth_uid() and p.is_admin = true
  )
$$;