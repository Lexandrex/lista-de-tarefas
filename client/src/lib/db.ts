import { useProfile } from './auth';
import { supabase } from './supabase/browserClient';

export function useOrgId(): string | null {
  const { data: profile } = useProfile();
  return profile?.org_id ?? null;
}

export async function orgSelect<T = any>(
  table: string,
  org_id: string,
  select: string = '*'
) {
  return supabase.from<T>(table).select(select).eq('org_id', org_id);
}

export async function orgInsert<T extends Record<string, any>>(
  table: string,
  org_id: string,
  payload: T | T[]
) {
  const rows = Array.isArray(payload) ? payload : [payload];
  return supabase.from(table).insert(rows.map(r => ({ ...r, org_id })));
}

export async function orgUpdate<T extends Record<string, any>>(
  table: string,
  org_id: string,
  match: Record<string, any>,
  values: Partial<T>
) {
  return supabase.from(table).update(values).match({ ...match, org_id });
}

export async function orgDelete(
  table: string,
  org_id: string,
  match: Record<string, any>
) {
  return supabase.from(table).delete().match({ ...match, org_id });
}

export async function listTeams(org_id: string) {
  return orgSelect('teams', org_id, '*');
}
export async function createTeam(org_id: string, name: string, description?: string) {
  return orgInsert('teams', org_id, { name, description });
}
