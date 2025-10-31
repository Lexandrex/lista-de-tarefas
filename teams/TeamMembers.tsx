import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/useAuth";
import { RoleGate } from "@/lib/RoleGate";
import {
  useTeamMembers,
  useAddTeamMember,
  useRemoveTeamMember,
  useOrgUsers,
} from "@/features/teams/hooks/useTeams";

export default function TeamMembersPage() {
  const nav = useNavigate();
  const { id: teamId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const orgId = (user as any)?.user_metadata?.org_id as string | null;

  const { data: members = [] } = useTeamMembers(orgId, teamId ?? null);
  const { data: users = [] } = useOrgUsers(orgId);

  const addMember = useAddTeamMember(orgId, teamId ?? null);
  const removeMember = useRemoveTeamMember(orgId, teamId ?? null);

  const [filter, setFilter] = useState("");
  const [pickUserId, setPickUserId] = useState<string>("");

  const filteredMembers = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return members;
    return members.filter(m =>
      (m.name ?? "").toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q)
    );
  }, [members, filter]);

  async function onAdd() {
    if (!pickUserId) return;
    await addMember.mutateAsync({ user_id: pickUserId });
    setPickUserId("");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Team Members</div>
        <button className="btn" onClick={() => nav("/teams")}>Back</button>
      </div>

      <div className="flex items-center justify-between">
        <input className="input w-72" placeholder="Filter members" value={filter} onChange={e => setFilter(e.target.value)} />
        <RoleGate required="admin">
          <div className="flex items-center gap-2">
            <select className="select w-72" value={pickUserId} onChange={e => setPickUserId(e.target.value)}>
              <option value="">Add user…</option>
              {users.map(u => (
                <option key={u.id!} value={u.id!}>
                  {u.name ?? u.email ?? u.id}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={onAdd} disabled={!pickUserId}>Add</button>
          </div>
        </RoleGate>
      </div>

      <section className="grid gap-3">
        {filteredMembers.length === 0 ? (
          <div className="card p-4 text-sm text-muted">No members yet.</div>
        ) : (
          filteredMembers.map(m => (
            <div key={m.user_id!} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{m.name ?? m.email ?? m.user_id}</div>
                <div className="text-xs text-muted">{m.role ?? "member"}</div>
              </div>
              <RoleGate required="admin">
                <button className="btn text-red-600" onClick={() => removeMember.mutate(m.user_id!)}>Remove</button>
              </RoleGate>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
