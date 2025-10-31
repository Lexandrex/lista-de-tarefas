import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

type DbTaskRow = Database["api"]["Views"]["tasks"]["Row"];
type DbProjectRow = Database["api"]["Views"]["projects"]["Row"];
type DbTeamRow = Database["api"]["Views"]["teams"]["Row"];
type DbMemberUser = Database["api"]["Views"]["team_member_users"]["Row"];
type TaskStatus = NonNullable<Database["api"]["Functions"]["task_upsert"]["Args"]["_status"]>;
// type TaskUpsertArgs = Database["api"]["Functions"]["task_upsert"]["Args"];

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "doing" | "done";
  due_date: string | null;
  assignee_id: string | null;
  project_id: string;
  team_id: string | null;
  org_id?: string | null;
};

export type LiteProject = { id: string; name: string; team_id: string | null };
export type LiteTeam    = { id: string; name: string };
export type LiteMember  = { id: string; name: string | null; email: string | null };

const qk = {
  all: (orgId: string | null) => ["tasks", orgId] as const,
  byProject: (orgId: string | null, projectId: string | null) => ["tasks", orgId, "project", projectId] as const,
};

const notNull = <T,>(x: T | null | undefined): x is T => x != null;
const fromDB = (s: NonNullable<DbTaskRow["status"]>): "todo" | "doing" | "done" => s === "in_progress" ? "doing" : s;
const toDB = (s: "todo" | "doing" | "done"): TaskStatus => (s === "doing" ? "in_progress" : s);
const toTask = (t: DbTaskRow) => t?.id && t?.title && t?.project_id ? {
  id: t.id,
  title: t.title,
  description: t.description ?? null,
  status: fromDB((t.status ?? "todo") as NonNullable<DbTaskRow["status"]>),
  due_date: t.due_date ?? null,
  assignee_id: t.assignee_id ?? null,
  project_id: t.project_id,
  team_id: t.team_id ?? null,
  org_id: t.org_id ?? null,
} : null;


export function ymd(x: Date | string | null | undefined): string | undefined {
  if (!x) return undefined;
  if (x instanceof Date) {
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const d = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return x;
}

export function useTasksByProject(orgId: string | null, projectId: string | null) {
  return useQuery({
    queryKey: qk.byProject(orgId, projectId),
    enabled: !!orgId && !!projectId,
    queryFn: async (): Promise<Task[]> => {
      if (!orgId || !projectId) return [];
      const org = orgId as string;
      const pid = projectId as string;

      const { data, error } = await supabase
        .from("tasks")
        .select("id, org_id, project_id, title, description, status, due_date, assignee_id, team_id")
        .eq("org_id", org)
        .eq("project_id", pid)
        .order("due_date", { ascending: true });
      if (error) throw error;

      return (data as DbTaskRow[] ?? []).map(toTask).filter(notNull);
    },
  });
}

export function useTasksAll(orgId: string | null) {
  return useQuery({
    queryKey: qk.all(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<Task[]> => {
      if (!orgId) return [];
      const org = orgId as string;

      const { data, error } = await supabase
        .from("tasks")
        .select("id, org_id, project_id, title, description, status, due_date, assignee_id, team_id")
        .eq("org_id", org)
        .order("due_date", { ascending: true });
      if (error) throw error;

      return (data as DbTaskRow[] ?? []).map(toTask).filter(notNull);
    },
  });
}

// dropdown loaders

export async function loadProjects(orgId: string | null): Promise<LiteProject[]> {
  if (!orgId) return [];
  const org = orgId as string;
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, team_id, org_id")
    .eq("org_id", org)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DbProjectRow[]).map(p => {
    if (!p?.id || !p?.name) return null;
    return { id: p.id, name: p.name, team_id: p.team_id ?? null } as LiteProject;
  }).filter(notNull);
}

export async function loadTeams(orgId: string | null): Promise<LiteTeam[]> {
  if (!orgId) return [];
  const org = orgId as string;
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, org_id")
    .eq("org_id", org)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DbTeamRow[]).map(t => {
    if (!t?.id || !t?.name) return null;
    return { id: t.id, name: t.name } as LiteTeam;
  }).filter(notNull);
}

export async function loadMembersByTeam(orgId: string | null, teamId: string | null): Promise<LiteMember[]> {
  if (!orgId || !teamId) return [];
  const org = orgId as string;
  const tid = teamId as string;
  const { data, error } = await supabase
    .from("team_member_users")
    .select("team_id, user_id, org_id, name, email")
    .eq("org_id", org)
    .eq("team_id", tid)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DbMemberUser[]).map(m => ({
    id: m.user_id!,
    name: m.name ?? null,
    email: m.email ?? null,
  } as LiteMember));
}

// Mutacoes

export function useCreateTask(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      title: string;
      description?: string | null;
      status?: Task["status"];
      due_date?: string | null;
      project_id: string;
      team_id?: string | null;
      assignee_id?: string | null;
    }): Promise<Task> => {
      if (!orgId) throw new Error("orgId required");
      // NOTE: Historically this used the RPC `task_upsert`, but after a merge
      // the DB had multiple overloaded versions of the function and PostgREST
      // could not unambiguously choose one (PGRST203). A fix was applied in
      // branch `fix/tasks-projects` (commit c94a0ca) to use direct table
      // operations instead of the RPC. This comment documents that reason.
      const args = {
        _org_id: orgId as string,
        _project_id: v.project_id,
        _title: v.title,
        _status: toDB(v.status ?? "todo"),
        ...(v.description !== undefined ? { _description: v.description ?? "" } : {}),
        ...(v.due_date != null ? { _due_date: v.due_date } : {}),
        ...(v.assignee_id != null ? { _assignee_id: v.assignee_id } : {}),
        ...(v.team_id ? { _team_id: v.team_id } : {}),
      } as Database["api"]["Functions"]["task_upsert"]["Args"];

      const { data, error } = await supabase.rpc("task_upsert", args);
      if (error) throw error;

      const row = data ? toTask(data as DbTaskRow) : null;
      if (!row) throw new Error("Invalid row from task_upsert");
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.all(orgId) });
    },
  });
}

export function useUpdateTask(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      id: string;
      title?: string;
      description?: string | null;
      status?: Task["status"];
      due_date?: string | null;
      project_id: string;
      team_id?: string | null;
      assignee_id?: string | null;
    }): Promise<Task> => {
      if (!orgId) throw new Error("orgId required");

      const args = {
        _org_id: orgId as string,
        _project_id: v.project_id,
        _id: v.id,
        _title: v.title ?? "",
        _status: toDB(v.status ?? "todo"),
        ...(v.description !== undefined ? { _description: v.description ?? "" } : {}),
        ...(v.due_date != null ? { _due_date: v.due_date } : {}),
        ...(v.assignee_id != null ? { _assignee_id: v.assignee_id } : {}),
        ...(v.team_id ? { _team_id: v.team_id } : {}),
      } as Database["api"]["Functions"]["task_upsert"]["Args"];

      const { data, error } = await supabase.rpc("task_upsert", args);
      if (error) throw error;

      const row = data ? toTask(data as DbTaskRow) : null;
      if (!row) throw new Error("Invalid row from task_upsert");
      return row;
    },
    onSuccess: (_row, v) => {
      qc.invalidateQueries({ queryKey: qk.all(orgId) });
      qc.invalidateQueries({ queryKey: qk.byProject(orgId, v.project_id) });
    },
  });
}

export function useDeleteTask(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("task_delete", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.all(orgId) });
    },
  });
}
