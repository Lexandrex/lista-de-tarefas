create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text check (role in ('admin','manager','member')) default 'member',
  org_id uuid references public.organizations(id),
  created_at timestamptz default now()
);

insert into public.profiles (id, email, created_at)
select u.id, u.email, now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

do $$
declare v_org uuid;
begin
  select id into v_org from public.organizations order by created_at limit 1;
  if v_org is null then
    insert into public.organizations(name) values ('Default Org') returning id into v_org;
  end if;

  update public.profiles set org_id = coalesce(org_id, v_org);
end $$;

alter table public.profiles alter column org_id set not null;
create index if not exists idx_profiles_org_id on public.profiles(org_id);

create or replace function public.auth_org_id() returns uuid
language sql stable as $$
  select org_id from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
for select using (id = auth.uid());

drop policy if exists org_select on public.profiles;
drop policy if exists org_insert on public.profiles;
drop policy if exists org_update on public.profiles;
drop policy if exists org_delete on public.profiles;

create policy org_select on public.profiles for select using (org_id = public.auth_org_id());
create policy org_insert on public.profiles for insert with check (org_id = public.auth_org_id());
create policy org_update on public.profiles for update using (org_id = public.auth_org_id()) with check (org_id = public.auth_org_id());
create policy org_delete on public.profiles for delete using (org_id = public.auth_org_id());
