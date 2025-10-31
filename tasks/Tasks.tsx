import { useMemo, useState, useCallback, useEffect } from "react";
import { RoleGate } from "@/lib/RoleGate";
import { useAuth } from "@/app/useAuth";
import { supabase } from "@/lib/supabase";
import {
  useTasksAll,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  loadProjects,
  loadTeams,
  loadMembersByTeam,
  type Task,
} from "@/features/tasks/hooks/useTasks";
import { TaskFormCard } from "@/features/tasks/TaskFormCard";

export default function TasksPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [orgId, setOrgId] = useState<string | null>(null);
  const { data: tasks = [] } = useTasksAll(orgId);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Task> | null>(null);

  const createTask = useCreateTask(orgId);
  const updateTask = useUpdateTask(orgId);
  const deleteTask = useDeleteTask(orgId);

  // Buscar o org_id do perfil do usuário
  useEffect(() => {
    if (!userId) {
      setOrgId(null);
      return;
    }

    const fetchOrgId = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Erro ao buscar org_id:', error);
          return;
        }

        console.log('Profile data:', data);
        setOrgId(data?.org_id);
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      }
    };

    fetchOrgId();
  }, [userId]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return tasks;
    return tasks.filter((t : Task)=>
      t.title.toLowerCase().includes(needle) ||
      (t.description ?? "").toLowerCase().includes(needle) ||
      (t.status ?? "").toLowerCase().includes(needle)
    );
  }, [tasks, q]);

  type SubmitPayload = {
    id?: string;
    title: string;
    description?: string | null;
    status?: Task["status"];
    due_date?: string | null;
    project_id: string;
    team_id?: string | null;
    assignee_id?: string | null;
  };

  const handleSubmit = useCallback(async (v: SubmitPayload) => {
    if (v.id) {
      // UPDATE
      await updateTask.mutateAsync({
        id: v.id,
        project_id: v.project_id,
        ...(v.title ? { title: v.title } : {}),
        ...(v.status ? { status: v.status } : {}),
        ...(v.description !== undefined ? { description: v.description ?? "" } : {}),
        ...(v.due_date != null ? { due_date: v.due_date } : {}),
        ...(v.team_id ? { team_id: v.team_id } : {}),
        ...(v.assignee_id ? { assignee_id: v.assignee_id } : {}),
      });
    } else {
      // CREATE
      await createTask.mutateAsync({
        title: v.title,
        project_id: v.project_id,
        ...(v.status ? { status: v.status } : {}),
        ...(v.description !== undefined ? { description: v.description ?? "" } : {}),
        ...(v.due_date != null ? { due_date: v.due_date } : {}),
        ...(v.team_id ? { team_id: v.team_id } : {}),
        ...(v.assignee_id ? { assignee_id: v.assignee_id } : {}),
      });
    }
    setEditing(null);
  }, [createTask, updateTask]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks</h1>
        <div className="flex items-center gap-2">
          <input className="input w-72" placeholder="Search tasks" value={q} onChange={e => setQ(e.target.value)} />
          <RoleGate required="admin">
            <button className="btn btn-primary" onClick={() => setEditing({ title: "", description: "", status: "todo" })}>
              + Create
            </button>
          </RoleGate>
        </div>
      </div>

      <section className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="card p-4 text-sm text-muted">No tasks found.</div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-muted">
                  {t.status} {t.due_date ? `• due ${t.due_date}` : ""} {t.team_id ? `• team ${t.team_id}` : ""}
                </div>
                {t.description && <div className="text-sm text-muted mt-1">{t.description}</div>}
              </div>
              <RoleGate required="admin">
                <div className="flex gap-2">
                  <button className="btn" onClick={() => setEditing(t)}>Edit</button>
                  <button className="btn text-red-600" onClick={() => deleteTask.mutate(t.id)}>Delete</button>
                </div>
              </RoleGate>
            </div>
          ))
        )}
      </section>

      <RoleGate required="admin">
        {editing && (
          <div className="card p-4">
            <div className="text-sm opacity-75 mb-2">{editing.id ? "Edit Task" : "Create Task"}</div>
            <TaskFormCard
              initial={{
                ...(editing.id ? { id: editing.id } : {}),
                title: editing.title ?? "",
                description: editing.description ?? "",
                status: editing.status ?? "todo",
                due_date: editing.due_date ?? "",
                project_id: editing.project_id ?? "",
                team_id: editing.team_id ?? "",
                assignee_id: editing.assignee_id ?? "",
              }}
              loadProjects={() => loadProjects(orgId)}
              loadTeams={() => loadTeams(orgId)}
              loadMembersByTeam={(tid) => loadMembersByTeam(orgId, tid)}
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
