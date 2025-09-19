import { supabase } from "@/lib/supabase";
import type {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

export async function orgSelectMany<T = any>(
  table: string,
  org_id: string,
  select = "*"
): Promise<PostgrestResponse<T>> {
  const res = await supabase
    .from<any, any>(table)
    .select(select as any)
    .eq("org_id", org_id);
  return res as PostgrestResponse<T>;
}

export async function orgSelectOne<T = any>(
  table: string,
  org_id: string,
  select = "*"
): Promise<PostgrestSingleResponse<T>> {
  const res = await supabase
    .from<any, any>(table)
    .select(select as any)
    .eq("org_id", org_id)
    .maybeSingle();
  return res as PostgrestSingleResponse<T>;
}

export async function orgInsert<T = any>(
  table: string,
  org_id: string,
  payload: Record<string, any>
): Promise<PostgrestSingleResponse<T>> {
  const res = await supabase
    .from<any, any>(table)
    .insert({ ...payload, org_id })
    .select()
    .maybeSingle();
  return res as PostgrestSingleResponse<T>;
}

export async function orgUpdate<T = any>(
  table: string,
  org_id: string,
  match: Record<string, any>,
  patch: Record<string, any>
): Promise<PostgrestResponse<T>> {
  const res = await supabase
    .from<any, any>(table)
    .update(patch)
    .match({ ...match, org_id })
    .select();
  return res as PostgrestResponse<T>;
}

export async function orgUpsert<T = any>(
  table: string,
  org_id: string,
  payload: Record<string, any>
): Promise<PostgrestSingleResponse<T>> {
  const res = await supabase
    .from<any, any>(table)
    .upsert({ ...payload, org_id })
    .select()
    .maybeSingle();
  return res as PostgrestSingleResponse<T>;
}

export async function orgDelete(
  table: string,
  org_id: string,
  match: Record<string, any>
) {
  return supabase.from<any, any>(table).delete().match({ ...match, org_id });
}

export async function listOrgUsers(orgId: string) {
  return supabase.from("profiles").select("id,email,org_id").eq("org_id", orgId);
}