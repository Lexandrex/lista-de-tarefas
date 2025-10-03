import { useState } from "react";

export type TeamUpsert = { id?: string; name: string; description?: string | null };

export default function TeamFormCard({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: TeamUpsert;
  onSubmit: (values: TeamUpsert) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
  e.preventDefault();
  const payload = {
    ...(initial?.id ? { id: initial.id } : {}),
    name,
    description: description || null,
  } as const;

  await onSubmit(payload as any);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 520 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required style={input} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Description</span>
        <textarea rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} style={input} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={pending} style={btnPrimary}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} style={btn}>{pending ? "…" : "Cancel"}</button>}
      </div>
    </form>
  );
}

const input: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "8px 10px" };
const btn: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "8px 12px", background: "#fff", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#111827", color: "#fff", borderColor: "#111827" };
