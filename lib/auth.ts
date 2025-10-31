import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";

export type Role = "admin" | "member";

type DbProfile = {
  id: string;
  org_id: string | null;
  full_name: string | null;
  email: string | null;
  is_admin: boolean;
};

export type Profile = {
  id: string;
  org_id: string | null;
  full_name: string | null;
  email: string | null;
  role: Role;
};

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: 60_000,
  });
}

export function useAuthListener() {
  const qc = useQueryClient();
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ['session'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    });
    return () => subscription.subscription.unsubscribe();
  }, [qc]);
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) return null;
      const sbPublic = (supabase as any).schema("public");
      const { data, error } = await sbPublic
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;

      const row = data as DbProfile;
      return {
        id: row.id,
        org_id: row.org_id,
        full_name: row.full_name,
        email: row.email,
        role: row.is_admin ? "admin" : "member",
      };
    },
    staleTime: 60_000,
  });
}

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function logout() {
  await supabase.auth.signOut();
}
export async function signup(email: string, password: string) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}
