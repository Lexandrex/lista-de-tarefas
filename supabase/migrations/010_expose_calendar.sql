create or replace view api.calendar_events as
  select
    id,
    org_id,
    project_id,
    team_id,
    title,
    starts_at,
    ends_at,
    all_day,
    location,
    recurrence,
    created_by,
    created_at
  from public.calendar_events;

grant usage on schema api to anon, authenticated;
grant select on api.calendar_events to anon, authenticated;
