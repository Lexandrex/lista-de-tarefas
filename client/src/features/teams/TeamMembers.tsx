// features/teams/TeamMembers.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { listOrgUsers } from "@/lib/db"; 

type Member = { id: string; email: string };
type TM = { id: string; team_id: string; user_id: string; org_id: string };

export default function TeamMembers({ teamId, orgId }: { teamId: string; orgId: string }) {
  const [members, setMembers] = useState<(TM & Member)[]>([]);
  const [orgUsers, setOrgUsers] = useState<Member[]>([]);
  const [pick, setPick] = useState("");

  async function load() {
    const [tm, users] = await Promise.all([
      supabase.from("team_members")
        .select("id,team_id,user_id,org_id, profiles: user_id ( id, email )")
        .eq("team_id", teamId),
      listOrgUsers(orgId),
    ]);
    setMembers((tm.data || []).map(r => ({ ...r, id: r.id, email: (r as any).profiles.email })));
    setOrgUsers((users.data || []).map(u => ({ id: u.id, email: u.email })));
  }

  async function add() {
    if (!pick) return;
    await supabase.from("team_members").insert({ team_id: teamId, user_id: pick });
    setPick("");
    load();
  }

  async function remove(user_id: string) {
    await supabase.from("team_members").delete().match({ team_id: teamId, user_id });
    load();
  }

  useEffect(() => { load(); }, [teamId]);

  const available = orgUsers.filter(u => !members.some(m => m.user_id === u.id));

  return (
    <div style={{padding:12, border:"1px solid #e5e7eb", borderRadius:8}}>
      <h4>Members</h4>
      <ul>{members.map(m => (
        <li key={m.user_id} style={{display:"flex", justifyContent:"space-between", padding:"4px 0"}}>
          <span>{m.email}</span>
          <button onClick={() => remove(m.user_id)}>Remove</button>
        </li>
      ))}</ul>
      <div style={{display:"flex", gap:8, marginTop:8}}>
        <select value={pick} onChange={e=>setPick(e.target.value)}>
          <option value="">Add member…</option>
          {available.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
        </select>
        <button onClick={add} disabled={!pick}>Add</button>
      </div>
    </div>
  );
}
