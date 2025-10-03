import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/lib/RoleGate";

type Team = { id: string; name: string };
type UserLite = { id: string; name: string; email?: string | null };
type ProjectLite = { id: string; name: string; team_id?: string | null };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "doing" | "done";
  due_date?: string | null;
  project_id: string;
  team_id: string | null;
  assignee_ids: string[];
};

const statuses = ["todo", "doing", "done"] as const;

export default function TasksPage() {
  const [items, setItems] = useState<Task[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    setItems([
      { id: "ta1", title: "task1", status: "doing", due_date: today(0), project_id: "p1", team_id: "t1", assignee_ids: ["u1"] },
      { id: "ta2", title: "task2", status: "todo", due_date: today(1), project_id: "p2", team_id: "t2", assignee_ids: [] },
    ]);
  }, []);

  const filtered = useMemo(
    () =>
      items.filter(
        (t) =>
          (!q || t.title.toLowerCase().includes(q.toLowerCase())) &&
          (!status || t.status === status)
      ),
    [items, q, status]
  );

  async function loadProjects(): Promise<ProjectLite[]> {
    return [
      { id: "p1", name: "task1", team_id: "t1" },
      { id: "p2", name: "task2", team_id: "t2" },
    ];
  }
  async function loadTeams(): Promise<Team[]> {
    return [
      { id: "t1", name: "team1" },
      { id: "t2", name: "team2" },
    ];
  }
  async function loadMembersByTeam(teamId: string | null): Promise<UserLite[]> {
    if (teamId === "t1") return [{ id: "u1", name: "Ana", email: "bob1@gm.co" }];
    if (teamId === "t2") return [{ id: "u2", name: "Leo", email: "bob2@gm.co" }];
    return [];
  }

  async function handleSubmit(values: TaskUpsert) {
    if (editing) {
      setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...editing, ...values, id: editing.id } as Task : x)));
    } else {
      setItems((prev) => [{ id: "ta" + Math.random().toString(36).slice(2, 8), ...values } as Task, ...prev]);
    }
    setEditing(null);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <RoleGate required="admin">
          <button
            className="rounded-2xl px-4 py-2 border shadow bg-white"
            onClick={() =>
              setEditing({
                id: "",
                title: "",
                description: "",
                status: "todo",
                due_date: "",
                project_id: "",
                team_id: null,
                assignee_ids: [],
              } as Task)
            }
          >
            + New Task
          </button>
        </RoleGate>
      </header>
      <div className="border rounded-2xl bg-white p-3 flex items-center gap-3">
        <input
          placeholder="Search tasks"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border rounded-xl px-3 py-2 w-64"
        />
        <select className="border rounded-xl px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="border rounded-2xl bg-white p-0 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left font-semibold p-3 border-b">Title</th>
              <th className="text-left font-semibold p-3 border-b">Status</th>
              <th className="text-left font-semibold p-3 border-b">Due</th>
              <th className="text-left font-semibold p-3 border-b">Project</th>
              <th className="text-left font-semibold p-3 border-b"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="p-3 border-b">{t.title}</td>
                <td className="p-3 border-b">
                  <StatusPill status={t.status} />
                </td>
                <td className="p-3 border-b">{t.due_date || "—"}</td>
                <td className="p-3 border-b">{t.project_id}</td>
                <td className="p-3 border-b text-right">
                  <RoleGate required="admin">
                    <button className="rounded-xl px-3 py-2 border mr-2" onClick={() => setEditing(t)}>
                      Edit
                    </button>
                    <button className="rounded-xl px-3 py-2 border text-red-600" onClick={() => handleDelete(t.id)}>
                      Delete
                    </button>
                  </RoleGate>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-3" colSpan={5}>
                  <div className="text-sm opacity-70">No tasks found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <RoleGate required="admin">
        {editing && (
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm opacity-75 mb-2">{editing.id ? "Edit Task" : "Create Task"}</div>
            <TaskForm
              initial={editing}
              loadProjects={loadProjects}
              loadTeams={loadTeams}
              loadMembersByTeam={loadMembersByTeam}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
              submitLabel={editing.id ? "Save changes" : "Create"}
            />
          </div>
        )}
      </RoleGate>
    </div>
  );
}

