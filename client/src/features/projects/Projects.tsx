import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleGate } from "@/lib/RoleGate";
import { useAuth } from "@/app/useAuth";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

type DbProjectRow   = Database["api"]["Views"]["projects"]["Row"];
type DbTeamRow      = Database["api"]["Views"]["teams"]["Row"];
type DbTeamMember   = Database["api"]["Views"]["team_members"]["Row"];
type Args = Database["api"]["Functions"]["project_upsert"]["Args"];

type Project = { id: string; name: string; description?: string | null; team_id: string | null; org_id?: string | null };
type Team    = { id: string; name: string; description?: string | null };

export default function ProjectsPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const orgId  = (user as any)?.user_metadata?.org_id ?? null;
  const userId = user?.id ?? null;
  const [projects, setProjects] = useState<Project[]>([]);
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);

  // nullable view row mapping
  const toSafeProject = (p: DbProjectRow): Project | null => {
    if (!p?.id || !p?.name) return null;
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      team_id: p.team_id ?? null,
      org_id: p.org_id ?? null,
    };
  };

  // load projects + my team memberships
  useEffect(() => {
    let active = true;
    (async () => {
      if (!orgId || !userId) {
        setProjects([]);
        setMyTeamIds(new Set());
        return;
      }

      const [projRes, membRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, description, team_id, org_id")
          .eq("org_id", orgId),
        supabase
          .from("team_members")
          .select("team_id, user_id, org_id")
          .eq("org_id", orgId)
          .eq("user_id", userId),
      ]);

      if (!active) return;
      if (projRes.error) throw projRes.error;
      if (membRes.error) throw membRes.error;

      // const notNull = <T,>(x: T | null | undefined): x is T => x != null;
      const projRows = (projRes.data ?? []) as DbProjectRow[];
      const rows = projRows
        .map(toSafeProject)
        .filter((x): x is Project => x != null);
      const mine = new Set<string>(
        (membRes.data as DbTeamMember[] ?? []).map(m => m.team_id!).filter(Boolean) as string[]
      );
      setProjects(rows);
      setMyTeamIds(mine);
    })().catch((err) => {
      console.error("[Projects] load error", err);
      setProjects([]);
      setMyTeamIds(new Set());
    });
    return () => { active = false; };
  }, [orgId, userId]);

  const filtered = useMemo(
    () => projects.filter(p => p.name.toLowerCase().includes(q.toLowerCase())),
    [projects, q]
  );
  const myProjects = useMemo(
    () => filtered.filter(p => !!p.team_id && myTeamIds.has(p.team_id)),
    [filtered, myTeamIds]
  );
  const otherProjects = useMemo(
    () => filtered.filter(p => !(p.team_id && myTeamIds.has(p.team_id))),
    [filtered, myTeamIds]
  );

  // data helpers
  const loadTeams = useCallback(async (): Promise<Team[]> => {
    if (!orgId) return [];
    const { data, error } = await supabase
      .from("teams") // VIEW in api
      .select("id, name, description, org_id")
      .eq("org_id", orgId);
    if (error) throw error;
    return (data as DbTeamRow[] ?? [])
      .map(t => {
        if (!t?.id || !t?.name) return null;
        return { id: t.id, name: t.name, description: t.description ?? null } as Team;
      })
      .filter((x): x is Team => x != null);
  }, [orgId]);
  
  const upsertProject = useCallback(async (v: { id?: string; name: string; description?: string | null; team_id: string | null }) => {
    if (!orgId) throw new Error("orgId is null");
    const args = {
      _org_id: orgId!,
      _name: v.name,
      ...(v.id ?        { _id: v.id } : {}),
      ...(v.team_id ?   { _team_id: v.team_id } : {}),
      ...(v.description ? { _description: v.description } : {}),
    } satisfies Args;

    const { data, error } = await supabase.rpc("project_upsert", args);
    if (error) {
      console.error("[Projects] project_upsert error", error);
      throw error;
    }

    const row = toSafeProject(data as DbProjectRow);
    if (!row) {
      // RPC retorna expected status
      if (v.id) {
        setProjects(prev => prev.map(p => (p.id === v.id ? { ...p, ...v } as Project : p)));
      } else {
        const newProj: Project = {
          id: crypto.randomUUID(),
          name: v.name,
          description: v.description ?? null,
          team_id: v.team_id ?? null,
          org_id: orgId,
        };
        setProjects(prev => [newProj, ...prev]);
      }
    } else {
      setProjects(prev => {
        const exists = prev.some(p => p.id === row.id);
        return exists ? prev.map(p => (p.id === row.id ? row : p)) : [row, ...prev];
      });
    }
    setEditing(null);
  }, [orgId]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.rpc("project_delete", { _id: id });
    if (error) {
      console.error("[Projects] project_delete error", error);
      throw error;
    }
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  // ---------- render ----------

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
    loadTeams().then(rows => { if (active) setTeams(rows); }).catch(console.error);
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
