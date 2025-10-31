import { useEffect, useMemo, useState } from "react";
import type { LiteProject, LiteTeam, LiteMember, Task } from "@/features/tasks/hooks/useTasks";

export function TaskFormCard({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  loadProjects,
  loadTeams,
  loadMembersByTeam,
}: {
  initial: Partial<Pick<Task, "id" | "title" | "description" | "status" | "due_date" | "project_id" | "team_id" | "assignee_id">>;
  submitLabel: string;
  onSubmit: (v: {
    id?: string;
    title: string;
    description?: string | null;
    status?: Task["status"];
    due_date?: string | null;
    project_id: string;
    team_id?: string | null;
    assignee_id?: string | null;
  }) => Promise<void> | void;
  onCancel: () => void;
  loadProjects: () => Promise<LiteProject[]>;
  loadTeams: () => Promise<LiteTeam[]>;
  loadMembersByTeam: (teamId: string) => Promise<LiteMember[]>;
}) {
  const isCreate = !initial?.id;

  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus] = useState<"todo" | "doing" | "done">(initial.status ?? "todo");
  const [due, setDue] = useState<string>(initial.due_date ?? "");
  const [projectId, setProjectId] = useState<string | "">(initial.project_id ?? "");
  const [teamId, setTeamId] = useState<string | "">(initial.team_id ?? "");
  const [assigneeId, setAssigneeId] = useState<string | "">(initial.assignee_id ?? "");
  const [projects, setProjects] = useState<LiteProject[]>([]);
  const [teams, setTeams] = useState<LiteTeam[]>([]);
  const [members, setMembers] = useState<LiteMember[]>([]);

  // load listas
  useEffect(() => {
    let live = true;
    (async () => {
      const [ps, ts] = await Promise.all([loadProjects(), loadTeams()]);
      if (!live) return;
      setProjects(ps);
      setTeams(ts);
    })().catch(console.error);
    return () => { live = false; };
  }, [loadProjects, loadTeams]);

  const projectTeam = useMemo(() => projects.find(p => p.id === projectId)?.team_id ?? "", [projects, projectId]);
  useEffect(() => {
    if (projectId && projectTeam && !teamId) setTeamId(projectTeam);
  }, [projectId, projectTeam, teamId]);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!teamId) { setMembers([]); return; }
      const rows = await loadMembersByTeam(teamId);
      if (!live) return;
      setMembers(rows);
    })().catch(console.error);
    return () => { live = false; };
  }, [teamId, loadMembersByTeam]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;

    const payload = {
      ...(initial.id ? { id: initial.id } : {}),
      title,
      description: description ?? null,
      status,
      due_date: due || null,
      project_id: projectId as string,
      team_id: (teamId as string) || null,
      assignee_id: (assigneeId as string) || null,
    };
    await onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Titulo</span>
        <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Escolha um projeto</span>
          <select className="select" value={projectId} onChange={e => setProjectId(e.target.value)} required>
            <option value="">Selecione um projeto</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm opacity-80">Equipe</span>
          <select className="select" value={teamId} onChange={e => setTeamId(e.target.value)}>
            <option value="">Nenhuma equipe selecionada</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm opacity-80">Escolha um funcionario</span>
          <select className="select" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
            <option value="">Selecione um membro</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name ?? m.email ?? m.id}</option>)}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm opacity-80">Status</span>
          <select className="select" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="todo">A fazer</option>
            <option value="doing">Fazendo</option>
          </select>
        </label>
      </div>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Prazo de finalização</span>
        <input className="input w-44" type="date" value={due} onChange={e => setDue(e.target.value)} />
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Descrição</span>
        <textarea className="input" rows={3} value={description ?? ""} onChange={e => setDescription(e.target.value)} />
      </label>

      <div className="flex gap-2">
        <button className="btn btn-primary" type="submit">{submitLabel}</button>
        <button className="btn" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
