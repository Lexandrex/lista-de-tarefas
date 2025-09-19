create index if not exists tasks_org_idx    on public.tasks    (org_id);
create index if not exists projects_org_idx on public.projects (org_id);
create index if not exists teams_org_idx    on public.teams    (org_id);
create index if not exists tasks_project_idx on public.tasks (project_id);
create unique index if not exists projects_org_name_uniq
  on public.projects (org_id, lower(name));
