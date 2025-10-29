-- PROJECT UPSERT
create or replace function api.project_upsert(
  _id uuid,
  _org_id uuid,
  _team_id uuid,
  _name text,
  _description text
) returns api.projects
language plpgsql security definer as $$
declare _row api.projects;
begin
  if _id is null then
    insert into public.projects(org_id, team_id, name, description)
      values (_org_id, _team_id, _name, _description)
      returning id, org_id, team_id, name, description, status, start_date, due_date, created_at, updated_at into _row;
  else
    update public.projects
       set team_id = _team_id, name = _name, description = _description, updated_at = now()
     where id = _id
    returning id, org_id, team_id, name, description, status, start_date, due_date, created_at, updated_at into _row;
  end if;
  return _row;
end$$;
grant execute on function api.project_upsert(uuid,uuid,uuid,text,text) to anon, authenticated;

-- PROJECT DELETE
create or replace function api.project_delete(_id uuid) returns void
language sql security definer as $$
  delete from public.projects where id = _id;
$$;
grant execute on function api.project_delete(uuid) to anon, authenticated;

-- TASK UPSERT
create or replace function api.task_upsert(
  _id uuid,
  _org_id uuid,
  _project_id uuid,
  _team_id uuid,
  _title text,
  _description text,
  _status text,
  _due_date date,
  _assignee_id uuid
) returns api.tasks
language plpgsql security definer as $$
declare _row api.tasks;
begin
  if _id is null then
    insert into public.tasks(org_id, project_id, team_id, title, description, status, due_date, assignee_id)
      values (_org_id, _project_id, _team_id, _title, _description, _status, _due_date, _assignee_id)
      returning id, org_id, project_id, parent_id, title, description, status, priority, assignee_id, reporter_id, due_date, order_index, done, created_at, updated_at into _row;
  else
    update public.tasks
       set project_id = _project_id,
           team_id    = _team_id,
           title      = _title,
           description= _description,
           status     = _status,
           due_date   = _due_date,
           assignee_id= _assignee_id,
           updated_at = now()
     where id = _id
    returning id, org_id, project_id, parent_id, title, description, status, priority, assignee_id, reporter_id, due_date, order_index, done, created_at, updated_at into _row;
  end if;
  return _row;
end$$;
grant execute on function api.task_upsert(uuid,uuid,uuid,uuid,text,text,text,date,uuid) to anon, authenticated;

-- TASK DELETE
create or replace function api.task_delete(_id uuid) returns void
language sql security definer as $$
  delete from public.tasks where id = _id;
$$;
grant execute on function api.task_delete(uuid) to anon, authenticated;
