import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoleGate } from "@/lib/RoleGate";
import { useAuth } from "@/app/useAuth";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

type DbProjectRow = Database["api"]["Views"]["projects"]["Row"];
type DbTaskRow    = Database["api"]["Views"]["tasks"]["Row"];
type TaskUpsertArgs = Database["api"]["Functions"]["task_upsert"]["Args"];
type Project = { id: string; name: string; description?: string | null; team_id: string | null; org_id?: string | null };
type Task    = { id: string; title: string; description: string | null; status: "todo" | "doing" | "done"; due_date: string | null; assignee_id: string | null; team_id: string | null; project_id: string };

const toDB = (s: "todo" | "doing" | "done"): "todo" | "in_progress" | "done" => (s === "doing" ? "in_progress" : s);
const fromDB = (s: "todo" | "in_progress" | "done"): "todo" | "doing" | "done" => (s === "in_progress" ? "doing" : s);

const notNull = <T,>(x: T | null | undefined): x is T => x != null;

export default function ProjectDetailsPage() {
  const nav = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const orgId  = (user as any)?.user_metadata?.org_id as string | null;
  const userId = user?.id ?? null;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [q, setQ] = useState("");

  // nullable view row mapping
  const toSafeProject = (p: DbProjectRow): Project | null => {
    if (!p?.id || !p?.name) return null;
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      team_id: p.team_id ?? null,
      org_id: p.org_id ?? null,
    };
  };

  const toSafeTask = (t: DbTaskRow): Task | null => {
    if (!t?.id || !t?.title || !t?.project_id) return null;
    return {
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      status: fromDB((t.status ?? "todo") as "todo" | "in_progress" | "done"),
      due_date: t.due_date ?? null,
      assignee_id: t.assignee_id ?? null,
      team_id: (t as any).team_id ?? null,
      project_id: t.project_id,
    };
  };

  // Load project e tasks
  useEffect(() => {
    let active = true;
    (async () => {
      if (!orgId || !projectId) {
        setProject(null);
        setTasks([]);
        setLoading(false);
        return;
      }

      const [projRes, tasksRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, description, team_id, org_id")
          .eq("org_id", orgId)
          .eq("id", projectId)
          .maybeSingle(),
        supabase
          .from("tasks")
          .select("id, title, description, status, due_date, assignee_id, team_id, project_id, org_id")
          .eq("org_id", orgId)
          .eq("project_id", projectId)
          .order("due_date", { ascending: true }),
      ]);

      if (!active) return;
      if (projRes.error) throw projRes.error;
      if (tasksRes.error) throw tasksRes.error;

      const p = projRes.data ? toSafeProject(projRes.data as DbProjectRow) : null;
      const ts = (tasksRes.data ?? []).map(r => toSafeTask(r as DbTaskRow)).filter(notNull);

      setProject(p);
      setTasks(ts);
      setLoading(false);
    })().catch(err => {
      console.error("[ProjectDetails] load error", err);
      setProject(null);
      setTasks([]);
      setLoading(false);
    });

    return () => { active = false; };
  }, [orgId, projectId]);

  const filteredTasks = useMemo(() => {
    const needles = q.trim().toLowerCase();
    if (!needles) return tasks;
    return tasks.filter(t =>
      t.title.toLowerCase().includes(needles)
      || (t.status ?? "").toLowerCase().includes(needles)
    );
  }, [tasks, q]);

  // CRUD de projects

  const saveProject = useCallback(async (v: { id?: string; name: string; description?: string | null; team_id: string | null }) => {
    if (!orgId) throw new Error("orgId is null");
    const args = {
      _org_id: orgId!,
      _name: v.name,
      ...(v.id       ? { _id: v.id } : {}),
      ...(v.team_id  ? { _team_id: v.team_id } : {}),
      ...(v.description ? { _description: v.description } : {}),
    } satisfies Database["api"]["Functions"]["project_upsert"]["Args"];

    const { data, error } = await supabase.rpc("project_upsert", args);
    if (error) throw error;

    const row = data ? toSafeProject(data as DbProjectRow) : null;
    if (row) setProject(row);
    setEditingProj(null);
  }, [orgId]);

  const removeProject = useCallback(async () => {
    if (!project?.id) return;
    const { error } = await supabase.rpc("project_delete", { _id: project.id });
    if (error) throw error;
    nav("/projects");
  }, [project?.id, nav]);

  const createTask = useCallback(async (v: {
    title: string;
    description?: string | null;
    status?: "todo" | "doing" | "done";
    due_date?: string | null;
    assignee_id?: string | null;
    }) => {
    if (!orgId || !project) throw new Error("Missing org or project");

    const args = {
      _org_id: orgId,
      _project_id: project.id,
      _title: v.title,
      _status: toDB(v.status ?? "todo"),
      ...(v.assignee_id != null ? { _assignee_id: v.assignee_id } : {}),
      ...(v.due_date    != null ? { _due_date: v.due_date }       : {}),
      ...(v.description !== undefined ? { _description: v.description ?? "" } : {}),
      ...(project.team_id ? { _team_id: project.team_id } : {}),
    } as TaskUpsertArgs;

    const { data, error } = await supabase.rpc("task_upsert", args);
    if (error) throw error;

    const row = data ? toSafeTask(data as DbTaskRow) : null;
    if (row) setTasks(prev => [row, ...prev]);
    setCreatingTask(false);
  }, [orgId, project]);


  const updateTask = useCallback(async (id: string, patch: Partial<Omit<Task, "id" | "project_id">>) => {
    if (!orgId || !project) throw new Error("Missing org or project");
    const current = tasks.find(t => t.id === id);
    if (!current) return;

    const args = {
      _org_id: orgId,
      _project_id: project.id,
      _title: patch.title ?? current.title,
      _status: toDB(patch.status ?? current.status),
      ...(patch.assignee_id != null ? { _assignee_id: patch.assignee_id } : {}),
      ...(patch.due_date != null ? { _due_date: patch.due_date } : {}),
      ...(patch.description !== undefined ? { _description: patch.description ?? "" } : {}),
      ...(project.team_id ? { _team_id: project.team_id } : {}),
      ...(id ? { _id: id } : {}),
    } as TaskUpsertArgs;

    const { data, error } = await supabase.rpc("task_upsert", args);
    if (error) throw error;

    const row = data ? toSafeTask(data as DbTaskRow) : null;
    if (row) setTasks(prev => prev.map(t => (t.id === id ? row : t)));
  }, [orgId, project, tasks]);


  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.rpc("task_delete", { _id: id });
    if (error) throw error;
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  if (loading) {
    return <div className="mx-auto w-full max-w-4xl px-4 py-6">Loading…</div>;
  }

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 grid gap-3">
        <div className="text-lg font-semibold">Project not found</div>
        <button className="btn" onClick={() => nav("/projects")}>Back to projects</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="grid">
          <div className="text-xl font-semibold">{project.name}</div>
          {project.description && <div className="text-sm text-muted">{project.description}</div>}
          <div className="text-xs text-muted mt-1">
            Team: {project.team_id ? project.team_id : "—"}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => nav("/projects")}>Back</button>
          <RoleGate required="admin">
            <button className="btn" onClick={() => setEditingProj(project)}>Edit</button>
            <button className="btn text-red-600" onClick={removeProject}>Delete</button>
          </RoleGate>
        </div>
      </div>

      {/* Search e Create Task */}
      <div className="flex items-center justify-between">
        <input
          className="input w-72"
          placeholder="Filter tasks"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <RoleGate required="admin">
          <button className="btn btn-primary" onClick={() => setCreatingTask(true)}>+ Task</button>
        </RoleGate>
      </div>

      {/* Tasks */}
      <section className="grid gap-3">
        {filteredTasks.length === 0 ? (
          <div className="card p-4 text-sm text-muted">No tasks found.</div>
        ) : (
          filteredTasks.map(t => (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted">
                  Status: {t.status} {t.due_date ? `• due ${t.due_date}` : ""}
                </div>
              </div>
              <RoleGate required="admin">
                <div className="flex gap-2">
                  <button className="btn" onClick={() => updateTask(t.id, { status: t.status === "done" ? "todo" : "done" })}>
                    Mark {t.status === "done" ? "Todo" : "Done"}
                  </button>
                  <button className="btn" onClick={() => updateTask(t.id, { title: t.title })}>Edit</button>
                  <button className="btn text-red-600" onClick={() => deleteTask(t.id)}>Delete</button>
                </div>
              </RoleGate>
            </div>
          ))
        )}
      </section>

      {/* Edit Projectcard */}
      <RoleGate required="admin">
        {editingProj && (
          <div className="card p-4">
            <div className="text-sm text-muted mb-2">{editingProj.id ? "Edit Project" : "Create Project"}</div>
            <ProjectForm
              initial={editingProj}
              onSubmit={saveProject}
              onCancel={() => setEditingProj(null)}
              submitLabel={editingProj.id ? "Save changes" : "Create"}
            />
          </div>
        )}
      </RoleGate>

      {/* Create Taskcard */}
      <RoleGate required="admin">
        {creatingTask && (
          <div className="card p-4">
            <div className="text-sm text-muted mb-2">Create Task</div>
            <TaskForm
              onSubmit={createTask}
              onCancel={() => setCreatingTask(false)}
              defaultStatus="todo"
            />
          </div>
        )}
      </RoleGate>
    </div>
  );
}

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: { id?: string; name: string; description?: string | null; team_id: string | null };
  onSubmit: (v: { id?: string; name: string; description?: string | null; team_id: string | null }) => Promise<void> | void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [desc, setDesc] = useState(initial.description ?? "");
  const [teamId, setTeamId] = useState<string | "">(initial.team_id ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      ...(initial?.id ? { id: initial.id } : {}),
      name,
      description: desc || null,
      team_id: (teamId as string) || null,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Description</span>
        <textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Team (optional)</span>
        <input className="input" placeholder="team_id" value={teamId} onChange={(e) => setTeamId(e.target.value)} />
      </label>
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" type="submit">{submitLabel}</button>
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function TaskForm({
  onSubmit,
  onCancel,
  defaultStatus = "todo",
}: {
  onSubmit: (v: { title: string; description?: string | null; status?: "todo" | "doing" | "done"; due_date?: string | null; assignee_id?: string | null }) => Promise<void> | void;
  onCancel: () => void;
  defaultStatus?: "todo" | "doing" | "done";
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState<"todo" | "doing" | "done">(defaultStatus);
  const [due, setDue] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title,
      description: desc || null,
      status,
      due_date: due || null,
      assignee_id: null,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Title</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Status</span>
        <select className="select w-44" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="todo">todo</option>
          <option value="doing">doing</option>
          <option value="done">done</option>
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Due date</span>
        <input className="input w-44" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Description</span>
        <textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
      </label>

      <div className="flex items-center gap-2">
        <button className="btn btn-primary" type="submit">Create</button>
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
