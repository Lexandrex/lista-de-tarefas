alter table public.tasks
  add column if not exists status text
    check (status in ('todo','in_progress','blocked','done'))
    default 'todo' not null,
  add column if not exists priority text
    check (priority in ('low','medium','high','urgent'))
    default 'medium' not null,
  add column if not exists start_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.projects
  add column if not exists status text
    check (status in ('planned','active','paused','done'))
    default 'planned' not null;

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
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='org_id')
  then
    execute 'create index if not exists idx_tasks_org_only on public.tasks(org_id)';
  end if;
end$$;

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
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='org_id')
  then
    execute 'create index if not exists idx_projects_org_only on public.projects(org_id)';
  end if;
end$$;
