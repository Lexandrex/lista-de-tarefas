create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create or replace function public.trg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Auth helpers
create or replace function public.auth_uid() returns uuid
language sql stable as $$
  select coalesce((auth.jwt() ->> 'sub')::uuid, null)
$$;

-- org derive
create or replace function public.auth_org_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'org_id','')::uuid
$$;

-- admin check
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce( (auth.jwt() ->> 'is_admin')::boolean, false )
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname='project_status') then
    create type public.project_status as enum ('active','paused','archived');
  end if;
  if not exists (select 1 from pg_type where typname='task_status') then
    create type public.task_status as enum ('todo','in_progress','done');
  end if;
  if not exists (select 1 from pg_type where typname='task_priority') then
    create type public.task_priority as enum ('low','medium','high','urgent');
  end if;
  if not exists (select 1 from pg_type where typname='entity_kind') then
    create type public.entity_kind as enum ('task','project');
  end if;
end$$;
