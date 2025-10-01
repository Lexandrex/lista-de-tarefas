import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/app/AuthProvider";
import { useOrgId } from "@/lib/useOrgId";
import { orgSelectMany, orgInsert, orgUpdate, orgDelete } from "@/lib/db";

type Team = { id: string; name: string; org_id: string; description?: string | null };
type Project = { id: string; name: string; team_id: string | null; org_id: string };
type Member = { id: string; email: string; full_name: string | null; avatar_url: string | null };

export default function Teams() {
  const session = useSession();
  const me = session?.user?.id ?? null;
  const { orgId, loading: orgLoading, err: orgErr } = useOrgId();

  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>({});
  const [orgUsers, setOrgUsers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [manageOpen, setManageOpen] = useState<Record<string, boolean>>({});
  const [newName, setNewName] = useState("");

  async function load() {
    if (!orgId) return;
    setLoading(true);
    setErr(null);

    const [teamsRes, projectsRes, tmemRes, meRes] = await Promise.all([
      orgSelectMany<Team>("teams", orgId, "id,name,org_id,description"),
      orgSelectMany<Project>("projects", orgId, "id,name,team_id,org_id"),
      supabase
        .from("team_members")
        .select("team_id, profiles:user_id ( id, email, full_name, avatar_url )")
        .eq("org_id", orgId),
      me
        ? supabase.from("profiles").select("is_admin").eq("id", me).single()
        : Promise.resolve({ data: null, error: null } as any),
    ]);

    if (teamsRes.error) setErr(teamsRes.error.message);
    if (projectsRes.error) setErr(projectsRes.error.message || err);
    if (tmemRes.error) setErr(tmemRes.error.message || err);
    if (meRes && (meRes as any).error) setErr((meRes as any).error.message || err);

    setTeams(teamsRes.data || []);
    setProjects(projectsRes.data || []);

    const map: Record<string, Member[]> = {};
    (tmemRes.data || []).forEach((r: any) => {
      const teamId: string = r.team_id;
      const p = r.profiles as { id: string; email: string; full_name: string | null; avatar_url: string | null } | null;
      if (!p) return;
      (map[teamId] ||= []).push({
        id: p.id,
        email: p.email,
        full_name: p.full_name ?? null,
        avatar_url: p.avatar_url ?? null,
      });
    });
    setMembersByTeam(map);

    const admin = !!(meRes?.data?.is_admin);
    setIsAdmin(admin);

    if (admin) {
      const ures = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url")
        .eq("org_id", orgId);
      if (ures.error) setErr(ures.error.message || err);
      setOrgUsers(
        (ures.data || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name ?? null,
          avatar_url: u.avatar_url ?? null,
        }))
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!orgId) return;
    load();

    const ch = supabase
      .channel("teams-directory")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => load())
      .subscribe();

    return () => { void supabase.removeChannel(ch); };
  }, [orgId, me]);

  const myTeamIds = useMemo(() => {
    if (!me) return new Set<string>();
    const ids = new Set<string>();
    for (const [tid, members] of Object.entries(membersByTeam)) {
      if (members.some(m => m.id === me)) ids.add(tid);
    }
    return ids;
  }, [membersByTeam, me]);

  const myTeams = useMemo(() => teams.filter(t => myTeamIds.has(t.id)), [teams, myTeamIds]);
  const otherTeams = useMemo(() => teams.filter(t => !myTeamIds.has(t.id)), [teams, myTeamIds]);

  async function createTeam() {
    if (!orgId || !newName.trim()) return;
    const { error } = await orgInsert<Team>("teams", orgId, { name: newName.trim() });
    if (error) { setErr(error.message); return; }
    setNewName("");
    load();
  }
  async function renameTeam(team: Team) {
    const name = prompt("Rename team:", team.name);
    if (!name || name.trim() === team.name) return;
    const { error } = await orgUpdate<Team>("teams", orgId!, { id: team.id }, { name: name.trim() });
    if (error) { setErr(error.message); return; }
    load();
  }
  async function deleteTeam(team: Team) {
    if (!confirm(`Delete team "${team.name}"?`)) return;
    const { error } = await orgDelete("teams", orgId!, { id: team.id });
    if (error) { setErr(error.message); return; }
    load();
  }

  if (orgLoading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (orgErr) return <div style={{ padding: 16, color: "crimson" }}>Error: {orgErr}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Teams</h2>
        {isAdmin && (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New team name"
              style={{ padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 8 }}
            />
            <button onClick={createTeam} disabled={!newName.trim()} style={btnPrimary}>+ New team</button>
          </div>
        )}
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {loading && <p>Loading…</p>}
      <Section title="Meus times">
        {myTeams.length === 0 ? (
          <Card><p style={muted}>Você ainda não está em nenhum time.</p></Card>
        ) : (
          myTeams.map(t => (
            <TeamRow
              key={t.id}
              team={t}
              projects={projects.filter(p => p.team_id === t.id)}
              members={membersByTeam[t.id] || []}
              expanded={!!expanded[t.id]}
              onToggle={() => setExpanded(s => ({ ...s, [t.id]: !s[t.id] }))}
              isAdmin={isAdmin}
              manageOpen={!!manageOpen[t.id]}
              onToggleManage={() => setManageOpen(s => ({ ...s, [t.id]: !s[t.id] }))}
              orgUsers={orgUsers}
              onRename={() => renameTeam(t)}
              onDelete={() => deleteTeam(t)}
              refresh={load}
              orgId={orgId!}
            />
          ))
        )}
      </Section>
      <Section title="Outros times">
        {otherTeams.length === 0 ? (
          <Card><p style={muted}>Não há outros times na sua organização.</p></Card>
        ) : (
          otherTeams.map(t => (
            <TeamRow
              key={t.id}
              team={t}
              projects={projects.filter(p => p.team_id === t.id)}
              members={membersByTeam[t.id] || []}
              expanded={!!expanded[t.id]}
              onToggle={() => setExpanded(s => ({ ...s, [t.id]: !s[t.id] }))}
              isAdmin={isAdmin}
              manageOpen={!!manageOpen[t.id]}
              onToggleManage={() => setManageOpen(s => ({ ...s, [t.id]: !s[t.id] }))}
              orgUsers={orgUsers}
              onRename={() => renameTeam(t)}
              onDelete={() => deleteTeam(t)}
              refresh={load}
              orgId={orgId!}
            />
          ))
        )}
      </Section>
    </div>
  );
}

