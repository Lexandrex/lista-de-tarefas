-- Team upsert/delete
create or replace function api.team_upsert(
  _org_id uuid,
  _name text,
  _id uuid default null,
  _description text default null
) returns api.teams
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare _row api.teams;
begin
  if _id is null then
    insert into public.teams(org_id, name, description)
      values (_org_id, _name, _description)
      returning id, org_id, name, description, created_at, updated_at into _row;
  else
    update public.teams
       set name = _name,
           description = _description,
           updated_at = now()
     where id = _id and org_id = _org_id
     returning id, org_id, name, description, created_at, updated_at into _row;
  end if;
  return _row;
end;
$$;

grant execute on function api.team_upsert(uuid, text, uuid, text) to anon, authenticated;

create or replace function api.team_delete(_id uuid) returns void
language sql security definer set search_path = public, pg_temp as $$
  delete from public.teams where id = _id;
$$;
grant execute on function api.team_delete(uuid) to anon, authenticated;

drop view if exists api.team_member_users;
create view api.team_member_users as
select
  tm.team_id,
  tm.user_id,
  tm.org_id,
  tm.role,
  tm.created_at,
  p.full_name as name,
  p.email
from public.team_members tm
join public.profiles p on p.id = tm.user_id;

grant select on api.team_member_users to anon, authenticated;


-- CRUD RPC
create or replace function api.team_add_member(
  _org_id uuid, _team_id uuid, _user_id uuid, _role text default 'member'
) returns api.team_members
language sql security definer set search_path = public, pg_temp as $$
  insert into public.team_members(org_id, team_id, user_id, role)
  values (_org_id, _team_id, _user_id, coalesce(_role, 'member'))
  on conflict (team_id, user_id) do update set role = excluded.role
  returning team_id, user_id, org_id, role, created_at;
$$;
grant execute on function api.team_add_member(uuid, uuid, uuid, text) to anon, authenticated;

create or replace function api.team_remove_member(
  _org_id uuid, _team_id uuid, _user_id uuid
) returns void
language sql security definer set search_path = public, pg_temp as $$
  delete from public.team_members
   where org_id = _org_id and team_id = _team_id and user_id = _user_id;
$$;
grant execute on function api.team_remove_member(uuid, uuid, uuid) to anon, authenticated;
