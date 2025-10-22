-- Labels
create table if not exists public.task_labels (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null default public.auth_org_id(),
  name    text not null,
  color   text
);

create unique index if not exists task_labels_org_name_uniq
  on public.task_labels (org_id, lower(name));

create table if not exists public.task_label_links (
  task_id   uuid not null references public.tasks(id)       on delete cascade,
  label_id  uuid not null references public.task_labels(id) on delete cascade,
  org_id    uuid not null default public.auth_org_id(),
  primary key (task_id, label_id)
);

-- Checklist items
create table if not exists public.task_checklist_items (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  org_id      uuid not null default public.auth_org_id(),
  title       text not null,
  done        boolean not null default false,
  order_index numeric,
  created_at  timestamptz not null default now()
);
create index if not exists tci_task_idx on public.task_checklist_items(task_id);

-- Comments
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.auth_org_id(),
  entity_type public.entity_kind not null,
  entity_id   uuid not null,
  author_id   uuid not null references public.profiles(id),
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists comments_org_idx    on public.comments(org_id);
create index if not exists comments_entity_idx on public.comments(entity_type, entity_id);

-- Attachments
create table if not exists public.attachments (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null default public.auth_org_id(),
  entity_type  public.entity_kind not null,
  entity_id    uuid not null,
  file_name    text not null,
  storage_path text not null,
  size_bytes   bigint,
  uploaded_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);
create index if not exists attachments_org_idx    on public.attachments(org_id);
create index if not exists attachments_entity_idx on public.attachments(entity_type, entity_id);

-- Activity feed
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null default public.auth_org_id(),
  actor_id    uuid references public.profiles(id),
  verb        text not null,
  entity_type public.entity_kind not null,
  entity_id   uuid not null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists activities_org_idx    on public.activities(org_id);
create index if not exists activities_entity_idx on public.activities(entity_type, entity_id);
