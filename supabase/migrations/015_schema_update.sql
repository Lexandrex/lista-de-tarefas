alter table public.tasks
  add column if not exists assignee_id uuid references public.profiles(id);

create index if not exists tasks_assignee_idx on public.tasks (assignee_id);

alter table public.tasks
  add column if not exists project_id uuid references public.projects(id);

create index if not exists tasks_project_idx on public.tasks (project_id);
drop policy if exists "tasks: org insert" on public.tasks;
drop policy if exists "tasks: org update" on public.tasks;

create policy "tasks: org insert"
on public.tasks for insert to authenticated
with check (
  org_id = public.auth_org_id()
  and (
    assignee_id is null
    or project_id is null
    or exists (
      select 1
      from public.projects p
      join public.team_members tm on tm.team_id = p.team_id
      where p.id = project_id
        and tm.user_id = assignee_id
        and tm.org_id = public.auth_org_id()
    )
  )
);

create policy "tasks: org update"
on public.tasks for update to authenticated
using (org_id = public.auth_org_id())
with check (
  org_id = public.auth_org_id()
  and (
    assignee_id is null
    or project_id is null
    or exists (
      select 1
      from public.projects p
      join public.team_members tm on tm.team_id = p.team_id
      where p.id = project_id
        and tm.user_id = assignee_id
        and tm.org_id = public.auth_org_id()
    )
  )
);
