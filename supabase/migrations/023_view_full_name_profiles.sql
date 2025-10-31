drop view if exists api.profiles;

create or replace view api.profiles as
  select
    p.id,
    p.org_id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.is_admin,
    p.created_at,
    p.updated_at
  from public.profiles p
  where p.org_id = public.auth_org_id();
grant select on api.profiles to anon, authenticated;
