create or replace view api.team_member_users as
select tm.team_id, tm.user_id, tm.org_id, u.name, u.email
from api.team_members tm
join api.users u on u.id = tm.user_id;
grant select on api.team_member_users to anon, authenticated;
