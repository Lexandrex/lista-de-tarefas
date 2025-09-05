CREATE TABLE public.calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES public.calendars (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_calendar_start ON public.events(calendar_id, start_time);
CREATE INDEX idx_events_start ON public.events(start_time);

CREATE TABLE public.event_attendees (
  event_id UUID REFERENCES public.events (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users (id) ON DELETE CASCADE,
  response TEXT,
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE public.event_tasks (
  event_id UUID REFERENCES public.events (id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks (id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, task_id)
);
