import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/app/AuthProvider";
import { RoleGate } from "@/lib/RoleGate";
import { useTeams, useMyTeams, useCreateTeam, useUpdateTeam, useDeleteTeam, type Team } from "./hooks/useTeam";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is too short"),
  description: z.string().max(300).optional().nullable(),
});

const { register, handleSubmit, reset, formState } = useForm<FormValues>({
  resolver: zodResolver(schema),
});

type FormValues = z.infer<typeof schema>;

export default function TeamsPage() {
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? null;
  const { data: allTeams, isLoading: loadingAll, error: errorAll } = useTeams();
  const { data: myTeams, isLoading: loadingMine, error: errorMine } = useMyTeams(userId);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const [editing, setEditing] = useState<Team | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function startCreate() {
    setEditing(null);
    reset({ name: "", description: "" });
  }

  function startEdit(team: Team) {
    setEditing(team);
    reset({ id: team.id, name: team.name, description: team.description ?? "" });
  }

  async function onSubmit(values: FormValues) {
    if (editing) {
      await updateTeam.mutateAsync({ id: editing.id, name: values.name, description: values.description ?? null });
    } else {
      await createTeam.mutateAsync({ name: values.name, description: values.description ?? null });
    }
    reset({ name: "", description: "" });
    setEditing(null);
  }

  async function onDelete(id: string) {
    if (confirm("Delete this team? This cannot be undone.")) {
      await deleteTeam.mutateAsync(id);
    }
  }

  const otherTeams = (allTeams ?? []).filter((t : any) => !(myTeams ?? []).some((m : any)=> m.id === t.id));

  return (
    <div className="p-4 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teams</h1>
        <RoleGate required="admin">
          <button
            onClick={startCreate}
            className="rounded-2xl px-4 py-2 shadow border text-sm hover:opacity-90"
          >
            ➕ Create Team
          </button>
        </RoleGate>
      </header>

      {/* Admin Create/Edit Drawer */}
      <RoleGate required="admin">
        <details open={!!editing} className="bg-white/70 rounded-2xl shadow p-4">
          <summary className="cursor-pointer select-none text-sm opacity-75">{editing ? "Edit Team" : "Create Team"}</summary>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-3 grid gap-3 max-w-lg">
            <input hidden {...register("id")} />
            <label className="grid gap-1">
              <span className="text-sm opacity-80">Name</span>
              <input className="border rounded-xl px-3 py-2" placeholder="Engineering" {...register("name")} />
              {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
            </label>
            <label className="grid gap-1">
              <span className="text-sm opacity-80">Description</span>
              <textarea className="border rounded-xl px-3 py-2" rows={3} placeholder="What this team does" {...register("description")} />
              {errors.description && <span className="text-xs text-red-600">{errors.description.message}</span>}
            </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || createTeam.isPending || updateTeam.isPending}
                  className="rounded-2xl px-4 py-2 shadow border text-sm"
                >
                  {editing ? "Save changes" : "Create"}
                </button>
                {editing && (
                  <button type="button" onClick={() => setEditing(null)} className="rounded-2xl px-4 py-2 text-sm">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </details>
        </RoleGate>
        
        {/* My Teams */}
        
        <section>
          <h2 className="text-lg font-medium mb-2">My Teams</h2>
          {loadingMine ? (
            <p className="opacity-60 text-sm">Loading…</p>
          ) : errorMine ? (
            <p className="text-red-600 text-sm">{String(errorMine)}</p>
          ) : (myTeams?.length ? (
            <ul className="grid gap-2">
              {myTeams!.map((t : any) => (
                <TeamRow key={t.id} team={t} onEdit={startEdit} onDelete={onDelete} isAdmin={!!profile?.is_admin} />
              ))}
            </ul>
          ) : (
            <p className="opacity-60 text-sm">You are not a member of any team yet.</p>
          ))}
        </section>

        {/* Other Teams */}
        <section>
          <h2 className="text-lg font-medium mb-2">Other Teams</h2>
          {loadingAll ? (
            <p className="opacity-60 text-sm">Loading…</p>
          ) : errorAll ? (
            <p className="text-red-600 text-sm">{String(errorAll)}</p>
          ) : (otherTeams.length ? (
            <ul className="grid gap-2">
            {otherTeams.map((t : any) => (
              <TeamRow key={t.id} team={t} onEdit={startEdit} onDelete={onDelete} isAdmin={!!profile?.is_admin} />
            ))}
          </ul>
        ) : (
          <p className="opacity-60 text-sm">No other teams found.</p>
        ))}
      </section>
    </div>
  );
}

function TeamRow({ team, onEdit, onDelete, isAdmin }: { team: Team; onEdit: (t: Team) => void; onDelete: (id: string) => void; isAdmin: boolean }) {
  return (
    <li className="border rounded-2xl p-3 flex items-center justify-between">
      <div>
        <div className="font-medium">{team.name}</div>
        {team.description && <div className="text-sm opacity-70">{team.description}</div>}
      </div>
      {isAdmin && (
        <div className="flex gap-2">
          <button className="text-sm px-3 py-1 rounded-xl border" onClick={() => onEdit(team)}>
            ✏️ Edit
          </button>
          <button className="text-sm px-3 py-1 rounded-xl border" onClick={() => onDelete(team.id)}>
            🗑 Delete
          </button>
        </div>
      )}
    </li>
  );
}