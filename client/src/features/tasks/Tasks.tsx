import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoleGate } from "@/lib/RoleGate";
import { useAuth } from "@/app/AuthProvider";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  type Task,
} from "./hooks/useTasks";

const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Title too short"),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "doing", "done"]).optional().nullable(),
  due_date: z.string().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
  project_id: z.string(),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function TasksPage() {
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useTasks();
  const createMut = useCreateTask();
  const updateMut = useUpdateTask();
  const deleteMut = useDeleteTask();

  const [editing, setEditing] = useState<Task | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskForm>({ resolver: zodResolver(taskSchema) });

  function startCreate() {
    setEditing(null);
    reset({ title: "", project_id: "", assignee_id: user?.id ?? "" });
  }

  function startEdit(t: Task) {
    setEditing(t);
    reset({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      status: (t.status as any) ?? "todo",
      due_date: t.due_date ?? "",
      assignee_id: t.assignee_id ?? user?.id ?? "",
      project_id: t.project_id,
    });
  }
  function normalize(v: TaskForm) {
    return {
      title: v.title,
      description: v.description ?? null,
      status: v.status ?? null,
      due_date: v.due_date ?? null,
      assignee_id: v.assignee_id ?? null,
      project_id: v.project_id,
    };
  }

  async function onSubmit(values: TaskForm) {
    if (editing) {
      const patch = normalize(values);
      await updateMut.mutateAsync({ id: editing.id, ...patch });
    } else {
      await createMut.mutateAsync(normalize(values) as any);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <RoleGate required="admin">
          <button onClick={startCreate} className="rounded-2xl px-4 py-2 shadow border text-sm">➕ New Task</button>
        </RoleGate>
      </header>

      {/* Admin Create/Edit */}
      <RoleGate required="admin">
        {(editing !== null) && (
          <div className="bg-white/70 rounded-2xl shadow p-4">
            <div className="text-sm opacity-75 mb-2">{editing ? "Edit Task" : "Create Task"}</div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 max-w-lg">
              <input hidden {...register("id")} />
              <label className="grid gap-1">
                <span className="text-sm opacity-80">Title</span>
                <input className="border rounded-xl px-3 py-2" {...register("title")} />
                {errors.title && <span className="text-xs text-red-600">{errors.title.message}</span>}
              </label>
              <label className="grid gap-1">
                <span className="text-sm opacity-80">Project Id</span>
                <input className="border rounded-xl px-3 py-2" {...register("project_id")} />
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={isSubmitting || createMut.isPending || updateMut.isPending} className="rounded-2xl px-4 py-2 shadow border text-sm">
                  {editing ? "Save changes" : "Create"}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="rounded-2xl px-4 py-2 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </RoleGate>

      {/* List */}
      {isLoading ? (
        <p className="opacity-60 text-sm">Loading…</p>
      ) : error ? (
        <p className="text-red-600 text-sm">{String(error)}</p>
      ) : (
        <ul className="grid gap-2">
          {(tasks ?? []).map((t) => (
            <li key={t.id} className="border rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.title}</div>
                {t.description && <div className="text-sm opacity-70">{t.description}</div>}
              </div>
              <RoleGate required="admin">
                <div className="flex gap-2">
                  <button className="text-sm px-3 py-1 rounded-xl border" onClick={() => startEdit(t)}>✏️ Edit</button>
                  <button className="text-sm px-3 py-1 rounded-xl border" onClick={() => deleteMut.mutate(t.id)}>🗑 Delete</button>
                </div>
              </RoleGate>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
