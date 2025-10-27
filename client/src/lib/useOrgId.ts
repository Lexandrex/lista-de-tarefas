import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/useAuth";

export function useOrgId() {
  const { user, isLoading: authLoading } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // authloading = 1 user logado
    if (authLoading) return;

    // if logged out clear and stop
    if (!user?.id) {
      setOrgId(null);
      setErr(null);
      setLoading(false);
      return;
    }

    // when logged in fetch org_id
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error) setErr(error.message);
      setOrgId(data?.org_id ?? null);
      setLoading(false);
    })();

    return () => { active = false; };
  }, [user?.id, authLoading]);
  return { orgId, loading, err };
}

export function useOrgKey(): string | null {
  const { orgId, loading } = useOrgId();
  return loading ? null : orgId;
}
