import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOrgKey } from "@/lib/useOrgId";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  due_date?: string | null;
  assignee_id?: string | null;
  project_id: string;
  org_id: string;
  created_at?: string;
};

const tk = {
  all: (orgId: string | null) => ["tasks", "all", orgId ?? "none"] as const,
  byProject: (orgId: string | null, projectId: string | null) => ["tasks", "project", orgId ?? "none", projectId ?? "none"] as const,
  byAssignee: (orgId: string | null, userId: string | null) => ["tasks", "assignee", orgId ?? "none", userId ?? "anon"] as const,
};

export function useTasks() {
  const orgId = useOrgKey();
  return useQuery({
    queryKey: tk.all(orgId),
    enabled: orgId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, status, due_date, assignee_id, project_id, org_id, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export function useTasksByProject(projectId: string | null) {
  const orgId = useOrgKey();
  return useQuery({
    queryKey: tk.byProject(orgId, projectId),
    enabled: orgId !== null && !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, status, due_date, assignee_id, project_id, org_id, created_at")
        .eq("org_id", orgId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export function useTasksByAssignee(userId: string | null) {
  const orgId = useOrgKey();
  return useQuery({
    queryKey: tk.byAssignee(orgId, userId),
    enabled: orgId !== null && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, status, due_date, assignee_id, project_id, org_id, created_at")
        .eq("org_id", orgId)
        .eq("assignee_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (input: Omit<Task, "id" | "org_id" | "created_at">) => {
      if (!orgId) throw new Error("Missing org_id");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...input, org_id: orgId })
        .select("id, title, description, status, due_date, assignee_id, project_id, org_id, created_at")
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (input: Partial<Task> & { id: string }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .eq("org_id", orgId)
        .select("id, title, description, status, due_date, assignee_id, project_id, org_id, created_at")
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
