create table if not exists public.project_teams (
  project_id uuid not null references public.projects(id) on delete cascade,
  team_id    uuid not null references public.teams(id)    on delete cascade,
  org_id     uuid not null default public.auth_org_id(),
  created_at timestamptz not null default now(),
  primary key (project_id, team_id)
);

create index if not exists project_teams_org_idx     on public.project_teams(org_id);
create index if not exists project_teams_project_idx on public.project_teams(project_id);
create index if not exists project_teams_team_idx    on public.project_teams(team_id);

alter table public.project_teams enable row level security;

create policy "pt_select_same_org" on public.project_teams
  for select using (org_id = public.auth_org_id());
create policy "pt_insert_same_org" on public.project_teams
  for insert with check (org_id = public.auth_org_id());
create policy "pt_delete_same_org" on public.project_teams
  for delete using (org_id = public.auth_org_id());

create or replace view api.project_teams as
  select project_id, team_id, org_id, created_at
  from public.project_teams;

grant usage on schema api to anon, authenticated;
grant select on all tables in schema api to anon, authenticated;
alter default privileges in schema api grant select on tables to anon, authenticated;

create or replace function api.project_set_teams(
  _org_id uuid,
  _project_id uuid,
  _team_ids uuid[]
) returns void
language plpgsql
security definer
as $$
begin
  if _team_ids is null or array_length(_team_ids, 1) is null then
    delete from public.project_teams
     where org_id = _org_id and project_id = _project_id;
  else
    delete from public.project_teams
     where org_id = _org_id
       and project_id = _project_id
       and not (team_id = any (_team_ids));

    insert into public.project_teams(project_id, team_id, org_id)
    select _project_id, x.team_id, _org_id
    from unnest(_team_ids) as x(team_id)
    on conflict (project_id, team_id) do nothing;
  end if;
end $$;

grant execute on function api.project_set_teams(uuid, uuid, uuid[]) to anon, authenticated;
