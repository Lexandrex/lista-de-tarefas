alter table public.tasks
  add column if not exists team_id uuid references public.teams(id) on delete set null;

update public.tasks t
set team_id = p.team_id
from public.projects p
where t.project_id = p.id
  and t.team_id is null;

create index if not exists tasks_team_id_idx on public.tasks(team_id);

create or replace function public.tasks_sync_team_id()
returns trigger
language plpgsql
as $$
begin
  if new.project_id is not null then
    select team_id into new.team_id from public.projects where id = new.project_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tasks_sync_team_id on public.tasks;
create trigger trg_tasks_sync_team_id
before insert or update of project_id on public.tasks
for each row execute function public.tasks_sync_team_id();
drop function if exists api.task_upsert(uuid, uuid, uuid, uuid, text, text, text, date, uuid);
drop view if exists api.tasks;

create view api.tasks as
  select
    id, org_id, project_id, parent_id, title, description, status, priority,
    assignee_id, reporter_id, due_date, order_index, done, created_at, updated_at,
    team_id
  from public.tasks;

grant select on api.tasks to anon, authenticated;

create or replace function api.task_upsert(
  _org_id uuid,
  _project_id uuid,
  _title text,
  _id uuid default null,
  _description text default null,
  _status text default 'todo',
  _due_date date default null,
  _assignee_id uuid default null,
  _team_id uuid default null
) returns api.tasks
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  _row api.tasks;
begin
  if _id is null then
    insert into public.tasks(
      org_id, project_id, title, description, status, due_date, assignee_id, team_id
    )
    values (
      _org_id, _project_id, _title, _description, _status, _due_date, _assignee_id, _team_id
    )
    returning id, org_id, project_id, parent_id, title, description, status, priority,
              assignee_id, reporter_id, due_date, order_index, done, created_at, updated_at, team_id
      into _row;
  else
    update public.tasks
       set project_id  = _project_id,
           title       = _title,
           description = _description,
           status      = _status,
           due_date    = _due_date,
           assignee_id = _assignee_id,
           team_id     = _team_id,
           updated_at  = now()
     where id = _id and org_id = _org_id
     returning id, org_id, project_id, parent_id, title, description, status, priority,
               assignee_id, reporter_id, due_date, order_index, done, created_at, updated_at, team_id
       into _row;
  end if;

  return _row;
end;
$$;

grant execute on function api.task_upsert(
  uuid, uuid, text, uuid, text, text, date, uuid, uuid
) to anon, authenticated;
