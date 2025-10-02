import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOrgId } from "@/lib/useOrgId";

function useOrgKey(): string | null {
  const raw: any = useOrgId();
  if (typeof raw === "string") return raw || null;
  return raw?.id ?? raw?.org_id ?? raw?.value ?? null;
}

export type Team = {
  id: string;
  name: string;
  description?: string | null;
  org_id: string;
  created_at?: string;
};

const qk = {
  all: (orgId: string | null) => ["teams", "all", orgId ?? "none"] as const,
  mine: (orgId: string | null, userId: string | null) => ["teams", "mine", orgId ?? "none", userId ?? "anon"] as const,
  byId: (orgId: string | null, id: string) => ["teams", "one", orgId ?? "none", id] as const,
};

export function useTeams() {
  const orgId = useOrgKey();
  return useQuery({
    queryKey: qk.all(orgId),
    enabled: orgId !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, description, org_id, created_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Team[];
    },
  });
}

export function useMyTeams(userId: string | null) {
  const orgId = useOrgKey();
  return useQuery({
    queryKey: qk.mine(orgId, userId),
    enabled: orgId !== null && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("teams(id, name, description, org_id, created_at)")
        .eq("org_id", orgId)
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.teams) as Team[];
    },
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null }) => {
      if (!orgId) throw new Error("Missing org_id");
      const { data, error } = await supabase
        .from("teams")
        .insert({ ...input, org_id: orgId })
        .select("id, name, description, org_id, created_at")
        .single();
      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; description?: string | null }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("teams")
        .update(patch)
        .eq("id", id)
        .eq("org_id", orgId)
        .select("id, name, description, org_id, created_at")
        .single();
      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  const orgId = useOrgKey();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id)
        .eq("org_id", orgId);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
