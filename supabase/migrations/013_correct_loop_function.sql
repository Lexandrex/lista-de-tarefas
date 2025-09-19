alter table public.team_members enable row level security;
drop policy if exists "team_members_select_scope" on public.team_members;
drop policy if exists "team_members_insert_admin" on public.team_members;
drop policy if exists "team_members_update_admin" on public.team_members;
drop policy if exists "team_members_delete_admin" on public.team_members;
drop policy if exists "team_members: org read"   on public.team_members;
drop policy if exists "team_members: org insert" on public.team_members;
drop policy if exists "team_members: org update" on public.team_members;
drop policy if exists "team_members: org delete" on public.team_members;

create policy "team_members: read"
on public.team_members
for select
to authenticated
using ( is_admin() OR org_id = public.auth_org_id() );

create policy "team_members: insert"
on public.team_members
for insert
to authenticated
with check ( is_admin() OR org_id = public.auth_org_id() );

create policy "team_members: update"
on public.team_members
for update
to authenticated
using     ( is_admin() OR org_id = public.auth_org_id() )
with check( is_admin() OR org_id = public.auth_org_id() );

create policy "team_members: delete"
on public.team_members
for delete
to authenticated
using ( is_admin() OR org_id = public.auth_org_id() );
