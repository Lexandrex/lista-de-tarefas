import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOrgKey } from "@/lib/useOrgId";

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  org_id: string;
  team_id?: string | null;
  created_at?: string;
};

const qk = {
  all: (orgId: string | null) => ["projects", "all", orgId ?? "none"] as const,
  byId: (orgId: string | null, id: string | null) => ["projects", "one", orgId ?? "none", id ?? "unknown"] as const,
};

export function useProjects() {
  const orgId = useOrgKey();
  return useQuery({
    queryKey: qk.all(orgId),
    enabled: orgId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, org_id, team_id, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null; team_id?: string | null }) => {
      if (!orgId) throw new Error("Missing org_id");
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...input, org_id: orgId })
        .select("id, name, description, org_id, team_id, created_at")
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; description?: string | null; team_id?: string | null }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("projects")
        .update(patch)
        .eq("id", id)
        .eq("org_id", orgId)
        .select("id, name, description, org_id, team_id, created_at")
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
