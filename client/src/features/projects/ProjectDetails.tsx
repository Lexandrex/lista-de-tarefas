import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoleGate } from "@/lib/RoleGate";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  team_ids: string[];
};
type Team = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  project_id: string;
  team_id: string | null;
  due_date?: string | null;
  description?: string | null;
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [orgTeams, setOrgTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingAddTeamId, setPendingAddTeamId] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    if (!id) return;
    setProject({
      id,
      name: "project1",
      description: "desc",
      team_ids: ["t1"],
    });
    setOrgTeams([
      { id: "t1", name: "name1" },
      { id: "t2", name: "name2" },
      { id: "t3", name: "name3" },
    ]);
    setTasks([
      { id: "ta1", title: "act1", status: "doing", project_id: id, team_id: "t1" },
      { id: "ta2", title: "act2", status: "todo", project_id: id, team_id: "t1" },
      { id: "ta3", title: "act3", status: "todo", project_id: id, team_id: null },
    ]);
  }, [id]);

  const linkedTeams = useMemo(
    () => orgTeams.filter((t) => (project?.team_ids ?? []).includes(t.id)),
    [orgTeams, project?.team_ids]
  );
  const unlinkedTeams = useMemo(
    () => orgTeams.filter((t) => !(project?.team_ids ?? []).includes(t.id)),
    [orgTeams, project?.team_ids]
  );

  const projectId = project?.id ?? null;
  async function saveBasics(next: { name: string; description: string | null }) {
    if (!project) return;
    setProject({ ...project, ...next });
  }

  async function linkTeam(teamId: string) {
    if (!project || !teamId) return;
    setProject((p) => (p ? { ...p, team_ids: Array.from(new Set([...p.team_ids, teamId])) } : p));
    setPendingAddTeamId("");
  }

  async function unlinkTeam(teamId: string) {
    if (!project) return;
    setProject((p) => (p ? { ...p, team_ids: p.team_ids.filter((x) => x !== teamId) } : p));
    setTasks((prev) => prev.map((t) => (t.team_id === teamId ? { ...t, team_id: null } : t)));
  }

  async function assignTaskToTeam(taskId: string, teamId: string | null) {
    if (!projectId) return;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, team_id: teamId } : t)));
  }

  async function createTask(v: {
    title: string;
    status: "todo" | "doing" | "done";
    due_date?: string | null;
    team_id: string | null;
    description?: string | null;
  }) {
    if (!projectId) return;
    setTasks((prev) => [
      {
        id: "ta" + Math.random().toString(36).slice(2, 8),
        title: v.title,
        status: v.status,
        due_date: v.due_date ?? null,
        description: v.description ?? null,
        project_id: projectId,
        team_id: v.team_id,
      },
      ...prev,
    ]);
    setShowAddTask(false);
  }

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-6">
        <div className="card p-4">Loading project…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-6">
      <div className="flex items-center justify-between">
        <button className="btn" onClick={() => nav(-1)}>
          ← Back
        </button>
        <div className="text-xl font-semibold">Project details</div>
        <div />
      </div>
      <div className="card p-4 grid gap-3">
        <div className="text-sm text-muted">Basics</div>
        <EditableBasics
          initial={{ name: project.name, description: project.description ?? "" }}
          onSave={(v) => saveBasics({ ...v, description: v.description || null })}
        />
      </div>
      <div className="card p-4 grid gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">Teams linked to this project</div>
          <RoleGate required="admin">
            <div className="flex items-center gap-2">
              <select
                className="select"
                value={pendingAddTeamId}
                onChange={(e) => setPendingAddTeamId(e.target.value)}
              >
                <option value="">Add team…</option>
                {unlinkedTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => linkTeam(pendingAddTeamId)}
                disabled={!pendingAddTeamId}
              >
                Add
              </button>
            </div>
          </RoleGate>
        </div>
        <div className="grid gap-3">
          {linkedTeams.map((team) => {
            const teamTasks = tasks.filter((t) => t.team_id === team.id);
            const assignable = tasks.filter((t) => t.project_id === project.id && t.team_id !== team.id);
            return (
              <div key={team.id} className="border rounded-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{team.name}</div>
                  <RoleGate required="admin">
                    <button className="btn text-red-600" onClick={() => unlinkTeam(team.id)}>
                      Remove team
                    </button>
                  </RoleGate>
                </div>

                <div className="text-sm text-muted mb-2">
                  {teamTasks.length ? `${teamTasks.length} task(s) assigned` : "No tasks assigned to this team yet."}
                </div>

                <ul className="grid gap-1">
                  {teamTasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between border rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <StatusPill status={t.status} />
                        <span>{t.title}</span>
                      </div>
                      <RoleGate required="admin">
                        <button className="btn text-red-600" onClick={() => assignTaskToTeam(t.id, null)}>
                          Remove
                        </button>
                      </RoleGate>
                    </li>
                  ))}
                </ul>

                <RoleGate required="admin">
                  <AssignTaskRow
                    tasks={assignable}
                    onAssign={(taskId) => assignTaskToTeam(taskId, team.id)}
                    emptyText="No available tasks to assign."
                  />
                </RoleGate>
              </div>
            );
          })}

          {linkedTeams.length === 0 && (
            <div className="text-sm text-muted">No teams linked. Use “Add team…” above.</div>
          )}
        </div>
      </div>
      <div className="card p-4 grid gap-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">Tasks in this project</div>
          <RoleGate required="admin">
            <button className="btn btn-primary" onClick={() => setShowAddTask(true)}>
              + Add Task
            </button>
          </RoleGate>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left font-semibold p-3 border-b">Title</th>
              <th className="text-left font-semibold p-3 border-b">Status</th>
              <th className="text-left font-semibold p-3 border-b">Team</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td className="p-3 border-b">{t.title}</td>
                <td className="p-3 border-b">
                  <StatusPill status={t.status} />
                </td>
                <td className="p-3 border-b">
                  {t.team_id ? orgTeams.find((x) => x.id === t.team_id)?.name : "—"}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td className="p-3 text-sm text-muted" colSpan={3}>
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddTask && (
        <Modal onClose={() => setShowAddTask(false)}>
          <AddTaskForm
            teamOptions={linkedTeams}
            onCancel={() => setShowAddTask(false)}
            onCreate={createTask}
          />
        </Modal>
      )}
    </div>
  );
}