function StatusPill({ status }: { status: Task["status"] }) {
  const map = {
    todo: "bg-yellow-50 text-yellow-800 border-yellow-200",
    doing: "bg-blue-50 text-blue-800 border-blue-200",
    done: "bg-green-50 text-green-800 border-green-200",
  } as const;
  return <span className={`px-2 py-0.5 rounded-full border text-xs ${map[status]}`}>{status}</span>;
}

type TaskUpsert = {
  id?: string;
  title: string;
  description?: string | null;
  status?: "todo" | "doing" | "done" | null;
  due_date?: string | null;
  project_id: string;
  team_id: string | null;
  assignee_ids: string[];
};

function TaskForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loadProjects,
  loadTeams,
  loadMembersByTeam,
}: {
  initial: TaskUpsert;
  onSubmit: (v: TaskUpsert) => Promise<void> | void;
  onCancel: () => void;
  submitLabel: string;
  loadProjects: () => Promise<ProjectLite[]>;
  loadTeams: () => Promise<Team[]>;
  loadMembersByTeam: (teamId: string | null) => Promise<UserLite[]>;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState<TaskUpsert["status"]>(initial.status ?? "todo");
  const [due, setDue] = useState(initial.due_date ?? "");
  const [projectId, setProjectId] = useState(initial.project_id ?? "");
  const [teamId, setTeamId] = useState<string | null>(initial.team_id ?? null);
  const [assignees, setAssignees] = useState<string[]>(initial.assignee_ids ?? []);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<UserLite[]>([]);

  useEffect(() => {
    let active = true;
    loadProjects().then((rows) => active && setProjects(rows));
    loadTeams().then((rows) => active && setTeams(rows));
    return () => {
      active = false;
    };
  }, [loadProjects, loadTeams]);

  useEffect(() => {
    let active = true;
    loadMembersByTeam(teamId).then((rows) => active && setMembers(rows));
    setAssignees([]);
    return () => {
      active = false;
    };
  }, [teamId, loadMembersByTeam]);

  useEffect(() => {
    const p = projects.find((p) => p.id === projectId);
    if (p?.team_id) setTeamId(p.team_id);
  }, [projectId, projects]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...(initial?.id ? { id: initial.id } : {}),
      title,
      description: description || null,
      status: status || "todo",
      due_date: due || null,
      project_id: projectId,
      team_id: teamId ?? null,
      assignee_ids: assignees,
    };

    await onSubmit(payload as any);
  }

  function toggleUser(id: string) {
    setAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-3xl">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <select className="border rounded-xl px-3 py-2" value={status ?? "todo"} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="todo">todo</option>
          <option value="doing">doing</option>
          <option value="done">done</option>
        </select>
        <input className="border rounded-xl px-3 py-2" type="date" value={due || ""} onChange={(e) => setDue(e.target.value)} />
      </div>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Project</span>
        <select
          className="border rounded-xl px-3 py-2 w-80"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
        >
          <option value="" disabled>
            Select project…
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Assign team</span>
        <select className="border rounded-xl px-3 py-2 w-80" value={teamId ?? ""} onChange={(e) => setTeamId(e.target.value || null)}>
          <option value="">No team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-1">
        <span className="text-sm opacity-80">Assign members</span>
        <div className="border rounded-xl max-h-44 overflow-auto">
          {members.map((m) => {
            const checked = assignees.includes(m.id);
            return (
              <label key={m.id} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0">
                <input type="checkbox" checked={checked} onChange={() => toggleUser(m.id)} />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs opacity-70">{m.email}</div>
                </div>
              </label>
            );
          })}
          {members.length === 0 && <div className="text-sm opacity-70 p-3">Pick a team to list members.</div>}
        </div>
      </div>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Description</span>
        <textarea className="border rounded-xl px-3 py-2" rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <div className="flex gap-2">
        <button type="submit" className="rounded-2xl px-4 py-2 shadow border text-sm bg-black text-white">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-2xl px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

function today(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
