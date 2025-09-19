import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOrgId } from "@/lib/useOrgId";
import { orgSelectMany, orgInsert, orgUpdate, orgDelete } from "@/lib/db";

type Team = {
  id: string;
  name: string;
  description?: string | null;
  org_id: string;
};

export default function Teams() {
  const { orgId, loading: orgLoading, err: orgErr } = useOrgId();
  const [rows, setRows] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name]);

  async function load() {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await orgSelectMany<Team>("teams", orgId, "id,name,description,org_id");
    if (error) setError(error.message);
    setRows(data || []);
    setLoading(false);
  }

  async function addTeam() {
    if (!orgId || !canSubmit) return;
    setError(null);
    const { error } = await orgInsert<Team>("teams", orgId, {
      name: form.name.trim(),
      description: form.description.trim() || null,
    });
    if (error) { setError(error.message); return; }
    setForm({ name: "", description: "" });
    load();
  }

  async function saveEdit(id: string, patch: Partial<Team>) {
    if (!orgId) return;
    setError(null);
    const { error } = await orgUpdate<Team>("teams", orgId, { id }, patch);
    if (error) { setError(error.message); return; }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!orgId) return;
    if (!confirm("Deletar team")) return;
    const { error } = await orgDelete("teams", orgId, { id });
    if (error) { setError(error.message); return; }
    load();
  }

  useEffect(() => {
    if (!orgId) return;
    load();
    const ch = supabase
      .channel("teams-crud")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId]);

  if (orgLoading) return <div style={{padding:16}}>Loading…</div>;
  if (orgErr) return <div style={{color:"crimson", padding:16}}>Error: {orgErr}</div>;
  if (!orgId) return <div style={{padding:16}}>profile nao tem org_id</div>;

  return (
    <div style={{maxWidth: 900, margin:"32px auto", padding:"0 16px"}}>
      <h2 style={{marginBottom:12}}>Teams</h2>

      <div style={{
        display:"grid",
        gap:8,
        gridTemplateColumns:"1fr 2fr auto"
      }}>
        <input
          placeholder="Team name"
          value={form.name}
          onChange={e=>setForm(s=>({ ...s, name: e.target.value }))}
        />
        <input
          placeholder="Description (optional)"
          value={form.description}
          onChange={e=>setForm(s=>({ ...s, description: e.target.value }))}
        />
        <button onClick={addTeam} disabled={!canSubmit}>Add</button>
      </div>

      {error && <p style={{color:"crimson", marginTop:8}}>{error}</p>}

      <div style={{marginTop:16}}>
        {loading ? <p>Loading teams…</p> : (
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{textAlign:"left", borderBottom:"1px solid #e5e7eb"}}>
                <th style={{padding:"8px 4px"}}>Name</th>
                <th style={{padding:"8px 4px"}}>Description</th>
                <th style={{padding:"8px 4px"}}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"8px 4px"}}>
                    {editing === t.id ? (
                      <input
                        defaultValue={t.name}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const v = (e.target as HTMLInputElement).value.trim();
                            if (v && v !== t.name) saveEdit(t.id, { name: v });
                            else setEditing(null);
                          } else if (e.key === "Escape") {
                            setEditing(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      t.name
                    )}
                  </td>
                  <td style={{padding:"8px 4px"}}>
                    {editing === t.id ? (
                      <input
                        defaultValue={t.description ?? ""}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const v = (e.target as HTMLInputElement).value.trim();
                            if (v !== (t.description ?? "")) saveEdit(t.id, { description: v || null });
                            else setEditing(null);
                          } else if (e.key === "Escape") {
                            setEditing(null);
                          }
                        }}
                      />
                    ) : (
                      t.description ?? <span style={{color:"#9ca3af"}}>—</span>
                    )}
                  </td>
                  <td style={{padding:"8px 4px", whiteSpace:"nowrap"}}>
                    {editing === t.id ? (
                      <button onClick={() => setEditing(null)}>Cancel</button>
                    ) : (
                      <>
                        <button onClick={() => setEditing(t.id)} style={{marginRight:8}}>Edit</button>
                        <button onClick={() => remove(t.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={3} style={{padding:"12px 4px", color:"#6b7280"}}>Nenhum team ainda</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
