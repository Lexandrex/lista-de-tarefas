import { useEffect, useState } from "react";
import { useSession } from "@/app/AuthProvider";
import { supabase } from "@/lib/supabase";

export function useOrgId() {
  const session = useSession();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!session?.user?.id) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) setErr(error.message);
      setOrgId(data?.org_id ?? null);
      setLoading(false);
    }
    run();
    return () => { active = false; };
  }, [session?.user?.id]);

  return { orgId, loading, err };
}
