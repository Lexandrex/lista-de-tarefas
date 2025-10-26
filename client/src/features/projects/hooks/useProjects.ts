import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

export type Project = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

const qk = {
  all: (orgId: string | null) => ["projects", orgId] as const,
  byId: (orgId: string | null, id: string | null) => ["projects", orgId, id] as const,
};

export function useProjects(orgId: string | null) {
  return useQuery({
    queryKey: qk.all(orgId),
    enabled: !!orgId,
    queryFn: async () => {
      const q = supabase
        .from("projects")
        .select("id, org_id, name, description, created_at")
        .eq("org_id", orgId!);

      const { data, error } = (await q) as PostgrestSingleResponse<Project[]>;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProject(orgId: string | null, projectId: string | null) {
  const enabled = !!orgId && !!projectId;
  return useQuery({
    queryKey: qk.byId(orgId, projectId),
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, org_id, name, description, created_at")
        .eq("org_id", orgId!)
        .eq("id", projectId!)
        .maybeSingle();

      if (error) throw error;
      return data as Project | null;
    },
  });
}

export function useCreateProject(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { name: string; description?: string | null }) => {
      if (!orgId) throw new Error("orgId required");
      const { data, error } = await supabase
        .from("projects")
        .insert({ org_id: orgId, name: v.name, description: v.description ?? null })
        .select("id, org_id, name, description, created_at")
        .maybeSingle();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.all(orgId) }),
  });
}

export function useUpdateProject(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; name?: string; description?: string | null }) => {
      if (!orgId) throw new Error("orgId required");
      const { data, error } = await supabase
        .from("projects")
        .update({
          ...(v.name !== undefined ? { name: v.name } : {}),
          ...(v.description !== undefined ? { description: v.description } : {}),
        })
        .eq("org_id", orgId)
        .eq("id", v.id)
        .select("id, org_id, name, description, created_at")
        .maybeSingle();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.all(orgId) });
      qc.invalidateQueries({ queryKey: qk.byId(orgId, v.id) });
    },
  });
}

export function useDeleteProject(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("orgId required");
      const { error } = await supabase.from("projects").delete().eq("org_id", orgId).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.all(orgId) }),
  });
}
