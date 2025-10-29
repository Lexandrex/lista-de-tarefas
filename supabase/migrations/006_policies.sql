alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.projects      enable row level security;
alter table public.tasks         enable row level security;
alter table public.task_labels   enable row level security;
alter table public.task_label_links enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.comments      enable row level security;
alter table public.attachments   enable row level security;
alter table public.activities    enable row level security;
alter table public.calendar_events enable row level security;
alter table public.notifications enable row level security;
alter table public.invites       enable row level security;

-- PROFILES:
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles for select
  using (id = public.auth_uid() or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  using (id = public.auth_uid());

-- TEAMS:
drop policy if exists "teams org read" on public.teams;
create policy "teams org read"
  on public.teams for select
  using (org_id = public.auth_org_id());

drop policy if exists "teams admin write" on public.teams;
create policy "teams admin write"
  on public.teams for all
  using (org_id = public.auth_org_id() and public.is_admin())
  with check (org_id = public.auth_org_id());

-- TEAM MEMBERS:
drop policy if exists "team_members org read" on public.team_members;
create policy "team_members org read"
  on public.team_members for select
  using (org_id = public.auth_org_id());

drop policy if exists "team_members admin write" on public.team_members;
create policy "team_members admin write"
  on public.team_members for all
  using (org_id = public.auth_org_id() and public.is_admin())
  with check (org_id = public.auth_org_id());

-- PROJECTS:
drop policy if exists "projects org read" on public.projects;
create policy "projects org read"
  on public.projects for select
  using (org_id = public.auth_org_id());

drop policy if exists "projects admin write" on public.projects;
create policy "projects admin write"
  on public.projects for all
  using (org_id = public.auth_org_id() and public.is_admin())
  with check (org_id = public.auth_org_id());

-- TASKS:
drop policy if exists "tasks org read" on public.tasks;
create policy "tasks org read"
  on public.tasks for select
  using (org_id = public.auth_org_id());

drop policy if exists "tasks org insert" on public.tasks;
create policy "tasks org insert"
  on public.tasks for insert
  with check (org_id = public.auth_org_id());

drop policy if exists "tasks org update" on public.tasks;
create policy "tasks org update"
  on public.tasks for update
  using (org_id = public.auth_org_id())
  with check (org_id = public.auth_org_id());

drop policy if exists "tasks admin delete" on public.tasks;
create policy "tasks admin delete"
  on public.tasks for delete
  using (org_id = public.auth_org_id() and public.is_admin());

-- LABELS & LINKS:
drop policy if exists "task_labels org read" on public.task_labels;
create policy "task_labels org read"
  on public.task_labels for select
  using (org_id = public.auth_org_id());
drop policy if exists "task_labels admin write" on public.task_labels;
create policy "task_labels admin write"
  on public.task_labels for all
  using (org_id = public.auth_org_id() and public.is_admin())
  with check (org_id = public.auth_org_id());

drop policy if exists "task_label_links org read" on public.task_label_links;
create policy "task_label_links org read"
  on public.task_label_links for select
  using (org_id = public.auth_org_id());
drop policy if exists "task_label_links org write" on public.task_label_links;
create policy "task_label_links org write"
  on public.task_label_links for all
  using (org_id = public.auth_org_id())
  with check (org_id = public.auth_org_id());

-- CHECKLIST:
drop policy if exists "tci org read" on public.task_checklist_items;
create policy "tci org read"
  on public.task_checklist_items for select
  using (org_id = public.auth_org_id());
drop policy if exists "tci org insert" on public.task_checklist_items;
create policy "tci org insert"
  on public.task_checklist_items for insert
  with check (org_id = public.auth_org_id());
drop policy if exists "tci org update" on public.task_checklist_items;
create policy "tci org update"
  on public.task_checklist_items for update
  using (org_id = public.auth_org_id())
  with check (org_id = public.auth_org_id());
drop policy if exists "tci admin delete" on public.task_checklist_items;
create policy "tci admin delete"
  on public.task_checklist_items for delete
  using (org_id = public.auth_org_id() and public.is_admin());

-- COMMENTS:
drop policy if exists "comments org read" on public.comments;
create policy "comments org read"
  on public.comments for select
  using (org_id = public.auth_org_id());
drop policy if exists "comments org insert" on public.comments;
create policy "comments org insert"
  on public.comments for insert
  with check (org_id = public.auth_org_id());
drop policy if exists "comments org update" on public.comments;
create policy "comments org update"
  on public.comments for update
  using (org_id = public.auth_org_id())
  with check (org_id = public.auth_org_id());
drop policy if exists "comments admin delete" on public.comments;
create policy "comments admin delete"
  on public.comments for delete
  using (org_id = public.auth_org_id() and public.is_admin());

-- ATTACHMENTS:
drop policy if exists "attachments org read" on public.attachments;
create policy "attachments org read"
  on public.attachments for select
  using (org_id = public.auth_org_id());
drop policy if exists "attachments org insert" on public.attachments;
create policy "attachments org insert"
  on public.attachments for insert
  with check (org_id = public.auth_org_id());
drop policy if exists "attachments org update" on public.attachments;
create policy "attachments org update"
  on public.attachments for update
  using (org_id = public.auth_org_id())
  with check (org_id = public.auth_org_id());
drop policy if exists "attachments admin delete" on public.attachments;
create policy "attachments admin delete"
  on public.attachments for delete
  using (org_id = public.auth_org_id() and public.is_admin());

-- ACTIVITIES:
drop policy if exists "activities org read" on public.activities;
create policy "activities org read"
  on public.activities for select
  using (org_id = public.auth_org_id());
drop policy if exists "activities org insert" on public.activities;
create policy "activities org insert"
  on public.activities for insert
  with check (org_id = public.auth_org_id());

-- CALENDAR:
drop policy if exists "calendar org read" on public.calendar_events;
create policy "calendar org read"
  on public.calendar_events for select
  using (org_id = public.auth_org_id());
drop policy if exists "calendar org insert" on public.calendar_events;
create policy "calendar org insert"
  on public.calendar_events for insert
  with check (org_id = public.auth_org_id());
drop policy if exists "calendar org update" on public.calendar_events;
create policy "calendar org update"
  on public.calendar_events for update
  using (org_id = public.auth_org_id())
  with check (org_id = public.auth_org_id());
drop policy if exists "calendar admin delete" on public.calendar_events;
create policy "calendar admin delete"
  on public.calendar_events for delete
  using (org_id = public.auth_org_id() and public.is_admin());

-- NOTIFICATIONS:
drop policy if exists "notifications user read" on public.notifications;
create policy "notifications user read"
  on public.notifications for select
  using (org_id = public.auth_org_id() and user_id = public.auth_uid());
drop policy if exists "notifications user c/u" on public.notifications;
create policy "notifications user c/u"
  on public.notifications for insert with check (org_id = public.auth_org_id() and user_id = public.auth_uid());
create policy "notifications user update"
  on public.notifications for update
  using (org_id = public.auth_org_id() and user_id = public.auth_uid())
  with check (org_id = public.auth_org_id() and user_id = public.auth_uid());

-- INVITES:
drop policy if exists "invites admin all" on public.invites;
create policy "invites admin all"
  on public.invites for all
  using (org_id = public.auth_org_id() and public.is_admin())
  with check (org_id = public.auth_org_id());
