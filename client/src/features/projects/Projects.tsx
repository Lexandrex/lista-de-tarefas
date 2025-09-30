import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOrgId } from "@/lib/useOrgId";
import { orgSelectMany, orgInsert, orgUpdate, orgDelete } from "@/lib/db";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const HEADER_H = 64;
const SIDEBAR_W = 240;

type Team = { id: string; name: string; org_id: string };
type Project = { id: string; name: string; description?: string | null; org_id: string; team_id?: string | null };

const card = {
  background: "white",
  borderRadius: 8,
  padding: 24,
  marginBottom: 24,
  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
};

const title = {
  fontSize: 24,
  fontWeight: "500",
  color: "#111827",
  marginBottom: 24,
};

const formGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#374151",
  textAlign: "left",
};

const inputStyle: React.CSSProperties = {
  height: "36px",
  padding: "4px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s ease",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  fontWeight: "500",
  fontSize: "14px",
  transition: "background-color 0.2s ease",
};

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
    <>
      <Header
        appName="Lista de Tarefas"
        onSearch={(q) => console.log("search:", q)}
        onCreate={() => console.log("create")}
        onBellClick={() => console.log("bell")}
        onSettingsClick={() => console.log("settings")}
        onProfileClick={() => console.log("profile")}
      />

      <Sidebar />

      <main
        style={{
          position: "fixed",
          top: HEADER_H,
          left: SIDEBAR_W,
          right: 0,
          bottom: 0,
          overflowY: "auto",
          background: "#f8fafc",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 16px 32px" }}>
          <section style={card}>
            <h3 style={title}>Projects</h3>
            
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "500px",
              marginBottom: "20px"
            }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Project Name *</label>
                <input
                  style={inputStyle}
                  placeholder="Enter project name"
                  value={form.name}
                  onChange={e=>setForm(s=>({ ...s, name: e.target.value }))}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>Description</label>
                <input
                  style={inputStyle}
                  placeholder="Enter project description (optional)"
                  value={form.description}
                  onChange={e=>setForm(s=>({ ...s, description: e.target.value }))}
                />
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>Team</label>
                <select
                  style={inputStyle}
                  value={form.team_id}
                  onChange={e=>setForm(s=>({ ...s, team_id: e.target.value }))}
                >
                  <option value="">Select a team (optional)</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <button 
                  onClick={add} 
                  disabled={!canSubmit}
                  style={{
                    ...buttonStyle,
                    opacity: canSubmit ? 1 : 0.5,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    width: "200px"
                  }}
                >
                  Add Project
                </button>
              </div>
            </div>

            {error && <p style={{color:"crimson", marginBottom:16}}>{error}</p>}
            <div>
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
          </section>
        </div>
      </main>
    </>
  );
}
