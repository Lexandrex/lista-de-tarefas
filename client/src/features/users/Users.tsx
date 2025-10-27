import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listOrgUsers, orgUpdate, orgInsert, orgDelete } from "@/lib/db";

type User = { id: string; name?: string; email?: string };

export default function UsersPage() {
  const { user: currentUser, profile, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();

  const orgId = profile?.org_id ?? null;

  const { data: rows = [], isLoading: usersLoading, error } = useQuery<any[]>({
    queryKey: ["orgUsers", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await listOrgUsers(orgId);
      return (res.data ?? []);
    },
    enabled: !!orgId,
  });

  const usersData: User[] = (rows ?? []).map(r => ({ id: r.id, name: r.name ?? r.full_name ?? "", email: r.email }));

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<User | null>(null);

  const filtered = useMemo(() => usersData.filter(u => (u.name ?? "").toLowerCase().includes(q.toLowerCase())), [usersData, q]);

  const isAdmin = !!profile?.is_admin;
  const myEmail = currentUser?.email ?? null;

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, any> }) => orgUpdate('profiles', orgId!, { id }, patch),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["orgUsers", orgId] } as any),
  });

  const insertMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => orgInsert('profiles', orgId!, payload),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["orgUsers", orgId] } as any),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => orgDelete('profiles', orgId!, { id }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["orgUsers", orgId] } as any),
  });

  async function upsertUser(payload: { id?: string; name?: string; email?: string }) {
    if (!orgId) return alert('org_id missing');

    if (payload.id) {
      // editing: check permissions
      const target = usersData.find(u => u.id === payload.id);
      const allowed = isAdmin || (target?.email && myEmail === target.email);
      if (!allowed) return alert("You don't have permission to edit this user.");
      await updateMutation.mutateAsync({ id: payload.id, patch: { name: payload.name, email: payload.email } });
    } else {
      if (!isAdmin) return alert('Only admins can create users.');
      await insertMutation.mutateAsync({ name: payload.name, email: payload.email });
    }
    setEditing(null);
  }

  async function deleteUser(id: string) {
    if (!isAdmin) return alert('Only admins can delete users.');
    await deleteMutation.mutateAsync(id);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <input className="input w-72" placeholder="Search users" value={q} onChange={e => setQ(e.target.value)} />
          {isAdmin ? (
            <button className="btn btn-primary" onClick={() => setEditing({ name: "", id: "", email: "" } as User)}>+ Create</button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-2">
        <div className="grid gap-3">
          {usersLoading ? (
            <div className="card p-4 text-sm text-muted">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="card p-4 text-sm text-muted">No users found.</div>
          ) : (
            filtered.map(u => {
              const canEdit = isAdmin || (u.email && myEmail === u.email);
              return (
                <div key={u.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-sm text-muted">{u.email}</div>
                  </div>
                  <div className="flex gap-2">
                    {canEdit ? <button className="btn" onClick={() => setEditing(u)}>Edit</button> : <button className="btn btn-ghost" disabled>View</button>}
                    {isAdmin ? <button className="btn text-red-600" onClick={() => deleteUser(u.id)}>Delete</button> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {editing && (
        <div className="card p-4">
          <div className="text-sm text-muted mb-2">{editing.id ? "Edit user" : "Create user"}</div>
          <UserForm initial={editing} onCancel={() => setEditing(null)} onSubmit={upsertUser} isAdmin={isAdmin} currentEmail={myEmail} authLoading={authLoading} />
        </div>
      )}
    </div>
  );
}

function UserForm({ initial, onSubmit, onCancel, isAdmin, currentEmail, authLoading }: {
  initial: { id?: string; name?: string; email?: string };
  onSubmit: (v: { id?: string; name?: string; email?: string }) => Promise<void> | void;
  onCancel: () => void;
  isAdmin: boolean;
  currentEmail: string | null;
  authLoading: boolean;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [email, setEmail] = useState(initial.email ?? "");

  useEffect(() => {
    setName(initial.name ?? "");
    setEmail(initial.email ?? "");
  }, [initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin && initial.id) {
      if (!initial.email || initial.email !== currentEmail) {
        alert('You can only edit your own user.');
        return;
      }
    }
    await onSubmit({ ...(initial?.id ? { id: initial.id } : {}), name, email });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Name</span>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required disabled={authLoading} />
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Email</span>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} required disabled={!isAdmin || authLoading} />
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">{initial.id ? "Save changes" : "Create"}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