function TeamRow({
  team, projects, members, expanded, onToggle,
  isAdmin, manageOpen, onToggleManage, orgUsers, onRename, onDelete, refresh, orgId
}: {
  team: Team;
  projects: Project[];
  members: Member[];
  expanded: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  manageOpen: boolean;
  onToggleManage: () => void;
  orgUsers: Member[];
  onRename: () => void;
  onDelete: () => void;
  refresh: () => void;
  orgId: string;
}) {
  const visibleCount = 5;
  const visible = expanded ? members : members.slice(0, visibleCount);
  const hasOverflow = members.length > visibleCount;
  const [pick, setPick] = useState("");
  const available = orgUsers.filter(u => !members.some(m => m.id === u.id));

  async function addMember() {
    if (!pick) return;
    const { error } = await supabase.from("team_members").insert({ team_id: team.id, user_id: pick, org_id: orgId });
    if (error) { alert(error.message); return; }
    setPick("");
    refresh();
  }
  async function removeMember(user_id: string) {
    const { error } = await supabase.from("team_members").delete().match({ team_id: team.id, user_id, org_id: orgId });
    if (error) { alert(error.message); return; }
    refresh();
  }

  return (
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "start" }}>
        <div>
          <Label>Nome do time:</Label>
          <div style={big}>{team.name}</div>
        </div>
        <div>
          <Label>Projetos do time:</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {projects.length ? projects.map(p => <span key={p.id} style={pill}>{p.name}</span>) : <span style={muted}>Nenhum projeto</span>}
          </div>
        </div>
        {isAdmin ? (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onToggleManage} style={btn}>Manage members</button>
            <button onClick={onRename} style={btn}>Rename</button>
            <button onClick={onDelete} style={btnDanger}>Delete</button>
          </div>
        ) : <div />}
      </div>
      <div style={{ marginTop: 12 }}>
        <Label>Membros do time:</Label>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          {visible.map(m => <MemberBubble key={m.id} member={m} />)}
          {hasOverflow && !expanded && (
            <button type="button" onClick={onToggle} title="Mostrar mais" style={moreBubble}>…</button>
          )}
          {expanded && hasOverflow && (
            <button type="button" onClick={onToggle} title="Mostrar menos" style={lessBtn}>Mostrar menos</button>
          )}
        </div>
      </div>
      {isAdmin && manageOpen && (
        <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <div>
              <Label>Adicionar membro</Label>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={pick} onChange={e => setPick(e.target.value)} style={select}>
                  <option value="">Selecionar usuário…</option>
                  {available.map(u => (
                    <option key={u.id} value={u.id}>
                      {(u.full_name || u.email)}
                    </option>
                  ))}
                </select>
                <button onClick={addMember} disabled={!pick} style={btnPrimarySmall}>Add</button>
              </div>
            </div>
            <div />
          </div>

          <div style={{ marginTop: 10 }}>
            <Label>Remover membro</Label>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {members.map(m => (
                <li key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{m.full_name || m.email}</span>
                  <button onClick={() => removeMember(m.id)} style={btn}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={{ margin: "12px 0" }}>{title}</h3>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </section>
  );
}

function MemberBubble({ member }: { member: Member }) {
  const label = (member.full_name?.trim() || member.email);
  const initials = getInitials(member.full_name, member.email);
  return (
    <div title={label} style={bubble}>
      <span style={{ fontSize: 12, fontWeight: 700 }}>{initials}</span>
    </div>
  );
}
function getInitials(full: string | null, email: string) {
  const name = (full || "").trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || "").join("");
  }
  return (email || "?").slice(0, 2).toUpperCase();
}

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={card}>{children}</div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{children}</div>
);

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
const big: React.CSSProperties = { fontWeight: 700 };
const muted: React.CSSProperties = { color: "#6b7280" };
const pill: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  fontSize: 12,
  background: "#f8fafc",
};
const bubble: React.CSSProperties = {
  height: 28,
  width: 28,
  borderRadius: "50%",
  background: "#111827",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #0b1220",
};
const moreBubble: React.CSSProperties = {
  height: 28,
  width: 28,
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#f3f4f6",
  cursor: "pointer",
  lineHeight: "26px",
  textAlign: "center" as const,
  fontWeight: 700,
};
const lessBtn: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 8,
  padding: "4px 8px",
  cursor: "pointer",
  fontSize: 12,
};
const btn: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 8,
  padding: "6px 10px",
  cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  ...btn,
  borderColor: "#fecaca",
  background: "#fee2e2",
};
const btnPrimary: React.CSSProperties = {
  border: "1px solid #111827",
  background: "#111827",
  color: "#fff",
  borderRadius: 8,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 600,
};
const btnPrimarySmall: React.CSSProperties = {
  ...btnPrimary,
  padding: "4px 8px",
};
const select: React.CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
};
