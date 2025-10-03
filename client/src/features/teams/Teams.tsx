import { useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/lib/RoleGate";

type Team = { id: string; name: string; description?: string | null };

export default function TeamsPage() {
  const [items, setItems] = useState<Team[]>([]);
  const [editing, setEditing] = useState<Team | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    setItems([
      { id: "t1", name: "Design", description: "UI/UX Guild" },
      { id: "t2", name: "Engineering", description: "Web + Mobile" },
    ]);
  }, []);

  const filtered = useMemo(
    () => items.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  async function handleSubmit(values: { id?: string; name: string; description?: string | null }) {
    if (editing) {
      setItems((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...values, id: editing.id } : t)));
    } else {
      setItems((prev) => [{ id: "t" + Math.random().toString(36).slice(2, 8), ...values }, ...prev]);
    }
    setEditing(null);
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
        <RoleGate required="admin">
          <button
            className="rounded-2xl px-4 py-2 border shadow bg-white"
            onClick={() =>
              setEditing({
                id: "",
                name: "",
                description: "",
              })
            }
          >
            + New Team
          </button>
        </RoleGate>
      </header>

      <div className="border rounded-2xl bg-white p-3">
        <input
          placeholder="Search teams"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border rounded-xl px-3 py-2 w-64"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((t) => (
          <div key={t.id} className="border rounded-2xl bg-white p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.name}</div>
              {t.description && <div className="text-sm opacity-70">{t.description}</div>}
            </div>
            <RoleGate required="admin">
              <div className="flex gap-2">
                <button className="rounded-xl px-3 py-2 border" onClick={() => setEditing(t)}>
                  Edit
                </button>
                <button className="rounded-xl px-3 py-2 border text-red-600" onClick={() => handleDelete(t.id)}>
                  Delete
                </button>
              </div>
            </RoleGate>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="border rounded-2xl bg-white p-4 text-sm opacity-70">No teams found.</div>
        )}
      </div>
      {/*Admin Create/Edit*/}
      <RoleGate required="admin">
        {editing && (
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm opacity-75 mb-2">{editing.id ? "Edit Team" : "Create Team"}</div>
            <TeamForm
              initial={editing}
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

function TeamForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: { id?: string; name: string; description?: string | null };
  onSubmit: (v: { id?: string; name: string; description?: string | null }) => Promise<void> | void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...(initial?.id ? { id: initial.id } : {}),
      name,
      description: description || null,
    };

    await onSubmit(payload as any);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-lg">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Name</span>
        <input className="border rounded-xl px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Description</span>
        <textarea className="border rounded-xl px-3 py-2" rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="rounded-2xl px-4 py-2 shadow border text-sm bg-black text-white">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="rounded-2xl px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
