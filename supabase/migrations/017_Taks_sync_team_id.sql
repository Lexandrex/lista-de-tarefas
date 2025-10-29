update public.tasks t
set team_id = p.team_id
from public.projects p
where t.project_id = p.id
  and t.team_id is null;

alter table public.projects
  add constraint projects_id_team_key unique (id, team_id);

alter table public.tasks
  add constraint tasks_team_required_when_project
  check (project_id is null or team_id is not null) not valid;

alter table public.tasks
  add constraint tasks_project_team_fk
  foreign key (project_id, team_id)
  references public.projects (id, team_id)
  on update cascade
  on delete set null;

alter table public.tasks
  validate constraint tasks_team_required_when_project;
