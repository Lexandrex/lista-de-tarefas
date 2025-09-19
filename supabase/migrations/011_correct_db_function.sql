create or replace function public.auth_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id
  from public.profiles
  where id = auth.uid()
$$;

revoke all on function public.auth_org_id() from public;
grant execute on function public.auth_org_id() to anon, authenticated, service_role;

do $blk$
declare
  v_org uuid;
begin
  select id into v_org
  from public.organizations
  where name = 'Default Org'
  limit 1;

  if v_org is null then
    insert into public.organizations (name)
    values ('Default Org')
    returning id into v_org;
  end if;

  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $f$
  declare
    v_default_org uuid;
  begin
    select id into v_default_org
    from public.organizations
    where name = 'Default Org'
    limit 1;

    insert into public.profiles (id, email, org_id)
    values (new.id, new.email, v_default_org)
    on conflict (id) do nothing;

    return new;
  end;
  $f$;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
end
$blk$;


alter table public.profiles enable row level security;

drop policy if exists "profiles: self read"   on public.profiles;
drop policy if exists "profiles: self update" on public.profiles;

create policy "profiles: self read"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles: self update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

alter table public.teams    enable row level security;
alter table public.projects enable row level security;
alter table public.tasks    enable row level security;

-- TEAMS
drop policy if exists "teams: org read"   on public.teams;
drop policy if exists "teams: org insert" on public.teams;
drop policy if exists "teams: org update" on public.teams;
drop policy if exists "teams: org delete" on public.teams;

create policy "teams: org read"
on public.teams
for select
to authenticated
using (org_id = public.auth_org_id());

create policy "teams: org insert"
on public.teams
for insert
to authenticated
with check (org_id = public.auth_org_id());

create policy "teams: org update"
on public.teams
for update
to authenticated
using (org_id = public.auth_org_id())
with check (org_id = public.auth_org_id());

create policy "teams: org delete"
on public.teams
for delete
to authenticated
using (org_id = public.auth_org_id());

-- PROJECTS
drop policy if exists "projects: org read"   on public.projects;
drop policy if exists "projects: org insert" on public.projects;
drop policy if exists "projects: org update" on public.projects;
drop policy if exists "projects: org delete" on public.projects;

create policy "projects: org read"
on public.projects
for select
to authenticated
using (org_id = public.auth_org_id());

create policy "projects: org insert"
on public.projects
for insert
to authenticated
with check (org_id = public.auth_org_id());

create policy "projects: org update"
on public.projects
for update
to authenticated
using (org_id = public.auth_org_id())
with check (org_id = public.auth_org_id());

create policy "projects: org delete"
on public.projects
for delete
to authenticated
using (org_id = public.auth_org_id());

-- TASKS
drop policy if exists "tasks: org read"   on public.tasks;
drop policy if exists "tasks: org insert" on public.tasks;
drop policy if exists "tasks: org update" on public.tasks;
drop policy if exists "tasks: org delete" on public.tasks;

create policy "tasks: org read"
on public.tasks
for select
to authenticated
using (org_id = public.auth_org_id());

create policy "tasks: org insert"
on public.tasks
for insert
to authenticated
with check (org_id = public.auth_org_id());

create policy "tasks: org update"
on public.tasks
for update
to authenticated
using (org_id = public.auth_org_id())
with check (org_id = public.auth_org_id());

create policy "tasks: org delete"
on public.tasks
for delete
to authenticated
using (org_id = public.auth_org_id());

insert into public.organizations (name)
select 'Default Org'
where not exists (
  select 1 from public.organizations where name = 'Default Org'
);

insert into public.profiles (id, email, org_id)
select u.id, u.email, (select id from public.organizations where name='Default Org' limit 1)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

update public.profiles p
set org_id = (select id from public.organizations where name='Default Org' limit 1)
where p.org_id is null;
