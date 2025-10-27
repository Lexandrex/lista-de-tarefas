import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: { org_id?: string | null; is_admin?: boolean } | null;
  isLoading: boolean;
};

type AuthProfile = {
  org_id: string | null;
  is_admin: boolean;
};

export const AuthContext = createContext<AuthValue>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
});

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ org_id?: string | null; is_admin?: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      setSession(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null);
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("org_id, is_admin")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      const next: AuthProfile | null =
        error || !data
          ? null
          : {
              org_id: data.org_id ?? null,
              is_admin: !!data.is_admin,
            };
      setProfile(next);
      setIsLoading(false);
    }
    setIsLoading(true);
    loadProfile();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const value: AuthValue = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
    }),
    [session, profile, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
