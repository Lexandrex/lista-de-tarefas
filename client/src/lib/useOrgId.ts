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
    async function run() {
      if (authLoading || !user?.id) {
        setLoading(false);
        setOrgId(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) setErr(error.message);
      setOrgId(data?.org_id ?? null);
      setLoading(false);
    }
    run();
    return () => {
      active = false;
    };
  }, [user?.id, authLoading]);
  return { orgId, loading, err };
}

export function useOrgKey(): string | null {
  const { orgId, loading } = useOrgId();
  return loading ? null : orgId;
}
