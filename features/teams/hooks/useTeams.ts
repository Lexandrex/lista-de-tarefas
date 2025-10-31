import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";

type DbTeamRow = Database["api"]["Views"]["teams"]["Row"];
type DbMemberRow = Database["api"]["Views"]["team_members"]["Row"];
type DbMemberUserRow = Database["api"]["Views"]["team_member_users"]["Row"];
type DbUserRow = Database["api"]["Views"]["users"]["Row"];

export type Team = { id: string; org_id: string | null; name: string; description: string | null; created_at?: string | null; updated_at?: string | null; };

const qk = {
  teams: (orgId: string | null) => ["teams", orgId] as const,
  myTeamIds: (orgId: string | null, userId: string | null) => ["myTeamIds", orgId, userId] as const,
  members: (orgId: string | null, teamId: string | null) => ["teamMembers", orgId, teamId] as const,
  orgUsers: (orgId: string | null) => ["orgUsers", orgId] as const,
};

const notNull = <T,>(x: T | null | undefined): x is T => x != null;
const toTeam = (t: DbTeamRow): Team | null => {
  if (!t?.id || !t?.name) return null;
  return { id: t.id, org_id: t.org_id ?? null, name: t.name, description: t.description ?? null, created_at: t.created_at ?? null, updated_at: t.updated_at ?? null };
};

export function useTeams(orgId: string | null) {
  return useQuery({
    queryKey: qk.teams(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<Team[]> => {
      if (!orgId) return [];
      const org = orgId as string;

      const { data, error } = await supabase
        .from("teams")
        .select("id, org_id, name, description, created_at, updated_at")
        .eq("org_id", org);
      if (error) throw error;
      return (data as DbTeamRow[] ?? []).map(toTeam).filter(notNull);
    },
  });
}

export function useMyTeamIds(orgId: string | null, userId: string | null) {
  return useQuery({
    queryKey: qk.myTeamIds(orgId, userId),
    enabled: !!orgId && !!userId,
    queryFn: async () => {
      if (!orgId || !userId) return new Set<string>();
      const org  = orgId  as string;
      const uid  = userId as string;

      const { data, error } = await supabase
        .from("team_members")
        .select("team_id, user_id, org_id")
        .eq("org_id", org)
        .eq("user_id", uid);
      if (error) throw error;
      return new Set((data as DbMemberRow[] ?? []).map(m => m.team_id!).filter(Boolean) as string[]);
    },
  });
}

export function useCreateTeam(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { name: string; description?: string | null }): Promise<Team> => {
      if (!orgId) throw new Error("orgId required");
      const args = {
        _org_id: orgId,
        _name: v.name,
        ...(v.description ? { _description: v.description } : {}),
      } as Database["api"]["Functions"]["team_upsert"]["Args"];
      const { data, error } = await supabase.rpc("team_upsert", args);
      if (error) throw error;
      const row = toTeam(data as DbTeamRow);
      if (!row) throw new Error("Invalid row from team_upsert");
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.teams(orgId) }),
  });
}

export function useUpdateTeam(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; name: string; description?: string | null }): Promise<Team> => {
      if (!orgId) throw new Error("orgId required");
      const args = {
        _org_id: orgId,
        _name: v.name,
        _id: v.id,
        ...(v.description !== undefined ? { _description: v.description ?? "" } : {}),
      } as Database["api"]["Functions"]["team_upsert"]["Args"];
      const { data, error } = await supabase.rpc("team_upsert", args);
      if (error) throw error;
      const row = toTeam(data as DbTeamRow);
      if (!row) throw new Error("Invalid row from team_upsert");
      return row;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.teams(orgId) }),
  });
}

export function useDeleteTeam(orgId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("team_delete", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.teams(orgId) }),
  });
}

export function useTeamMembers(orgId: string | null, teamId: string | null) {
  return useQuery({
    queryKey: qk.members(orgId, teamId),
    enabled: !!orgId && !!teamId,
    queryFn: async (): Promise<DbMemberUserRow[]> => {
      if (!orgId || !teamId) return [];
      const org  = orgId  as string;
      const team = teamId as string;
      const { data, error } = await supabase
        .from("team_member_users")
        .select("team_id, user_id, org_id, role, name, email, created_at")
        .eq("org_id", org)
        .eq("team_id", team)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DbMemberUserRow[];
    },
  });
}

export function useOrgUsers(orgId: string | null) {
  return useQuery({
    queryKey: qk.orgUsers(orgId),
    enabled: !!orgId,
    queryFn: async (): Promise<DbUserRow[]> => {
      if (!orgId) return [];
      const org = orgId as string;
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("org_id", org);
      if (error) throw error;
      return (data ?? []) as DbUserRow[];
    },
  });
}

export function useAddTeamMember(orgId: string | null, teamId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: string; role?: string }) => {
      if (!orgId || !teamId) throw new Error("orgId/teamId required");
      const org  = orgId  as string;
      const team = teamId as string;
      const args = {
        _org_id: org,
        _team_id: team,
        _user_id: payload.user_id,
        ...(payload.role ? { _role: payload.role } : {}),
      } as Database["api"]["Functions"]["team_add_member"]["Args"];

      const { error } = await supabase.rpc("team_add_member", args);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.members(orgId, teamId) }),
  });
}

export function useRemoveTeamMember(orgId: string | null, teamId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      if (!orgId || !teamId) throw new Error("orgId/teamId required");
      const { error } = await supabase.rpc("team_remove_member", {
        _org_id: orgId,
        _team_id: teamId,
        _user_id: user_id,
      } as Database["api"]["Functions"]["team_remove_member"]["Args"]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.members(orgId, teamId) }),
  });
}
