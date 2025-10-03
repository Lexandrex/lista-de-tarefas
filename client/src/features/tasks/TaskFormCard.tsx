import { useEffect, useMemo, useState } from "react";
import TeamPicker, { Team } from "@/components/pickers/TeamPicker";
import MemberMultiPicker, { UserLite } from "@/components/pickers/MemberMultiPicker";

export type ProjectLite = { id: string; name: string; team_id?: string | null };

export type TaskUpsert = {
  id?: string;
  title: string;
  description?: string | null;
  status?: "todo" | "doing" | "done" | null;
  due_date?: string | null;
  project_id: string;
  team_id: string | null;
  assignee_ids: string[];
};

export default function TaskFormCard({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  loadProjects,
  loadTeams,
  loadMembersByTeam,
}: {
  initial?: TaskUpsert;
  onSubmit: (values: TaskUpsert) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  loadProjects: () => Promise<ProjectLite[]>;
  loadTeams: () => Promise<Team[]>;
  loadMembersByTeam: (teamId: string | null) => Promise<UserLite[]>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TaskUpsert["status"]>(initial?.status ?? "todo");
  const [due, setDue] = useState(initial?.due_date ?? "");
  const [projectId, setProjectId] = useState(initial?.project_id ?? "");
  const [teamId, setTeamId] = useState<string | null>(initial?.team_id ?? null);
  const [assignees, setAssignees] = useState<string[]>(initial?.assignee_ids ?? []);

  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setProjectsLoading(true);
    loadProjects().then((rows) => { if (!active) return; setProjects(rows); setProjectsLoading(false); });
    return () => { active = false; };
  }, [loadProjects]);
  useEffect(() => {
    const p = projects.find((p) => p.id === projectId);
    const defaultTeam = p?.team_id ?? null;
    setTeamId((prev) => (initial?.team_id ? prev : defaultTeam));
    setAssignees([]);
  }, [projectId, projects, initial?.team_id]);

  function normalize(v: Omit<TaskUpsert, "id">): Omit<TaskUpsert, "id"> {
    return {
      ...v,
      description: v.description || null,
      status: v.status || "todo",
      due_date: v.due_date || null,
      team_id: v.team_id ?? null,
      assignee_ids: v.assignee_ids ?? [],
    };
  }

  async function submit(e: React.FormEvent) {
  e.preventDefault();
  const payload = {
    ...(initial?.id ? { id: initial.id } : {}),
    title,
    description: description || null,
    status: status || "todo",
    due_date: due || null,
    project_id: projectId,
    team_id: teamId ?? null,
    assignee_ids: assignees,
  } as const;

  await onSubmit(payload as any);
  }


  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 880 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 160px 160px" }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required style={input} />
        <select value={status ?? "todo"} onChange={(e) => setStatus(e.target.value as any)} style={input}>
          <option value="todo">todo</option>
          <option value="doing">doing</option>
          <option value="done">done</option>
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={input} />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Project</span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
          style={{ ...input, width: 360 }}
        >
          <option value="" disabled>Select project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Assign team</span>
        <TeamPicker value={teamId} onChange={setTeamId} loadTeams={loadTeams} placeholder="No team" />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Assign members</span>
        <MemberMultiPicker
          teamId={teamId}
          value={assignees}
          onChange={setAssignees}
          loadMembersByTeam={loadMembersByTeam}
        />
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Description</span>
        <textarea rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} style={input} />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" style={btnPrimary}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} style={btn}>Cancel</button>}
      </div>
    </form>
  );
}

const input: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "8px 10px" };
const btn: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "8px 12px", background: "#fff", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#111827", color: "#fff", borderColor: "#111827" };
