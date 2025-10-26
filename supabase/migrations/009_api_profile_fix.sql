create or replace view api.profiles as
select id, org_id, is_admin
from public.profiles;
grant select on api.profiles to anon, authenticated;
