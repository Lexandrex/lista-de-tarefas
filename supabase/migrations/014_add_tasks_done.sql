alter table public.tasks
  add column if not exists done boolean not null default false;

alter table public.tasks
  add column if not exists project_id uuid references public.projects(id);

alter table public.tasks
  alter column org_id set default public.auth_org_id();

create index if not exists tasks_org_idx     on public.tasks (org_id);
create index if not exists tasks_project_idx on public.tasks (project_id);