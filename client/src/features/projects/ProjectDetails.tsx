import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/useAuth";
import type { Database } from "@/lib/supabase/types";

type DbProject = Database["api"]["Views"]["projects"]["Row"];
type DbTeam = Database["api"]["Views"]["teams"]["Row"];
type DbTMU = Database["api"]["Views"]["team_member_users"]["Row"];
type DbTask = Database["api"]["Views"]["tasks"]["Row"];
type DbEvent = Database["api"]["Views"]["calendar_events"]["Row"];

type TaskStatus = "todo" | "in_progress" | "done";

type ProjectSafe = { id: string; name: string; description: string | null; team_id: string | null };
type TeamSafe = { id: string; name: string; description: string | null };
type Member = { id: string; name: string; email?: string | null; role?: string | null };
type TaskMini = { id: string; title: string; status: string | null; due_date: string | null };
type TaskCard = {
  id: string;
  title: string;
  status: TaskStatus | null;
  due_date: string | null;
  status_since: string | null;
  created_at: string | null;
  updated_at: string | null;
  assignee_id: string | null;
};

type Activity =
  | { kind: "event"; at: string; title: string; subtitle?: string }
  | { kind: "task";  at: string; title: string; subtitle?: string };

const notNull = <T,>(x: T | null | undefined): x is T => x != null;

