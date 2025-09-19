/*
import { useQuery } from '@tanstack/react-query';
import { useOrgId } from '../../../lib/db';
import { supabase } from "@/lib/supabase";

export function useTeams() {
  const org_id = useOrgId();
  return useQuery({
    enabled: !!org_id,
    queryKey: ['teams', org_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('org_id', org_id as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
*/