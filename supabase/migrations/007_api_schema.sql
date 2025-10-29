create schema if not exists api;

create or replace view api.teams as
  select id, org_id, name, description, created_at, updated_at
  from public.teams;

create or replace view api.team_members as
  select team_id, user_id, org_id, role, created_at
  from public.team_members;

create or replace view api.projects as
  select id, org_id, team_id, name, key, description, status, start_date, due_date, created_at, updated_at
  from public.projects;

create or replace view api.tasks as
  select id, org_id, project_id, parent_id, title, description, status, priority,
         assignee_id, reporter_id, due_date, order_index, done, created_at, updated_at
  from public.tasks;

grant usage on schema api to anon, authenticated;
grant select on all tables in schema api to anon, authenticated;
alter default privileges in schema api grant select on tables to anon, authenticated;
grant execute on all functions in schema api to anon, authenticated;
alter default privileges in schema api grant execute on functions to anon, authenticated;
