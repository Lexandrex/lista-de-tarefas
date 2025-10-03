import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleGate } from "@/lib/RoleGate";

type Project = { id: string; name: string; description?: string | null; team_id: string | null; members?: string[] };
type Team   = { id: string; name: string; description?: string | null };

export default function ProjectsPage() {
  const nav = useNavigate();
  const currentUserId = "u1";
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);

  useEffect(() => {
    setProjects([
      { id: "p1", name: "project1", description: "description", team_id: "t1", members: ["u1","u2"] },
      { id: "p2", name: "proj2",        description: "desc",        team_id: "t2", members: ["u2"] },
      { id: "p3", name: "proj3",     description: "desc",  team_id: null,  members: [] },
    ]);
  }, []);

  const filtered = useMemo(() => projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase())), [projects, q]);

  const myProjects    = filtered.filter(p => p.members?.includes(currentUserId));
  const otherProjects = filtered.filter(p => !p.members?.includes(currentUserId));

  async function loadTeams(): Promise<Team[]> {
    return [
      { id: "t1", name: "team1" },
      { id: "t2", name: "team2" },
    ];
  }

  async function upsertProject(v: { id?: string; name: string; description?: string | null; team_id: string | null }) {
    if (editing?.id) {
      setProjects(prev => prev.map(p => (p.id === editing.id ? { ...p, ...v, id: editing.id } : p)));
    } else {
      setProjects(prev => [{ id: "p" + Math.random().toString(36).slice(2,8), members: [currentUserId], ...v }, ...prev]);
    }
    setEditing(null);
  }

  async function deleteProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <div className="flex items-center gap-2">
          <input
            className="input w-72"
            placeholder="Search projects"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <RoleGate required="admin">
            <button
              className="btn btn-primary"
              onClick={() => setEditing({ name: "", description: "", team_id: null } as Project)}
            >
              + Create
            </button>
          </RoleGate>
        </div>
      </div>
      <section className="grid gap-2">
        <div className="text-sm text-muted">You’re affiliated to</div>
        <div className="grid gap-3">
          {myProjects.length === 0 ? (
            <div className="card p-4 text-sm text-muted">You aren’t a member of any project yet.</div>
          ) : (
            myProjects.map(p => (
              <ProjectRow
                key={p.id}
                p={p}
                onView={() => nav(`/projects/${p.id}`)}
                onEdit={() => setEditing(p)}
                onDelete={() => deleteProject(p.id)}
              />
            ))
          )}
        </div>
      </section>
      <section className="grid gap-2">
        <div className="text-sm text-muted">Other existing projects</div>
        <div className="grid gap-3">
          {otherProjects.length === 0 ? (
            <div className="card p-4 text-sm text-muted">No other projects found.</div>
          ) : (
            otherProjects.map(p => (
              <ProjectRow
                key={p.id}
                p={p}
                onView={() => nav(`/projects/${p.id}`)}
                onEdit={() => setEditing(p)}
                onDelete={() => deleteProject(p.id)}
              />
            ))
          )}
        </div>
      </section>
      <RoleGate required="admin">
        {editing && (
          <div className="card p-4">
            <div className="text-sm text-muted mb-2">{editing.id ? "Edit Project" : "Create Project"}</div>
            <ProjectForm
              initial={editing}
              loadTeams={loadTeams}
              submitLabel={editing.id ? "Save changes" : "Create"}
              onSubmit={upsertProject}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}
      </RoleGate>
    </div>
  );
}

function ProjectRow({ p, onView, onEdit, onDelete }: {
  p: Project;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <div className="font-semibold">{p.name}</div>
        {p.description && <div className="text-sm text-muted">{p.description}</div>}
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={onView}>View</button>
        <RoleGate required="admin">
          <button className="btn" onClick={onEdit}>Edit</button>
          <button className="btn text-red-600" onClick={onDelete}>Delete</button>
        </RoleGate>
      </div>
    </div>
  );
}

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loadTeams,
}: {
  initial: { id?: string; name: string; description?: string | null; team_id: string | null };
  onSubmit: (v: { id?: string; name: string; description?: string | null; team_id: string | null }) => Promise<void> | void;
  onCancel: () => void;
  submitLabel: string;
  loadTeams: () => Promise<Team[]>;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [teamId, setTeamId] = useState<string | "">(initial.team_id ?? "");
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    let active = true;
    loadTeams().then(rows => active && setTeams(rows));
    return () => { active = false; };
  }, [loadTeams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...(initial?.id ? { id: initial.id } : {}),
      name,
      description: description || null,
      team_id: (teamId as string) || null,
    };
    await onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Name</span>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
      </label>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Description</span>
        <textarea className="input" rows={3} value={description ?? ""} onChange={e => setDescription(e.target.value)} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Assign team</span>
        <select className="select w-64" value={teamId} onChange={e => setTeamId(e.target.value)}>
          <option value="">No team</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
