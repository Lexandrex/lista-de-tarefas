create or replace function api.project_upsert(
  _org_id uuid,
  _name text,
  _id uuid default null,
  _team_id uuid default null,
  _description text default null
) returns api.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  _row api.projects;
begin
-- guard
  if _org_id is distinct from public.auth_org_id() then
    raise exception 'Forbidden: org mismatch';
  end if;

  if _id is null then
    insert into public.projects (org_id, team_id, name, description)
      values (_org_id, _team_id, _name, _description)
      returning id, org_id, team_id, name, description, status, start_date, due_date, created_at, updated_at
      into _row;
  else
    update public.projects
       set team_id     = _team_id,
           name        = _name,
           description = _description,
           updated_at  = now()
     where id = _id
       and org_id = _org_id
    returning id, org_id, team_id, name, description, status, start_date, due_date, created_at, updated_at
      into _row;
  end if;

  return _row;
end;
$$;

grant execute on function api.project_upsert(uuid, text, uuid, uuid, text) to anon, authenticated;
