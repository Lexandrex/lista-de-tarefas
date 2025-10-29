import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGate } from "@/lib/RoleGate";
import { useAuth } from "@/app/useAuth";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase/types";
import TeamFormCard, { type TeamFormInitial } from "./TeamFormCard";

type DbTeamRow = Database["api"]["Views"]["teams"]["Row"];
type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  org_id: string | null;
};
type Team = { id: string; name: string; description?: string | null };

export default function TeamsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [orgId, setOrgId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Team | null>(null);

  // Buscar o org_id do perfil do usuário
  useEffect(() => {
    if (!userId) {
      setOrgId(null);
      return;
    }

    const fetchOrgId = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('org_id')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Erro ao buscar org_id:', error);
          return;
        }

        console.log('Profile data:', data);
        setOrgId(data?.org_id);
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      }
    };

    fetchOrgId();
  }, [userId]);

  const toTeam = (t: DbTeamRow): Team | null => {
    if (!t?.id || !t?.name) return null;
    return { id: t.id, name: t.name, description: t.description ?? null };
  };
  const notNull = <T,>(x: T | null | undefined): x is T => x != null;

  useEffect(() => {
    let live = true;
    (async () => {
      if (!orgId) { setTeams([]); return; }
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, description, org_id")
        .eq("org_id", orgId as string)
        .order("name", { ascending: true });
      if (error) throw error;
      if (!live) return;
      setTeams(((data ?? []) as DbTeamRow[]).map(toTeam).filter(notNull));
    })().catch((e) => {
      console.error("[Teams] load error", e);
      setTeams([]);
    });
    return () => { live = false; };
  }, [orgId]);

  const filtered = useMemo(
    () => teams.filter((t) => t.name.toLowerCase().includes(q.toLowerCase())),
    [teams, q]
  );

  // member picker loader
  const loadOrgUsers = useCallback(async () => {
    if (!orgId) {
      console.log('Sem orgId, retornando lista vazia');
      return [];
    }
    
    console.log('Carregando usuários para org:', orgId);
    
    try {
      // Primeiro, vamos buscar todos os perfis da organização
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("org_id", orgId);
        
      if (error) {
        console.error('Erro ao carregar perfis:', error);
        return [];
      }

      console.log('Perfis carregados:', data);
      
      // Mapear os perfis para o formato esperado pelo componente
      return (data ?? [])
        .filter(profile => profile && profile.id) // Garantir que temos um ID válido
        .map(profile => ({
          id: profile.id as string,
          label: String(profile.id) // Garantir que é uma string
        }));
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      return [];
    }
  }, [orgId]);

  // upsert team e add members
  const upsertTeam = useCallback(async (v: TeamFormInitial) => {
    if (!orgId) throw new Error("orgId required");
    const isEdit = !!v.id;
    const args = {
      _org_id: orgId as string,
      ...(isEdit ? { _id: v.id! } : {}),
      _name: v.name,
      ...(v.description !== undefined ? { _description: v.description ?? "" } : {}),
    } as Database["api"]["Functions"]["team_upsert"]["Args"];

    console.log('Tentando criar/atualizar time com args:', args);
    const { data, error } = await supabase.rpc("team_upsert", args);
    if (error) {
      console.error('Erro ao criar/atualizar time:', error);
      throw error;
    }

    const row = data as DbTeamRow | null;
    console.log('Resposta do team_upsert:', row);
    if (!row?.id) throw new Error("team_upsert returned no id");

    const safe = toTeam(row)!;
    setTeams((prev) => {
      const exists = prev.some((t) => t.id === safe.id);
      return exists ? prev.map((t) => (t.id === safe.id ? safe : t)) : [safe, ...prev];
    });

    if (!isEdit) {
      const addIds = new Set<string>(v.member_ids ?? []);
      if (userId && (v.member_ids ?? []).includes(userId)) {
      }
      const adds = Array.from(addIds).map((uid) =>
        supabase.rpc("team_add_member", {
          _org_id: orgId as string,
          _team_id: row.id!,
          _user_id: uid,
          _role: "member",
        } as Database["api"]["Functions"]["team_add_member"]["Args"])
      );
      await Promise.allSettled(adds);
    }

    setEditing(null);
  }, [orgId, userId]);

  const deleteTeam = useCallback(async (id: string) => {
    const { error } = await supabase.rpc("team_delete", { _id: id } as any);
    if (error) throw error;
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
        {!orgId ? (
          <div className="text-red-600">
            Você não está associado a nenhuma organização. Entre em contato com o administrador.
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              className="input w-72"
              placeholder="Search teams"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <RoleGate required="admin">
              <button
                className="btn btn-primary"
                onClick={() => setEditing({ name: "", description: "" } as Team)}
              >
                + Create
              </button>
            </RoleGate>
          </div>
        )}
      </div>

      <section className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="card p-4 text-sm text-muted">No teams found.</div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                {t.description && <div className="text-sm text-muted">{t.description}</div>}
              </div>
              <RoleGate required="admin">
                <div className="flex gap-2">
                  <button className="btn" onClick={() => setEditing(t)}>Edit</button>
                  <button className="btn text-red-600" onClick={() => deleteTeam(t.id)}>Delete</button>
                </div>
              </RoleGate>
            </div>
          ))
        )}
      </section>

      <RoleGate required="admin">
        {editing && (
          <div className="card p-4">
            <div className="text-sm text-muted mb-2">{editing.id ? "Edit Team" : "Create Team"}</div>
            <TeamFormCard
              initial={{
                ...(editing.id ? { id: editing.id } : {}),
                name: editing.name,
                description: editing.description ?? "",
              }}
              meId={userId}
              loadOrgUsers={loadOrgUsers}
              submitLabel={editing.id ? "Save changes" : "Create"}
              onSubmit={upsertTeam}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}
      </RoleGate>
    </div>
  );
}
