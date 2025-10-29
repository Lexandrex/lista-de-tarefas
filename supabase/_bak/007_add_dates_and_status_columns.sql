alter table public.projects
  add column if not exists status text
    check (status in ('planned','active','paused','done'))
    default 'planned' not null;

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

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tasks' and column_name='status'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tasks' and column_name='due_at'
  ) then
    execute 'create index if not exists idx_tasks_org_status_due on public.tasks(org_id, status, due_at)';
  else
    execute 'create index if not exists idx_tasks_org_only on public.tasks(org_id)';
  end if;
end$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='projects' and column_name='status'
  ) then
    execute 'create index if not exists idx_projects_org_status on public.projects(org_id, status)';
  else
    execute 'create index if not exists idx_projects_org_only on public.projects(org_id)';
  end if;
end$$;