function EditableBasics({
  initial,
  onSave,
}: {
  initial: { name: string; description: string };
  onSave: (v: { name: string; description: string }) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSave({ name, description });
      }}
      className="grid gap-3 max-w-xl"
    >
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Description</span>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div>
        <button className="btn btn-primary" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}

function StatusPill({ status }: { status: "todo" | "doing" | "done" }) {
  const map = {
    todo: "bg-yellow-50 text-yellow-800 border-yellow-200",
    doing: "bg-blue-50 text-blue-800 border-blue-200",
    done: "bg-green-50 text-green-800 border-green-200",
  } as const;
  return <span className={`px-2 py-0.5 rounded-full border text-xs ${map[status]}`}>{status}</span>;
}

function AssignTaskRow({
  tasks,
  onAssign,
  emptyText,
}: {
  tasks: Task[];
  onAssign: (taskId: string) => void;
  emptyText?: string;
}) {
  const [sel, setSel] = useState("");
  if (tasks.length === 0) return <div className="text-sm text-muted mt-2">{emptyText || "No tasks"}</div>;
  return (
    <div className="flex items-center gap-2 mt-3">
      <select className="select" value={sel} onChange={(e) => setSel(e.target.value)}>
        <option value="">Assign existing task…</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
      <button
        className="btn btn-primary"
        disabled={!sel}
        onClick={() => {
          onAssign(sel);
          setSel("");
        }}
      >
        Assign
      </button>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">New Task</div>
            <button className="btn" onClick={onClose}>
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function AddTaskForm({
  teamOptions,
  onCreate,
  onCancel,
}: {
  teamOptions: Team[];
  onCreate: (v: {
    title: string;
    status: "todo" | "doing" | "done";
    due_date?: string | null;
    team_id: string | null;
    description?: string | null;
  }) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"todo" | "doing" | "done">("todo");
  const [due, setDue] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [desc, setDesc] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onCreate({
      title,
      status,
      due_date: due || null,
      team_id: teamId || null,
      description: desc || null,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Title</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <div className="grid grid-cols-3 gap-2">
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Status</span>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="todo">todo</option>
            <option value="doing">doing</option>
            <option value="done">done</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Due date</span>
          <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Assign to team</span>
          <select className="select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">No team</option>
            {teamOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Description</span>
        <textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </label>

      <div className="flex items-center gap-2">
        <button className="btn btn-primary" type="submit">
          Create
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
