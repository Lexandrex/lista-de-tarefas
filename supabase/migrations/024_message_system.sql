drop view if exists api.profiles;

alter table public.profiles
  add column if not exists phone_e164 text;

alter table public.profiles
  drop constraint if exists profiles_phone_e164_check;

alter table public.profiles
  add constraint profiles_phone_e164_check
  check (phone_e164 is null or phone_e164 ~ '^\+[1-9]\d{1,14}$');
create or replace view api.profiles as
select
  p.id,
  p.org_id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.is_admin,
  p.phone_e164,
  p.created_at,
  p.updated_at
from public.profiles p
where p.org_id = public.auth_org_id();

grant select on api.profiles to anon, authenticated;

create table if not exists public.sms_queue (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null,
  user_id     uuid not null,
  kind        text not null check (kind in ('task_assigned','team_joined','project_joined')),
  ref_id      uuid,
  msg         text not null,
  status      text not null default 'pending' check (status in ('pending','sent','failed')),
  attempts    int  not null default 0,
  last_error  text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists sms_queue_status_idx on public.sms_queue(status);
create index if not exists sms_queue_org_idx    on public.sms_queue(org_id);

create or replace function public.tg_sms_on_task_assigned()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT' and new.assignee_id is not null)
     or (tg_op = 'UPDATE' and new.assignee_id is distinct from old.assignee_id and new.assignee_id is not null) then
    insert into public.sms_queue(org_id, user_id, kind, ref_id, msg)
    values (
      new.org_id,
      new.assignee_id,
      'task_assigned',
      new.id,
      format(
        'Nova tarefa atribuída: "%s"%s',
        coalesce(new.title, 'Tarefa'),
        case when new.due_date is not null then format(' (vence %s)', new.due_date::text) else '' end
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sms_task_assigned on public.tasks;
create trigger trg_sms_task_assigned
after insert or update of assignee_id on public.tasks
for each row execute function public.tg_sms_on_task_assigned();

create or replace function public.tg_sms_on_team_member_added()
returns trigger
language plpgsql
security definer
as $$
declare
  team_name text;
begin
  select t.name into team_name from public.teams t where t.id = new.team_id;
  insert into public.sms_queue(org_id, user_id, kind, ref_id, msg)
  values (
    new.org_id,
    new.user_id,
    'team_joined',
    new.team_id,
    format('Você entrou no time "%s".', coalesce(team_name, 'Time'))
  );
  return new;
end;
$$;

drop trigger if exists trg_sms_team_member_added on public.team_members;
create trigger trg_sms_team_member_added
after insert on public.team_members
for each row execute function public.tg_sms_on_team_member_added();

create or replace function public.tg_sms_on_project_team_added()
returns trigger
language plpgsql
security definer
as $$
declare
  project_name text;
begin
  select p.name into project_name from public.projects p where p.id = new.project_id;

  insert into public.sms_queue(org_id, user_id, kind, ref_id, msg)
  select
    tm.org_id,
    tm.user_id,
    'project_joined',
    new.project_id,
    format('Seu time foi adicionado ao projeto "%s".', coalesce(project_name,'Projeto'))
  from public.team_members tm
  where tm.team_id = new.team_id
    and tm.org_id  = new.org_id;

  return new;
end;
$$;

drop trigger if exists trg_sms_project_team_added on public.project_teams;
create trigger trg_sms_project_team_added
after insert on public.project_teams
for each row execute function public.tg_sms_on_project_team_added();
