import { useEffect, useMemo, useState } from "react";

export type UserLite = { id: string; name: string; email?: string | null };

type Props = {
  teamId: string | null;
  value: string[];
  onChange: (userIds: string[]) => void;
  loadMembersByTeam: (teamId: string | null) => Promise<UserLite[]>;
  disabled?: boolean;
};

export default function MemberMultiPicker({ teamId, value, onChange, loadMembersByTeam, disabled }: Props) {
  const [list, setList] = useState<UserLite[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    loadMembersByTeam(teamId).then((rows) => active && setList(rows));
    return () => { active = false; };
  }, [teamId, loadMembersByTeam]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return t ? list.filter((x) => (x.name || "").toLowerCase().includes(t) || (x.email || "").toLowerCase().includes(t)) : list;
  }, [list, q]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input
        placeholder={teamId ? "Search members…" : "Select a team first"}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ border: "1px solid #ddd", borderRadius: 10, padding: "8px 10px" }}
        disabled={disabled || !teamId}
      />
      <div style={{ border: "1px solid #eee", borderRadius: 10, maxHeight: 180, overflow: "auto", background: disabled ? "#fafafa" : "#fff" }}>
        {filtered.map((u) => {
          const checked = value.includes(u.id);
          return (
            <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid #f5f5f5" }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(u.id)} disabled={disabled} />
              <div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{u.email}</div>
              </div>
            </label>
          );
        })}
        {!filtered.length && (
          <div style={{ padding: 10, fontSize: 12, opacity: 0.7 }}>
            {teamId ? "No members found." : "Pick a team to list its members."}
          </div>
        )}
      </div>
      {!!value.length && (
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Selected: <strong>{value.length}</strong>
        </div>
      )}
    </div>
  );
}
