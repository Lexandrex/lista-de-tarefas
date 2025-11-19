import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleGate } from "@/lib/RoleGate";
import { useAuth } from "@/app/useAuth";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

type DbProjectRow = Database["api"]["Views"]["projects"]["Row"];
type DbTeamRow = Database["api"]["Views"]["teams"]["Row"];
type DbTeamMember = Database["api"]["Views"]["team_members"]["Row"];
type UpsertArgs = Database["api"]["Functions"]["project_upsert"]["Args"];
type SetTeamsArgs = Database["api"]["Functions"]["project_set_teams"]["Args"];

type Project = { id: string; name: string; description?: string | null; team_id: string | null; org_id?: string | null };
type Team = { id: string; name: string; description?: string | null };

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

  // load projects + team memberships
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

  const loadProjectTeamIds = useCallback(async (projectId: string): Promise<string[]> => {
    if (!orgId) return [];
    const { data, error } = await supabase
      .from("project_teams")
      .select("team_id")
      .eq("org_id", orgId as string)
      .eq("project_id", projectId);
    if (error) throw error;
    return ((data ?? []) as { team_id: string | null }[]).map(r => r.team_id).filter((x): x is string => !!x);
  }, [orgId]);

  const setProjectTeams = useCallback(async (projectId: string, teamIds: string[]) => {
    if (!orgId) throw new Error("orgId is null");
    const args: SetTeamsArgs = {
      _org_id: orgId as string,
      _project_id: projectId,
      _team_ids: teamIds as any,
    };
    const { error } = await supabase.rpc("project_set_teams", args);
    if (error) throw error;
  }, [orgId]);

  
  const upsertProject = useCallback(
    async (
      v: { id?: string; name: string; description?: string | null; team_id?: string | null }
    ): Promise<Project | null> => {
      if (!orgId) throw new Error("orgId is null");

      const args: UpsertArgs = {
        _org_id: orgId as string,
        _name: v.name,
        ...(v.id ? { _id: v.id } : {}),
        ...(v.team_id ? { _team_id: v.team_id } : {}),
        ...(v.description ? { _description: v.description } : {}),
      };

      const { data, error } = await supabase.rpc("project_upsert", args);
      if (error) {
        console.error("[Projects] project_upsert error", error);
        throw error;
      }

      const row = toSafeProject(data as DbProjectRow);

      if (!row) {
        if (v.id) {
          const fallback: Project = {
            id: v.id,
            name: v.name,
            description: v.description ?? null,
            team_id: v.team_id ?? null,
            org_id: orgId,
          };
          setProjects(prev => prev.map(p => (p.id === v.id ? { ...p, ...fallback } : p)));
          return fallback;
        } else {
          const newProj: Project = {
            id: crypto.randomUUID(),
            name: v.name,
            description: v.description ?? null,
            team_id: v.team_id ?? null,
            org_id: orgId,
          };
          setProjects(prev => [newProj, ...prev]);
          return newProj;
        }
      }

      // Row came back from RPC
      setProjects(prev => {
        const exists = prev.some(p => p.id === row.id);
        return exists ? prev.map(p => (p.id === row.id ? row : p)) : [row, ...prev];
      });
      return row;
    },
    [orgId]
  );

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.rpc("project_delete", { _id: id });
    if (error) {
      console.error("[Projects] project_delete error", error);
      throw error;
    }
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projetos</h1>
        <div className="flex items-center gap-2">
          <input
            className="input w-72"
            placeholder="Procurar por projetos"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <RoleGate required="admin">
            <button
              className="btn btn-primary"
              onClick={() => setEditing({ name: "", description: "", team_id: null } as Project)}
            >
              +Criar
            </button>
          </RoleGate>
        </div>
      </div>
{/*
      <section className="grid gap-2">
        <div className="text-sm text-muted">Voce e afiliado a estes projetos:</div>
        <div className="grid gap-3">
          {myProjects.length === 0 ? (
            <div className="card p-4 text-sm text-muted">Voce ainda não e membro de nenhum projeto.</div>
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
*/}
      <section className="grid gap-2">
        <div className="text-sm text-muted">Projetos existentes.</div>
        <div className="grid gap-3">
          {otherProjects.length === 0 ? (
            <div className="card p-4 text-sm text-muted">Nenhum projeto encontrado.</div>
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
            <div className="text-sm text-muted mb-2">{editing.id ? "Editar Projeto" : "Criar projeto"}</div>
            <ProjectForm
              initial={editing}
              loadTeams={loadTeams}
              loadProjectTeamIds={loadProjectTeamIds}
              submitLabel={editing.id ? "Salvar mudanças" : "Criar"}
              onSubmit={async (v, selectedTeamIds) => {
                const saved = await upsertProject(v);
                const id = saved?.id ?? v.id;
                if (id) { await setProjectTeams(id, selectedTeamIds); }
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
              {...(editing.id ? { onDelete: async () => { await deleteProject(editing.id!); setEditing(null); } } : {})}
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
        <button className="btn" onClick={onView}>Visualizar</button>
        <RoleGate required="admin">
          <button className="btn" onClick={onEdit}>Editar</button>
        </RoleGate>
      </div>
    </div>
  );
}

function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel,
  loadTeams,
  loadProjectTeamIds,
}: {
  initial: { id?: string; name: string; description?: string | null; team_id?: string | null };
  onSubmit: (
    v: { id?: string; name: string; description?: string | null; team_id?: string | null },
    selectedTeamIds: string[]
  ) => Promise<void> | void;
  onCancel: () => void;
  onDelete?: () => void | Promise<void>;
  submitLabel: string;
  loadTeams: () => Promise<Team[]>;
  loadProjectTeamIds: (projectId: string) => Promise<string[]>;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // load all org teams
      const rows = await loadTeams();
      if (!active) return;
      setTeams(rows);

      // preselect project teams if editing
      if (initial.id) {
        const ids = await loadProjectTeamIds(initial.id);
        if (!active) return;
        setSelectedTeamIds(ids);
      }
      setLoadingTeams(false);
    })().catch(err => {
      console.error("[ProjectForm] load teams / project team ids error", err);
      setTeams([]);
      setSelectedTeamIds([]);
      setLoadingTeams(false);
    });
    return () => { active = false; };
  }, [initial.id, loadTeams, loadProjectTeamIds]);

  function toggleTeam(id: string) {
    setSelectedTeamIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(
      {
        ...(initial?.id ? { id: initial.id } : {}),
        name,
        description: description || null,
      },
      selectedTeamIds
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-2xl">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Nome</span>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
      </label>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Descrição</span>
        <textarea className="input" rows={3} value={description ?? ""} onChange={e => setDescription(e.target.value)} />
      </label>

      <div className="grid gap-2">
        <div className="text-sm opacity-80">Selecione as equipes desejadas</div>
        <div className="border rounded p-2 grid gap-1 max-h-56 overflow-auto">
          {loadingTeams ? (
            <div className="text-sm text-muted">Carregando equipes...</div>
          ) : teams.length === 0 ? (
            <div className="text-sm text-muted">Nenhuma equipe disponivel.</div>
          ) : (
            teams.map(t => (
              <label key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTeamIds.includes(t.id)}
                  onChange={() => toggleTeam(t.id)}
                />
                <span className="font-medium">{t.name}</span>
                {t.description && <span className="text-xs opacity-70">— {t.description}</span>}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        {onDelete && initial.id ? (
          <button type="button" className="btn text-red-600" onClick={() => onDelete()}>
            Deletar projeto
          </button>
        ) : null}
      </div>
    </form>
  );
}