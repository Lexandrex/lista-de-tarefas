create or replace view public.my_tasks as
  select *
  from public.tasks
  where assignee_id = public.auth_uid()
    and org_id = public.auth_org_id();

create or replace view public.team_with_counts as
  select
    t.*,
    (select count(*) from public.team_members tm where tm.team_id = t.id) as members_count,
    (select count(*) from public.projects p   where p.team_id = t.id)     as projects_count
  from public.teams t
  where t.org_id = public.auth_org_id();
