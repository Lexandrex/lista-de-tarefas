import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOrgId } from "@/lib/useOrgId";
import { orgSelectMany, orgInsert, orgUpdate, orgDelete } from "@/lib/db";

type Team   = { id: string; name: string; org_id: string };
type Project = { id: string; name: string; description?: string | null; org_id: string; team_id?: string | null };

export default function Projects() {
  const { orgId, loading: orgLoading, err: orgErr } = useOrgId();

  const [rows, setRows] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; team_id: string | "" }>({
    name: "", description: "", team_id: ""
  });
  const [editing, setEditing] = useState<string | null>(null);

  const canSubmit = useMemo(() => form.name.trim().length > 0, [form.name]);

  async function load() {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    const [projRes, teamRes] = await Promise.all([
      orgSelectMany<Project>("projects", orgId, "id,name,description,org_id,team_id"),
      orgSelectMany<Team>("teams", orgId, "id,name,org_id"),
    ]);

    if (projRes.error) setError(projRes.error.message);
    if (teamRes.error) setError(teamRes.error.message || error);

    setRows(projRes.data || []);
    setTeams(teamRes.data || []);
    setLoading(false);
  }

  async function add() {
    if (!orgId || !canSubmit) return;
    setError(null);
    const payload: Partial<Project> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      team_id: form.team_id || null,
    };
    const { error } = await orgInsert<Project>("projects", orgId, payload);
    if (error) { setError(error.message); return; }
    setForm({ name: "", description: "", team_id: "" });
    load();
  }

  async function saveEdit(id: string, patch: Partial<Project>) {
    if (!orgId) return;
    setError(null);
    const { error } = await orgUpdate<Project>("projects", orgId, { id }, patch);
    if (error) { setError(error.message); return; }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!orgId) return;
    if (!confirm("Delete this project?")) return;
    const { error } = await orgDelete("projects", orgId, { id });
    if (error) { setError(error.message); return; }
    load();
  }

  useEffect(() => {
    if (!orgId) return;
    load();

    const ch = supabase
      .channel("projects-crud")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => load())
      .subscribe();

    const chTeams = supabase
      .channel("teams-for-projects")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(ch); supabase.removeChannel(chTeams); };
  }, [orgId]);

  if (orgLoading) return <div style={{padding:16}}>Loading…</div>;
  if (orgErr) return <div style={{color:"crimson", padding:16}}>Error: {orgErr}</div>;
  if (!orgId) return <div style={{padding:16}}>Your profile has no org_id. Check signup trigger/backfill.</div>;

  return (
    <div style={{maxWidth: 960, margin:"32px auto", padding:"0 16px"}}>
      <h2 style={{marginBottom:12}}>Projects</h2>
      <div style={{display:"grid", gap:8, gridTemplateColumns:"1fr 2fr 1fr auto"}}>
        <input
          placeholder="Project name"
          value={form.name}
          onChange={e=>setForm(s=>({ ...s, name: e.target.value }))}
        />
        <input
          placeholder="Description (opcional)"
          value={form.description}
          onChange={e=>setForm(s=>({ ...s, description: e.target.value }))}
        />
        <select
          value={form.team_id}
          onChange={e=>setForm(s=>({ ...s, team_id: e.target.value }))}
        >
          <option value="">No team</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={add} disabled={!canSubmit}>Add</button>
      </div>

      {error && <p style={{color:"crimson", marginTop:8}}>{error}</p>}
      <div style={{marginTop:16}}>
        {loading ? <p>Loading projects…</p> : (
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{textAlign:"left", borderBottom:"1px solid #e5e7eb"}}>
                <th style={{padding:"8px 4px"}}>Name</th>
                <th style={{padding:"8px 4px"}}>Description</th>
                <th style={{padding:"8px 4px"}}>Team</th>
                <th style={{padding:"8px 4px"}}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const teamName = teams.find(t => t.id === p.team_id)?.name ?? "—";
                return (
                  <tr key={p.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"8px 4px"}}>
                      {editing === p.id ? (
                        <input
                          defaultValue={p.name}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = (e.target as HTMLInputElement).value.trim();
                              if (v && v !== p.name) saveEdit(p.id, { name: v });
                              else setEditing(null);
                            } else if (e.key === "Escape") {
                              setEditing(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : p.name}
                    </td>
                    <td style={{padding:"8px 4px"}}>
                      {editing === p.id ? (
                        <input
                          defaultValue={p.description ?? ""}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = (e.target as HTMLInputElement).value.trim();
                              if (v !== (p.description ?? "")) saveEdit(p.id, { description: v || null });
                              else setEditing(null);
                            } else if (e.key === "Escape") {
                              setEditing(null);
                            }
                          }}
                        />
                      ) : (p.description ?? <span style={{color:"#9ca3af"}}>—</span>)}
                    </td>
                    <td style={{padding:"8px 4px"}}>
                      {editing === p.id ? (
                        <select
                          defaultValue={p.team_id ?? ""}
                          onChange={(e)=>saveEdit(p.id, { team_id: e.target.value || null })}
                        >
                          <option value="">No team</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      ) : teamName}
                    </td>
                    <td style={{padding:"8px 4px", whiteSpace:"nowrap"}}>
                      {editing === p.id ? (
                        <button onClick={() => setEditing(null)}>Cancel</button>
                      ) : (
                        <>
                          <button onClick={() => setEditing(p.id)} style={{marginRight:8}}>Edit</button>
                          <button onClick={() => remove(p.id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={4} style={{padding:"12px 4px", color:"#6b7280"}}>Nenhum projeto ainda.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
