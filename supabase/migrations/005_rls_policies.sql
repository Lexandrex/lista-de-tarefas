ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_self_or_admin
ON public.users
FOR SELECT TO authenticated
USING (public.is_admin() OR id = public.current_user_id());

CREATE POLICY users_update_self_or_admin
ON public.users
FOR UPDATE TO authenticated
USING (public.is_admin() OR id = public.current_user_id())
WITH CHECK (public.is_admin() OR id = public.current_user_id());

CREATE POLICY users_insert_admin
ON public.users
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY users_delete_admin
ON public.users
FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY teams_select_member_or_admin
ON public.teams
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.team_members tm
  WHERE tm.team_id = public.teams.id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY teams_insert_admin
ON public.teams
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY teams_update_admin
ON public.teams
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY teams_delete_admin
ON public.teams
FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY team_members_select_scope
ON public.team_members
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.team_members tm2
  WHERE tm2.team_id = public.team_members.team_id
    AND tm2.user_id = public.current_user_id()
));

CREATE POLICY team_members_insert_admin
ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY team_members_update_admin
ON public.team_members
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY team_members_delete_admin
ON public.team_members
FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY projects_select_member_or_admin
ON public.projects
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.team_members
  WHERE team_id = public.projects.team_id
    AND user_id = public.current_user_id()
));

CREATE POLICY projects_insert_member
ON public.projects
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.team_members
  WHERE team_id = public.projects.team_id
    AND user_id = public.current_user_id()
));

CREATE POLICY projects_update_member
ON public.projects
FOR UPDATE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.team_members
  WHERE team_id = public.projects.team_id
    AND user_id = public.current_user_id()
))
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.team_members
  WHERE team_id = public.projects.team_id
    AND user_id = public.current_user_id()
));

CREATE POLICY projects_delete_admin
ON public.projects
FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY task_statuses_select_all
ON public.task_statuses
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY task_statuses_mutate_admin
ON public.task_statuses
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY task_types_select_all
ON public.task_types
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY task_types_mutate_admin
ON public.task_types
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY tasks_select_member_or_admin
ON public.tasks
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.projects p
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE p.id = public.tasks.project_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY tasks_insert_member
ON public.tasks
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.projects p
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE p.id = public.tasks.project_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY tasks_update_member
ON public.tasks
FOR UPDATE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.projects p
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE p.id = public.tasks.project_id
    AND tm.user_id = public.current_user_id()
))
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.projects p
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE p.id = public.tasks.project_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY tasks_delete_admin
ON public.tasks
FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY task_assignees_select_member_or_admin
ON public.task_assignees
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE t.id = public.task_assignees.task_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY task_assignees_insert_member
ON public.task_assignees
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE t.id = public.task_assignees.task_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY task_assignees_update_member
ON public.task_assignees
FOR UPDATE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE t.id = public.task_assignees.task_id
    AND tm.user_id = public.current_user_id()
))
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE t.id = public.task_assignees.task_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY task_assignees_delete_member
ON public.task_assignees
FOR DELETE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  JOIN public.team_members tm ON tm.team_id = p.team_id
  WHERE t.id = public.task_assignees.task_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY calendars_select_member_or_admin
ON public.calendars
FOR SELECT TO authenticated
USING (public.is_admin() OR (team_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.team_members tm
  WHERE tm.team_id = public.calendars.team_id
    AND tm.user_id = public.current_user_id()
)));

CREATE POLICY calendars_insert_admin
ON public.calendars
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY calendars_update_admin
ON public.calendars
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY calendars_delete_admin
ON public.calendars
FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY events_select_member_or_admin
ON public.events
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.calendars c
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE c.id = public.events.calendar_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY events_insert_member
ON public.events
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.calendars c
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE c.id = public.events.calendar_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY events_update_member
ON public.events
FOR UPDATE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.calendars c
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE c.id = public.events.calendar_id
    AND tm.user_id = public.current_user_id()
))
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.calendars c
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE c.id = public.events.calendar_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY events_delete_admin
ON public.events
FOR DELETE TO authenticated
USING (public.is_admin());

CREATE POLICY event_attendees_select_member_or_admin
ON public.event_attendees
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_attendees.event_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY event_attendees_insert_member
ON public.event_attendees
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_attendees.event_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY event_attendees_update_member
ON public.event_attendees
FOR UPDATE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_attendees.event_id
    AND tm.user_id = public.current_user_id()
))
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_attendees.event_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY event_attendees_delete_member
ON public.event_attendees
FOR DELETE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_attendees.event_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY event_tasks_select_member_or_admin
ON public.event_tasks
FOR SELECT TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_tasks.event_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY event_tasks_insert_member
ON public.event_tasks
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_tasks.event_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY event_tasks_update_member
ON public.event_tasks
FOR UPDATE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_tasks.event_id
    AND tm.user_id = public.current_user_id()
))
WITH CHECK (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_tasks.event_id
    AND tm.user_id = public.current_user_id()
));

CREATE POLICY event_tasks_delete_member
ON public.event_tasks
FOR DELETE TO authenticated
USING (public.is_admin() OR EXISTS (
  SELECT 1
  FROM public.events e
  JOIN public.calendars c ON c.id = e.calendar_id
  JOIN public.team_members tm ON tm.team_id = c.team_id
  WHERE e.id = public.event_tasks.event_id
    AND tm.user_id = public.current_user_id()
));
