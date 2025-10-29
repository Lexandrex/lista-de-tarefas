create or replace view api.users as
  select p.id, p.full_name as name, p.email
  from public.profiles p;
grant select on api.users to anon, authenticated;
