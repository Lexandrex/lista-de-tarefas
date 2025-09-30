import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOrgId } from "@/lib/useOrgId";
import { orgSelectMany, orgInsert, orgUpdate, orgDelete } from "@/lib/db";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const HEADER_H = 64;
const SIDEBAR_W = 240;

type Team = {
  id: string;
  name: string;
  description?: string | null;
  org_id: string;
};

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
            <h3 style={title}>Teams</h3>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              maxWidth: "500px",
              marginBottom: "20px"
            }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Team Name *</label>
                <input
                  style={inputStyle}
                  placeholder="Enter team name"
                  value={form.name}
                  onChange={e=>setForm(s=>({ ...s, name: e.target.value }))}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Description</label>
                <input
                  style={inputStyle}
                  placeholder="Enter team description (optional)"
                  value={form.description}
                  onChange={e=>setForm(s=>({ ...s, description: e.target.value }))}
                />
              </div>

              <div>
                <button 
                  onClick={addTeam} 
                  disabled={!canSubmit}
                  style={{
                    ...buttonStyle,
                    opacity: canSubmit ? 1 : 0.5,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    width: "200px"
                  }}
                >
                  Add Team
                </button>
              </div>
            </div>

            {error && <p style={{color:"crimson", marginBottom:16}}>{error}</p>}

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
          </section>
        </div>
      </main>
    </>
  );
}