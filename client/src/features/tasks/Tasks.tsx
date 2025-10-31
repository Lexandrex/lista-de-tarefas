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
  const orgId = (user as any)?.user_metadata?.org_id as string | null;
  const { data: tasks = [] } = useTasksAll(orgId);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Task> | null>(null);
  const [teamNameById, setTeamNameById] = useState<Record<string, string>>({});
  const createTask = useCreateTask(orgId);
  const updateTask = useUpdateTask(orgId);
  const deleteTask = useDeleteTask(orgId);

  
  // mapa team_id
  useEffect(() => {
    let active = true;
    (async () => {
      if (!orgId) { setTeamNameById({}); return; }
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, org_id")
        .eq("org_id", orgId as string);
      if (error) { console.error("[Tasks] load teams for name map", error); return; }
      if (!active) return;
      const map: Record<string, string> = Object.fromEntries((data ?? []).map((r: any) => [r.id, r.name]));
      setTeamNameById(map);
    })().catch(err => console.error("[Tasks] team map error", err));
    return () => { active = false; };
  }, [orgId]);
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
        <h1 className="text-xl font-semibold">Tarefas</h1>
        <div className="flex items-center gap-2">
          <input className="input w-72" placeholder="Procurar por tarefas" value={q} onChange={e => setQ(e.target.value)} />
          <RoleGate required="admin">
            <button className="btn btn-primary" onClick={() => setEditing({ title: "", description: "", status: "todo" })}>
              +Criar
            </button>
          </RoleGate>
        </div>
      </div>

      <section className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="card p-4 text-sm text-muted">Nenhuma tarefa encontrada.</div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.title}</div>
                <div className="text-xs text-muted">
                  {t.status} {t.due_date ? `• due ${t.due_date}` : ""} {t.team_id ? `• ${teamNameById[t.team_id] ?? t.team_id}` : ""}
                </div>
                {t.description && <div className="text-sm text-muted mt-1">{t.description}</div>}
              </div>
              <RoleGate required="admin">
                <div className="flex gap-2">
                  {t.status !== "done" ? (<button className="btn" onClick={() => setEditing(t)}>Editar</button>) : null}
                  
                </div>
              </RoleGate>
            </div>
          ))
        )}
      </section>

      <RoleGate required="admin">
        {editing && (
          <div className="card p-4">
            <div className="text-sm opacity-75 mb-2">{editing.id ? "Editar tarefa" : "Criar tarefas"}</div>
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
              submitLabel={editing.id ? "Salvar mudanças" : "Criar"}
            />
            {editing?.id && (
              <div className="mt-2">
                <button type="button" className="btn text-red-600"
                  onClick={() => { deleteTask.mutate(editing.id as string); setEditing(null); }}>
                  Deletar tarefa
                </button>
              </div>
            )}
          </div>
        )}
      </RoleGate>
    </div>
  );
}
