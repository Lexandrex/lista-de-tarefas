import { useEffect, useState } from "react";
import TeamPicker, { Team } from "@/components/pickers/TeamPicker";

export type ProjectUpsert = {
  id?: string;
  name: string;
  description?: string | null;
  team_id: string | null;
};

export default function ProjectFormCard({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  loadTeams,
}: {
  initial?: ProjectUpsert;
  onSubmit: (values: ProjectUpsert) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  loadTeams: () => Promise<Team[]>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [teamId, setTeamId] = useState<string | null>(initial?.team_id ?? null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const payload = {
    ...(initial?.id ? { id: initial.id } : {}),
    name,
    description: description || null,
    team_id: (teamId as string) || null,
  } as const;

  await onSubmit(payload as any);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Project name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required style={input} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Description</span>
        <textarea rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} style={input} />
      </label>

      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Assign team</span>
        <TeamPicker value={teamId} onChange={setTeamId} loadTeams={loadTeams} placeholder="No team yet" />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={pending} style={btnPrimary}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} style={btn}>Cancel</button>}
      </div>
    </form>
  );
}

const input: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "8px 10px" };
const btn: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "8px 12px", background: "#fff", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#111827", color: "#fff", borderColor: "#111827" };
