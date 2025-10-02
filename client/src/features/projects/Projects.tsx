import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoleGate } from "@/lib/RoleGate";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  type Project,
} from "./hooks/useProjects";

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name too short"),
  description: z.string().max(300).optional().nullable(),
  team_id: z.string().optional().nullable(),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects();
  const createMut = useCreateProject();
  const updateMut = useUpdateProject();
  const deleteMut = useDeleteProject();

  const [editing, setEditing] = useState<Project | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectForm>({ resolver: zodResolver(projectSchema) });

  function startCreate() {
    setEditing(null);
    reset({ name: "", description: "", team_id: undefined });
  }

  function startEdit(p: Project) {
    setEditing(p);
    reset({ id: p.id, name: p.name, description: p.description ?? "", team_id: p.team_id ?? undefined });
  }

  async function onSubmit(values: ProjectForm) {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, name: values.name, description: values.description ?? null, team_id: values.team_id ?? null });
    } else {
      await createMut.mutateAsync({ name: values.name, description: values.description ?? null, team_id: values.team_id ?? null });
    }
    setEditing(null);
    reset({ name: "", description: "", team_id: undefined });
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <RoleGate required="admin">
          <button onClick={startCreate} className="rounded-2xl px-4 py-2 shadow border text-sm">➕ New Project</button>
        </RoleGate>
      </header>

      {/* Admin Create/Edit */}
      <RoleGate required="admin">
        {(editing !== null) && (
          <div className="bg-white/70 rounded-2xl shadow p-4">
            <div className="text-sm opacity-75 mb-2">{editing ? "Edit Project" : "Create Project"}</div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 max-w-lg">
              <input hidden {...register("id")} />
              <label className="grid gap-1">
                <span className="text-sm opacity-80">Name</span>
                <input className="border rounded-xl px-3 py-2" {...register("name")} />
                {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
              </label>
              <label className="grid gap-1">
                <span className="text-sm opacity-80">Description</span>
                <textarea className="border rounded-xl px-3 py-2" rows={3} {...register("description")} />
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
          {(projects ?? []).map((p) => (
            <li key={p.id} className="border rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-sm opacity-70">{p.description}</div>}
              </div>
              <RoleGate required="admin">
                <div className="flex gap-2">
                  <button className="text-sm px-3 py-1 rounded-xl border" onClick={() => startEdit(p)}>✏️ Edit</button>
                  <button className="text-sm px-3 py-1 rounded-xl border" onClick={() => deleteMut.mutate(p.id)}>🗑 Delete</button>
                </div>
              </RoleGate>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
