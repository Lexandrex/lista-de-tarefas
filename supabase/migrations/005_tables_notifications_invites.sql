-- Notifications
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null default public.auth_org_id(),
  user_id    uuid not null references public.profiles(id),
  type       text not null,
  payload    jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id);

-- Invites
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id),
  email       text not null,
  role        text not null default 'member',
  token       text not null unique,
  invited_by  uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists invites_org_idx on public.invites(org_id);
