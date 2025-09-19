do $$
declare v_org uuid;
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
  as $fn$
  declare
    v_default_org uuid := (select id from public.organizations where name='Default Org' limit 1);
  begin
    insert into public.profiles (id, email, org_id)
    values (new.id, new.email, v_default_org);
    return new;
  end;
  $fn$;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
end$$;
