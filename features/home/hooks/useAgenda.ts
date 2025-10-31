import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

export type AgendaItem =
  | { kind: "event"; id: string; title: string; atISO: string | null; label: string }
  | { kind: "task";  id: string; title: string; atISO: null;           label: string };
type TaskRow  = Database["api"]["Views"]["tasks"]["Row"];
type EventRow = Database["api"]["Views"]["calendar_events"]["Row"];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startISO = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0);   return x.toISOString(); };
const endISO   = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x.toISOString(); };
const notNull = <T,>(x: T | null | undefined): x is T => x != null;

export function useAgenda(orgId: string | null, forDate: Date = new Date()) {
  const keyDay = forDate.toDateString();

  return useQuery({
    queryKey: ["agenda", orgId, keyDay],
    enabled: !!orgId,
    queryFn: async (): Promise<AgendaItem[]> => {
      if (!orgId) return [];

      const [tasksRes, eventsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, due_date, status, org_id")
          .eq("org_id", orgId)
          .eq("due_date", ymd(forDate))
          .neq("status", "done"),
        supabase
          .from("calendar_events")
          .select("id, title, starts_at, ends_at, all_day, org_id")
          .eq("org_id", orgId)
          .gte("starts_at", startISO(forDate))
          .lt("starts_at", endISO(forDate)),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const taskRows  = (tasksRes.data  ?? []) as TaskRow[];
      const eventRows = (eventsRes.data ?? []) as EventRow[];

      const tasks: AgendaItem[] = taskRows
        .map((t): AgendaItem | null => {
          const id = t.id ?? undefined;
          const title = t.title ?? undefined;
          if (!id || !title) return null;
          return { kind: "task", id, title, atISO: null, label: "Due today" };
        })
        .filter(notNull);

      const events: AgendaItem[] = eventRows
        .map((e): AgendaItem | null => {
          const id = e.id ?? undefined;
          const title = e.title ?? undefined;
          if (!id || !title) return null;
          const atISO = e.all_day ? null : (e.starts_at ?? null);
          const label = e.all_day
            ? "All day"
            : atISO
              ? new Date(atISO).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Time TBD";
          return { kind: "event", id, title, atISO, label };
        })
        .filter(notNull);

      const orderKey = (it: AgendaItem) =>
        it.kind === "event" && it.atISO ? `0-${it.atISO}` :
        it.kind === "event" ? `1-` : `2-`;
      return [...events, ...tasks].sort((a, b) => orderKey(a).localeCompare(orderKey(b)));
    },
  });
}
