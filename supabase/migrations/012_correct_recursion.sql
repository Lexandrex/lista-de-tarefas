alter table public.team_members
  add column if not exists org_id uuid;

update public.team_members tm
set org_id = t.org_id
from public.teams t
where t.id = tm.team_id
  and tm.org_id is null;

do $$
begin
  if exists (select 1 from public.team_members where org_id is null) then
    raise notice 'Some team_members.org_id are still NULL; leaving it nullable for now.';
  else
    alter table public.team_members
      alter column org_id set not null;
  end if;
exception when others then
  raise notice 'Skipping NOT NULL on team_members.org_id due to error: %', sqlerrm;
end$$;

alter table public.team_members
  alter column org_id set default public.auth_org_id();

create index if not exists team_members_org_idx on public.team_members (org_id);

alter table public.team_members enable row level security;

drop policy if exists "team_members: org read"   on public.team_members;
drop policy if exists "team_members: org insert" on public.team_members;
drop policy if exists "team_members: org update" on public.team_members;
drop policy if exists "team_members: org delete" on public.team_members;

create policy "team_members: org read"
on public.team_members for select to authenticated
using (org_id = public.auth_org_id());

create policy "team_members: org insert"
on public.team_members for insert to authenticated
with check (org_id = public.auth_org_id());

create policy "team_members: org update"
on public.team_members for update to authenticated
using (org_id = public.auth_org_id())
with check (org_id = public.auth_org_id());

create policy "team_members: org delete"
on public.team_members for delete to authenticated
using (org_id = public.auth_org_id());
