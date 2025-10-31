import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/useAuth";

type TaskStatus = "todo" | "doing" | "done";
type TaskRow = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  project_id: string;
  team_id?: string | null;
  assignee_id?: string | null;
  org_id?: string | null;
};
type Task = Omit<TaskRow, "status"> & { status: TaskStatus };

type Project = { id: string; name: string; description?: string | null; team_id?: string | null };
type PersonRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean | null;
};
type Counters = { projects: number; tasks: number; teams: number };

export default function HomePage() {
  const { user } = useAuth();
  const orgId = (user as any)?.user_metadata?.org_id ?? null;

  const [teamNameById, setTeamNameById] = useState<Record<string, string>>({});
  const [projectsById, setProjectsById] = useState<Record<string, Project>>({});
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [admins, setAdmins] = useState<PersonRow[]>([]);
  const [employees, setEmployees] = useState<PersonRow[]>([]);
  const [counts, setCounts] = useState<Counters>({ projects: 0, tasks: 0, teams: 0 });
  const [loading, setLoading] = useState(true);

  const todayISO = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!orgId) {
        setTeamNameById({});
        setProjectsById({});
        setTodayTasks([]);
        setAdmins([]);
        setEmployees([]);
        setCounts({ projects: 0, tasks: 0, teams: 0 });
        setLoading(false);
        return;
      }

      setLoading(true);

      const [cProj, cTask, cTeam] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("org_id", orgId as string),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("org_id", orgId as string),
        supabase.from("teams").select("id", { count: "exact", head: true }).eq("org_id", orgId as string),
      ]);
      if (active) {
        setCounts({
          projects: cProj.count ?? 0,
          tasks: cTask.count ?? 0,
          teams: cTeam.count ?? 0,
        });
      }

      const peopleRes = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, is_admin, org_id")
        .eq("org_id", orgId as string);
      if (active && !peopleRes.error) {
        const rows = (peopleRes.data ?? []) as PersonRow[];
        setAdmins(rows.filter(p => !!p.is_admin));
        setEmployees(rows.filter(p => !p.is_admin));
      }

      const [teamsRes, projRes] = await Promise.all([
        supabase.from("teams").select("id, name, org_id").eq("org_id", orgId as string),
        supabase.from("projects").select("id, name, description, team_id, org_id").eq("org_id", orgId as string),
      ]);
      if (active && !teamsRes.error) {
        const map = Object.fromEntries((teamsRes.data ?? []).map((t: any) => [t.id, t.name])) as Record<string, string>;
        setTeamNameById(map);
      }
      if (active && !projRes.error) {
        const arr = (projRes.data ?? []) as Project[];
        setProjectsById(Object.fromEntries(arr.map(p => [p.id, p])));
      }

      const tasksRes = await supabase
        .from("tasks")
        .select("id, title, description, status, due_date, project_id, team_id, assignee_id, org_id")
        .eq("org_id", orgId as string)
        .eq("due_date", todayISO)
        .order("status", { ascending: true });
      if (active && !tasksRes.error) {
        const rows = (tasksRes.data ?? []) as TaskRow[];
        const mapped: Task[] = rows.map(r => ({
          ...r,
          status: r.status === "in_progress" ? "doing" : (r.status as TaskStatus),
        }));
        setTodayTasks(mapped);
      }

      setLoading(false);
    })().catch(err => {
      console.error("[Home] load error", err);
      setLoading(false);
    });
    return () => { active = false; };
  }, [orgId]);

  const colTodo  = useMemo(() => todayTasks.filter(t => t.status === "todo"),  [todayTasks]);
  const colDoing = useMemo(() => todayTasks.filter(t => t.status === "doing"), [todayTasks]);
  const colDone  = useMemo(() => todayTasks.filter(t => t.status === "done"),  [todayTasks]);

  const setStatus = useCallback(async (t: Task, next: TaskStatus) => {
    if (next === "done" || t.status === "done") return;
    if (next === t.status) return;

    const dbStatus = next === "doing" ? "in_progress" : next;

    const args: any = {
      _org_id: orgId as string,
      _id: t.id,
      _title: t.title,
      _description: t.description ?? null,
      _project_id: t.project_id,
      _team_id: t.team_id ?? null,
      _assignee_id: t.assignee_id ?? null,
      _status: dbStatus,
      _due_date: t.due_date ?? null,
    };
    const { error } = await supabase.rpc("task_upsert", args);
    if (error) {
      console.error("[Home] task_upsert error", error);
      return;
    }
    setTodayTasks(prev => prev.map(x => (x.id === t.id ? { ...x, status: next } : x)));
  }, [orgId]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 grid gap-6">

      <header>
        <h1 className="text-xl font-semibold">Home</h1>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Projetos" value={counts.projects} />
        <StatCard label="Tarefas" value={counts.tasks} />
        <StatCard label="Equipes" value={counts.teams} />
      </section>
      <section className="grid gap-3">
        <div className="grid gap-1">
          <div className="text-sm opacity-70">Administradores</div>
          <div className="card p-3 overflow-x-auto">
            <PeopleRow items={admins} />
          </div>
        </div>
        <div className="grid gap-1">
          <div className="text-sm opacity-70">Funcionarios</div>
          <div className="card p-3 overflow-x-auto">
            <PeopleRow items={employees} />
          </div>
        </div>
      </section>

      <section className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-70">Tarefas de hoje ({todayISO})</div>
          {loading && <div className="text-xs opacity-60">Carregando...</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KanbanColumn
            title="Todo"
            items={colTodo}
            teamNameById={teamNameById}
            projectsById={projectsById}
         //   onMove={(t) => setStatus(t, "doing")}
            moveLabel="Move to Doing"
          />
          <KanbanColumn
            title="Doing"
            items={colDoing}
            teamNameById={teamNameById}
            projectsById={projectsById}
        //    onMove={(t) => setStatus(t, "todo")}
            moveLabel="Move to Todo"
          />
          <KanbanColumn
            title="Done"
            items={colDone}
            teamNameById={teamNameById}
            projectsById={projectsById}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function PeopleRow({ items }: { items: PersonRow[] }) {
  return (
    <div className="flex gap-4 min-w-full">
      {items.length === 0 ? (
        <div className="text-sm text-muted">Nao ha ninguem aqui.</div>
      ) : items.map(p => {
        const display = p.full_name ?? p.email ?? "User";
        return (
          <div key={p.id} className="flex items-center gap-2 shrink-0">
            <img
              src={p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(display)}`}
              alt={display}
              className="w-8 h-8 rounded-full border"
            />
            <div className="text-sm">
              <div className="font-medium">{display}</div>
              {/* <div className="opacity-60">{p.email}</div> */}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanColumn({
  title,
  items,
  teamNameById,
  projectsById,
  //onMove,
  moveLabel,
}: {
  title: string;
  items: Task[];
  teamNameById: Record<string, string>;
  projectsById: Record<string, Project>;
// onMove?: (t: Task) => void;
  moveLabel?: string;
}) {
  return (
    <div className="card p-4 grid gap-3">
      <div className="text-sm opacity-70">{title}</div>
      <div className="grid gap-2 max-h-96 overflow-auto pr-1">
        {items.length === 0 ? (
          <div className="text-sm text-muted">Nada por aqui.</div>
        ) : items.map(t => {
          const teamName = t.team_id ? (teamNameById[t.team_id] ?? "") : "";
          const projName = projectsById[t.project_id]?.name ?? "";
          return (
            <div key={t.id} className="border rounded p-2 grid gap-1">
              <div className="font-medium">{t.title}</div>
              <div className="text-xs opacity-70">
                {projName ? projName : ""}
                {projName && teamName ? " • " : ""}
                {teamName ? teamName : ""}
                {t.due_date ? ` • Data de entrega ${t.due_date}` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
