create or replace function api.task_upsert(
  _org_id       uuid,
  _project_id   uuid,
  _id           uuid default null,
  _title        text default null,
  _description  text default null,
  _status       public.task_status default 'todo'::public.task_status,
  _assignee_id  uuid default null,
  _due_date     date default null,
  _team_id      uuid default null
) returns api.tasks
language plpgsql
security definer
as $$
declare
  v_id  uuid;
  v_row api.tasks%rowtype;
begin
  if _id is null then
    insert into public.tasks (
      org_id, project_id, team_id, title, description, status, assignee_id, due_date
    ) values (
      _org_id,
      _project_id,
      _team_id,
      coalesce(_title, ''),
      nullif(_description, ''),
      _status,
      _assignee_id,
      _due_date
    )
    returning id into v_id;
  else
    update public.tasks t
       set title       = coalesce(_title, t.title),
           description = coalesce(nullif(_description, ''), t.description),
           status      = coalesce(_status, t.status),
           assignee_id = coalesce(_assignee_id, t.assignee_id),
           due_date    = coalesce(_due_date, t.due_date),
           team_id     = coalesce(_team_id, t.team_id),
           updated_at  = now()
     where t.id = _id
       and t.org_id = _org_id
    returning id into v_id;
  end if;

  select * into v_row from api.tasks where id = v_id;
  return v_row;
end $$;

grant execute on function api.task_upsert(
  uuid, uuid, uuid, text, text, public.task_status, uuid, date, uuid
) to anon, authenticated;
