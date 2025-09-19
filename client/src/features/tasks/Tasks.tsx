import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOrgId } from "@/lib/useOrgId";
import { orgSelectMany, orgInsert, orgUpdate, orgDelete } from "@/lib/db";

type Project = { id: string; name: string; org_id: string };
type Task = {
  id: string;
  title: string;
  done: boolean;
  description?: string | null;
  project_id?: string | null;
  org_id: string;
};

export default function Tasks() {
  const { orgId, loading: orgLoading, err: orgErr } = useOrgId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; project_id: string | "" }>({
    title: "", description: "", project_id: ""
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | "">("");

  const canSubmit = useMemo(() => form.title.trim().length > 0, [form.title]);

  async function load() {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    const [taskRes, projRes] = await Promise.all([
      orgSelectMany<Task>("tasks", orgId, "id,title,done,description,project_id,org_id"),
      orgSelectMany<Project>("projects", orgId, "id,name,org_id"),
    ]);

    if (taskRes.error) setError(taskRes.error.message);
    if (projRes.error) setError(projRes.error.message || error);

    setTasks(taskRes.data || []);
    setProjects(projRes.data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!filterProject) return tasks;
    return tasks.filter(t => (t.project_id || "") === filterProject);
  }, [tasks, filterProject]);

  async function add() {
    if (!orgId || !canSubmit) return;
    setError(null);
    const payload: Partial<Task> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      project_id: form.project_id || null,
      done: false,
    };
    const { error } = await orgInsert<Task>("tasks", orgId, payload);
    if (error) { setError(error.message); return; }
    setForm({ title: "", description: "", project_id: filterProject || "" });
    load();
  }

  async function toggle(t: Task) {
    if (!orgId) return;
    const { error } = await orgUpdate<Task>("tasks", orgId, { id: t.id }, { done: !t.done });
    if (error) setError(error.message);
  }

  async function saveEdit(id: string, patch: Partial<Task>) {
    if (!orgId) return;
    setError(null);
    const { error } = await orgUpdate<Task>("tasks", orgId, { id }, patch);
    if (error) { setError(error.message); return; }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!orgId) return;
    if (!confirm("Delete this task?")) return;
    const { error } = await orgDelete("tasks", orgId, { id });
    if (error) { setError(error.message); return; }
    load();
  }

  useEffect(() => {
    if (!orgId) return;
    load();

    const chTasks = supabase
      .channel("tasks-crud")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => load())
      .subscribe();

    const chProjects = supabase
      .channel("projects-for-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(chTasks); supabase.removeChannel(chProjects); };
  }, [orgId]);

  if (orgLoading) return <div style={{padding:16}}>Loading…</div>;
  if (orgErr) return <div style={{color:"crimson", padding:16}}>Error: {orgErr}</div>;
  if (!orgId) return <div style={{padding:16}}>profile ta sem org_id</div>;

  return (
    <div style={{maxWidth: 960, margin:"32px auto", padding:"0 16px"}}>
      <h2 style={{marginBottom:12}}>Tasks</h2>
      <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:12}}>
        <label>Filter by project:</label>
        <select value={filterProject} onChange={e=>setFilterProject(e.target.value as string)}>
          <option value="">All</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div style={{display:"grid", gap:8, gridTemplateColumns:"2fr 2fr 1fr auto"}}>
        <input
          placeholder="Task title"
          value={form.title}
          onChange={e=>setForm(s=>({ ...s, title: e.target.value }))}
        />
        <input
          placeholder="Description (optional)"
          value={form.description}
          onChange={e=>setForm(s=>({ ...s, description: e.target.value }))}
        />
        <select
          value={form.project_id}
          onChange={e=>setForm(s=>({ ...s, project_id: e.target.value }))}
        >
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={add} disabled={!canSubmit}>Add</button>
      </div>

      {error && <p style={{color:"crimson", marginTop:8}}>{error}</p>}
      <div style={{marginTop:16}}>
        {loading ? <p>Loading tasks…</p> : (
          <table style={{width:"100%", borderCollapse:"collapse"}}>
            <thead>
              <tr style={{textAlign:"left", borderBottom:"1px solid #e5e7eb"}}>
                <th style={{padding:"8px 4px"}}>Done</th>
                <th style={{padding:"8px 4px"}}>Title</th>
                <th style={{padding:"8px 4px"}}>Description</th>
                <th style={{padding:"8px 4px"}}>Project</th>
                <th style={{padding:"8px 4px"}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const projectName = projects.find(p => p.id === t.project_id)?.name ?? "—";
                return (
                  <tr key={t.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"8px 4px"}}>
                      <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
                    </td>
                    <td style={{padding:"8px 4px"}}>
                      {editing === t.id ? (
                        <input
                          defaultValue={t.title}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = (e.target as HTMLInputElement).value.trim();
                              if (v && v !== t.title) saveEdit(t.id, { title: v });
                              else setEditing(null);
                            } else if (e.key === "Escape") {
                              setEditing(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : t.title}
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
                      ) : (t.description ?? <span style={{color:"#9ca3af"}}>—</span>)}
                    </td>
                    <td style={{padding:"8px 4px"}}>
                      {editing === t.id ? (
                        <select
                          defaultValue={t.project_id ?? ""}
                          onChange={(e)=>saveEdit(t.id, { project_id: e.target.value || null })}
                        >
                          <option value="">No project</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      ) : projectName}
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
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={5} style={{padding:"12px 4px", color:"#6b7280"}}>Nenhum task ainda.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
