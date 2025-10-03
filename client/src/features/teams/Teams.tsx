import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RoleGate } from "@/lib/RoleGate";
import { useAuth } from "@/app/useAuth";
import {
  useTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  type Team,
} from "./hooks/useTeams";

const teamSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name too short"),
  description: z.string().max(300).optional().nullable(),
});

type TeamForm = z.infer<typeof teamSchema>;

export default function TeamsPage() {
  const { profile } = useAuth();
  const { data: teams, isLoading, error } = useTeams();
  const createMut = useCreateTeam();
  const updateMut = useUpdateTeam();
  const deleteMut = useDeleteTeam();

  const [editing, setEditing] = useState<Team | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamForm>({ resolver: zodResolver(teamSchema) });

  function startCreate() {
    setEditing(null);
    reset({ name: "", description: "" });
  }

  function startEdit(t: Team) {
    setEditing(t);
    reset({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
    });
  }

  const normalize = (v: TeamForm) => ({
    name: v.name,
    description: v.description ?? null,
  });

  async function onSubmit(values: TeamForm) {
    if (editing) {
      const { id: _drop, ...rest } = values;
      await updateMut.mutateAsync({ id: editing.id, ...normalize(rest as TeamForm) });
    } else {
      await createMut.mutateAsync(normalize(values) as any);
    }
    setEditing(null);
    reset({ name: "", description: "" });
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Teams</h1>
        <RoleGate required="admin">
          <button onClick={startCreate} style={btnStyle}>➕ New Team</button>
        </RoleGate>
      </header>
      <RoleGate required="admin">
        {editing !== null && (
          <div style={cardStyle}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              {editing ? "Edit Team" : "Create Team"}
            </div>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
              <input hidden {...register("id")} />
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Name</span>
                <input style={inputStyle} {...register("name")} />
                {errors.name && <span style={errStyle}>{errors.name.message}</span>}
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.75 }}>Description</span>
                <textarea rows={3} style={inputStyle} {...register("description")} />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  disabled={isSubmitting || createMut.isPending || updateMut.isPending}
                  style={btnStyle}
                >
                  {editing ? "Save changes" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  style={{ ...btnStyle, opacity: 0.8 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </RoleGate>
      {isLoading ? (
        <p style={{ opacity: 0.6, fontSize: 14 }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "crimson", fontSize: 14 }}>{String(error)}</p>
      ) : (
        <ul style={{ display: "grid", gap: 8 }}>
          {(teams ?? []).map((t) => (
            <li key={t.id} style={rowStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                {t.description && <div style={{ fontSize: 13, opacity: 0.7 }}>{t.description}</div>}
              </div>
              <RoleGate required="admin">
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btnSmStyle} onClick={() => startEdit(t)}>✏️ Edit</button>
                  <button style={btnSmStyle} onClick={() => deleteMut.mutate(t.id)}>🗑 Delete</button>
                </div>
              </RoleGate>
            </li>
          ))}
        </ul>
      )}

      {!profile?.is_admin && (
        <div style={{ fontSize: 12, opacity: 0.6 }}>
          (Admin-only actions are hidden.)
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: "8px 12px",
  background: "#fff",
  cursor: "pointer",
};
const btnSmStyle: React.CSSProperties = { ...btnStyle, padding: "6px 10px", fontSize: 13 };
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.9)",
  borderRadius: 16,
  padding: 12,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};
const rowStyle: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "8px 10px",
};
const errStyle: React.CSSProperties = { color: "crimson", fontSize: 12 };