export default function ProjectDetailsPage() {
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const orgId = (user as any)?.user_metadata?.org_id ?? null;
  const { id: projectId } = useParams<{ id: string }>();
  
  const [project, setProject] = useState<ProjectSafe | null>(null);
  const [teams, setTeams] = useState<TeamSafe[]>([]);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>({});
  const [openTeamIds, setOpenTeamIds] = useState<Set<string>>(new Set());
  const [tasksByUser, setTasksByUser] = useState<Record<string, TaskMini[]>>({});
  const [projectTasks, setProjectTasks] = useState<TaskCard[]>([]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [openActivities, setOpenActivities] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const now = () => new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400_000);
  const toISO = (d: Date) => d.toISOString();

  const formatAge = (since?: string | null, fallback?: string | null) => {
    const ref = since ?? fallback;
    if (!ref) return "—";
    const start = new Date(ref).getTime();
    const diffMs = Date.now() - start;
    if (Number.isNaN(diffMs) || diffMs < 0) return "—";
    const d = Math.floor(diffMs / 86400_000);
    const h = Math.floor((diffMs % 86400_000) / 3600_000);
    if (d >= 7) return `${d}d`;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h`;
    const m = Math.max(1, Math.floor((diffMs % 3600_000) / 60_000));
    return `${m}m`;
  };

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!orgId || !projectId) { setLoading(false); return; }

      const projRes = await supabase
        .from("projects")
        .select("id, name, description, team_id, org_id")
        .eq("org_id", orgId as string)
        .eq("id", projectId)
        .maybeSingle();
      if (projRes.error) throw projRes.error;
      const p = projRes.data as DbProject | null;
      if (!p?.id || !p?.name) { if (alive) setLoading(false); return; }

      const safeProject: ProjectSafe = {
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        team_id: p.team_id ?? null,
      };
      if (!alive) return;
      setProject(safeProject);

      const ptRes = await supabase
        .from("project_teams")
        .select("team_id")
        .eq("org_id", orgId as string)
        .eq("project_id", projectId);

      if (ptRes.error) throw ptRes.error;

      const teamIds = ((ptRes.data ?? []) as { team_id: string | null }[])
        .map(r => r.team_id)
        .filter((x): x is string => !!x);

      if (teamIds.length > 0) {
        const teamRes = await supabase
          .from("teams")
          .select("id, name, description, org_id")
          .in("id", teamIds)
          .eq("org_id", orgId as string);

        const membRes = await supabase
          .from("team_member_users")
          .select("team_id, user_id, name, email, org_id, role")
          .in("team_id", teamIds)
          .eq("org_id", orgId as string);
      } else {
        setTeams([]);
        setMembersByTeam({});
      }
      
      if (teamIds.length > 0) {
        const teamRes = await supabase
          .from("teams")
          .select("id, name, description, org_id")
          .in("id", teamIds)
          .eq("org_id", orgId as string);
        if (teamRes.error) throw teamRes.error;

        const safeTeams = ((teamRes.data ?? []) as DbTeam[])
          .map((t) => (t?.id && t?.name ? { id: t.id, name: t.name, description: t.description ?? null } : null))
          .filter(notNull);
        if (!alive) return;
        setTeams(safeTeams);

        const membRes = await supabase
          .from("team_member_users")
          .select("team_id, user_id, name, email, org_id, role")
          .in("team_id", teamIds)
          .eq("org_id", orgId as string);
        if (membRes.error) throw membRes.error;

        const grouped: Record<string, Member[]> = {};
        for (const r of ((membRes.data ?? []) as DbTMU[])) {
          if (!r.team_id || !r.user_id) continue;
          const m: Member = {
            id: r.user_id,
            name: (r as any).name ?? (r as any).email ?? r.user_id,
            email: (r as any).email ?? null,
            role:  (r as any).role  ?? null,
          };
          (grouped[r.team_id] ||= []).push(m);
        }
        if (!alive) return;
        setMembersByTeam(grouped);
      } else {
        setTeams([]);
        setMembersByTeam({});
      }

      
      await reloadTasks(); // load inicial

      const fromISO = toISO(addDays(now(), -7));
      const toISO_  = toISO(addDays(now(), 14));
      const evRes = await supabase
        .from("calendar_events")
        .select("id, title, starts_at, ends_at, all_day, project_id, org_id")
        .eq("org_id", orgId as string)
        .eq("project_id", projectId)
        .gte("starts_at", fromISO)
        .lt("starts_at", toISO_);
      if (evRes.error) throw evRes.error;

      if (!alive) return;
      setEvents((evRes.data ?? []) as DbEvent[]);
      setLoading(false);
    })().catch((e) => {
      
      console.error("[ProjectDetails] load error", e);
      if (alive) {
        setProject(null);
        setTeams([]);
        setMembersByTeam({});
        setTasksByUser({});
        setProjectTasks([]);
        setEvents([]);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, [orgId, projectId]);

  async function reloadTasks() {
    if (!orgId || !projectId) return;
    const taskRes = await supabase
      .from("tasks")
      .select("id, title, status, due_date, assignee_id, status_since, created_at, updated_at, project_id, org_id")
      .eq("org_id", orgId as string)
      .eq("project_id", projectId);
    if (taskRes.error) {
      console.error("[reloadTasks] error", taskRes.error);
      setProjectTasks([]);
      setTasksByUser({});
      return;
    }
    const tb: Record<string, TaskMini[]> = {};
    const cards: TaskCard[] = [];
    for (const t of ((taskRes.data ?? []) as DbTask[])) {
      if (!t?.id || !t?.title) continue;
      if (t.assignee_id) {
        (tb[t.assignee_id] ||= []).push({
          id: t.id,
          title: t.title,
          status: (t.status as TaskStatus | null) ?? null,
          due_date: t.due_date ?? null,
        });
      }
      cards.push({
        id: t.id,
        title: t.title,
        status: (t.status as TaskStatus | null) ?? null,
        due_date: t.due_date ?? null,
        status_since: (t as any).status_since ?? null,
        created_at: t.created_at ?? null,
        updated_at: t.updated_at ?? null,
        assignee_id: t.assignee_id ?? null,
      });
    }
    setTasksByUser(tb);
    setProjectTasks(cards);
  }

  const activities: Activity[] = useMemo(() => {
    const a: Activity[] = [];
    for (const e of events) {
      if (!e?.id || !e?.title || !e?.starts_at) continue;
      a.push({
        kind: "event",
        at: e.starts_at,
        title: e.title,
        ...(e.all_day ? { subtitle: "All day" } : {}), // omite a chave quando n e todo dia
      });
    }
    const cutoff = addDays(now(), -7).getTime();
    for (const t of projectTasks) {
      const up = t.updated_at ? new Date(t.updated_at).getTime() : 0;
      const cr = t.created_at ? new Date(t.created_at).getTime() : 0;
      if (up >= cutoff || cr >= cutoff) {
        const when = up >= cutoff ? t.updated_at! : t.created_at!;
        const what = up >= cutoff ? "Tarefa atualizada" : "Tarefa criada";
        a.push({ kind: "task", at: when, title: t.title, subtitle: what });
      }
    }
    return a.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()).slice(0, 30);
  }, [events, projectTasks]);

  const [todo, doing, done] = useMemo(() => {
    const arr = projectTasks.slice();
    const overdueFirst = (t: TaskCard) => {
      const d = t.due_date ? new Date(t.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const isOverdue = d < Date.now() && (t.status !== "done");
      return [isOverdue ? 0 : 1, d, t.created_at ? new Date(t.created_at).getTime() : Number.MAX_SAFE_INTEGER] as const;
    };
    const cmp = (a: TaskCard, b: TaskCard) => {
      const A = overdueFirst(a), B = overdueFirst(b);
      if (A[0] !== B[0]) return A[0] - B[0];
      if (A[1] !== B[1]) return A[1] - B[1];
      return A[2] - B[2];
    };
    const t = arr.filter(x => x.status === "todo").sort(cmp);
    const i = arr.filter(x => x.status === "in_progress").sort(cmp);
    const d = arr.filter(x => x.status === "done").sort(cmp);
    return [t, i, d];
  }, [projectTasks]);

  type Status = "todo" | "in_progress" | "done";

  async function updateTaskStatus(id: string, next: Status) {
    if (!orgId || !projectId) return;
    setMovingId(id);
    const args: Database["api"]["Functions"]["task_upsert"]["Args"] = {
      _org_id: orgId as string,
      _project_id: projectId,
      _id: id,
      _status: next,
    };
    const { error } = await supabase.rpc("task_upsert", args);
    if (error) {
      console.error("[task_upsert] error", error);
      setMovingId(null);
      return;
    }
    await reloadTasks();
    setMovingId(null);
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!project) {
    return (
      <div className="p-6">
        <div className="text-sm text-muted">Projeto nao encontrado.</div>
        <button className="btn mt-3" onClick={() => nav("/projects")}>Voltar para projetos</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 grid gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          {project.description && <div className="text-sm text-muted mt-1">{project.description}</div>}
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={() => nav(-1)}>Voltar</button>
        </div>
      </div>

      <section className="grid gap-3">
        <div className="text-sm text-muted">Quadro Kanban</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KanbanCol
            title={`To do (${todo.length})`}
            items={todo}
            formatAge={formatAge}
            onMove={updateTaskStatus}
            movingId={movingId}
          />
          <KanbanCol
            title={`Doing (${doing.length})`}
            items={doing}
            formatAge={formatAge}
            onMove={updateTaskStatus}
            movingId={movingId}
          />
          <KanbanCol
            title={`Done (${done.length})`}
            items={done}
            formatAge={formatAge}
            onMove={updateTaskStatus}
            movingId={movingId}
          />
        </div>
      </section>

      <section className="grid gap-3">
        <div className="text-sm text-muted">Equipes</div>
        {teams.length === 0 ? (
          <div className="card p-4 text-sm text-muted">Nao ha equipes para esse projeto.</div>
        ) : (
          teams.map((team) => {
            const members: Member[] = membersByTeam[team.id] ?? [];
            const preview = members.slice(0, 3);
            const hasMore = members.length > 3;
            const open = openTeamIds.has(team.id);

            return (
              <div key={team.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{team.name}</div>
                    {team.description && <div className="text-xs opacity-70 mt-0.5">{team.description}</div>}
                    <div className="text-xs opacity-70 mt-1 flex items-center gap-2">
                      <span>Membros:</span>
                      <span>
                        {preview.map((m, i) => (
                          <span key={m.id}>
                            {m.name}{i < preview.length - 1 ? ", " : ""}
                          </span>
                        ))}
                        {hasMore && (
                          <span className="inline-flex items-center justify-center ml-2 w-6 h-6 rounded-full border text-xs">…</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <button className="btn" onClick={() => setOpenTeamIds(prev => {
                    const n = new Set(prev);
                    if (n.has(team.id)) n.delete(team.id); else n.add(team.id);
                    return n;
                  })}>
                    {open ? "▲" : "▼"}
                  </button>
                </div>

                {open && (
                  <div className="mt-3 grid gap-2">
                    {members.length === 0 ? (
                      <div className="text-sm text-muted">Nenhum membro selecionado.</div>
                    ) : (
                      members.map((m: Member) => {
                        const list: TaskMini[] = tasksByUser?.[m.id] ?? [];
                        return (
                          <div key={m.id} className="flex flex-col md:flex-row md:items-start md:justify-between border rounded-md p-2 gap-2">
                            <div>
                              <div className="font-medium">{m.name}</div>
                              {m.email && <div className="text-xs opacity-70">{m.email}</div>}
                              {m.role  && <div className="text-xs opacity-70">Função: {m.role}</div>}
                            </div>
                            <div className="w-full md:w-1/2">
                              <div className="text-xs opacity-70 mb-1">Tarefas</div>
                              <ul className="text-sm grid gap-1">
                                {list.map((t) => (
                                  <li key={t.id} className="flex items-center justify-between border rounded px-2 py-1">
                                    <span>{t.title}</span>
                                    <span className="text-xs opacity-60">
                                      {t.status ?? "—"}{t.due_date ? ` • due ${t.due_date}` : ""}
                                    </span>
                                  </li>
                                ))}
                                {list.length === 0 && <li className="text-xs text-muted">Nenhuma tarefa.</li>}
                              </ul>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      <section className="grid gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted">Atividades (ultimos 7d e proximos 14d)</div>
          <button className="btn" onClick={() => setOpenActivities((o) => !o)}>
            {openActivities ? "▲" : "▼"}
          </button>
        </div>

        {openActivities && (
          <div className="card p-3 grid gap-2">
            {activities.length === 0 ? (
              <div className="text-sm text-muted">Nenhuma atividade recente.</div>
            ) : (
              activities.map((a, i) => (
                <div key={i} className="flex items-center justify-between border rounded px-2 py-1">
                  <div>
                    <div className="text-sm">
                      {a.kind === "event" ? "📅 " : "📝 "}
                      {a.title}
                    </div>
                    {a.subtitle && <div className="text-xs opacity-70">{a.subtitle}</div>}
                  </div>
                  <div className="text-xs opacity-60">{fmtDateTime(a.at)}</div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function KanbanCol({
  title,
  items,
  formatAge,
  onMove,
  movingId,
}: {
  title: string;
  items: TaskCard[];
  formatAge: (since?: string | null, fallback?: string | null) => string;
  onMove?: (id: string, next: "todo" | "in_progress" | "done") => void | Promise<void>;
  movingId?: string | null;
}) {
  return (
    <div className="card p-3 grid gap-2">
      <div className="font-semibold mb-1">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-muted">Nenhuma tarefa encontrada.</div>
      ) : (
        items.map((t) => {
          const since = t.status_since ?? (t.status === "todo" ? t.created_at : t.updated_at);
          const aging = formatAge(since, t.updated_at ?? t.created_at);
          const overdue = t.due_date ? new Date(t.due_date).getTime() < Date.now() && t.status !== "done" : false;
          const leftNext  = t.status === "done" ? "in_progress" : "todo";
          const rightNext = t.status === "todo" ? "in_progress" : "done";
          const leftDisabled  = !t.status || t.status === "todo" || movingId === t.id;
          const rightDisabled = t.status === "done" || movingId === t.id;

          return (
            <div key={t.id} className="border rounded p-2 grid gap-1">
              <div className="flex items-start justify-between">
                <div className="font-medium">{t.title}</div>
                <span className="text-[11px] opacity-70">{aging}</span>
              </div>
              <div className="text-xs opacity-70 flex items-center gap-2">
                <span>Status: {t.status ?? "—"}</span>
                {t.due_date && (
                  <span className={`px-1.5 py-0.5 rounded border ${overdue ? "border-red-300 text-red-600" : "opacity-70"}`}>
                    Data de entrega {t.due_date}
                  </span>
                )}
              </div>
              {onMove && (
                <div className="pt-1 flex flex-wrap gap-1">
                  <button className="btn btn-xs" disabled={leftDisabled}  onClick={() => onMove(t.id, leftNext)}>←</button>
                  <button className="btn btn-xs" disabled={rightDisabled} onClick={() => onMove(t.id, rightNext)}>→</button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
