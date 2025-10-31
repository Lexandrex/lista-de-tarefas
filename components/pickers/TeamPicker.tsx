import { useEffect, useMemo, useState } from "react";

export type Team = { id: string; name: string; description?: string | null };

type Props = {
  value: string | null;
  onChange: (teamId: string | null) => void;
  loadTeams: () => Promise<Team[]>;
  placeholder?: string;
  disabled?: boolean;
};

export default function TeamPicker({ value, onChange, loadTeams, placeholder = "Select a team", disabled }: Props) {
  const [list, setList] = useState<Team[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    loadTeams().then((rows) => active && setList(rows));
    return () => { active = false; };
  }, [loadTeams]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return t ? list.filter((x) => x.name.toLowerCase().includes(t)) : list;
  }, [list, q]);

  const selected = list.find((t) => t.id === value) ?? null;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input
        placeholder="Search teams..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ border: "1px solid #ddd", borderRadius: 10, padding: "8px 10px" }}
        disabled={disabled}
      />
      <div style={{ border: "1px solid #eee", borderRadius: 10, maxHeight: 160, overflow: "auto" }}>
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: "8px 10px",
              cursor: "pointer",
              background: value === t.id ? "#eef2ff" : "#fff",
              borderBottom: "1px solid #f5f5f5",
            }}
          >
            <div style={{ fontWeight: 600 }}>{t.name}</div>
            {t.description && <div style={{ fontSize: 12, opacity: 0.7 }}>{t.description}</div>}
          </div>
        ))}
        {!filtered.length && (
          <div style={{ padding: 10, fontSize: 12, opacity: 0.7 }}>{placeholder}</div>
        )}
      </div>
      {selected && (
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Selected: <strong>{selected.name}</strong>
        </div>
      )}
    </div>
  );
}
