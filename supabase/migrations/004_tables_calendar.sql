create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.auth_org_id(),
  project_id  uuid references public.projects(id) on delete set null,
  team_id     uuid references public.teams(id)    on delete set null,
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  all_day     boolean not null default false,
  location    text,
  recurrence  text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists calendar_org_idx  on public.calendar_events(org_id);
create index if not exists calendar_time_idx on public.calendar_events(starts_at, ends_at);
