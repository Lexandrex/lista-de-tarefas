import { useEffect, useState } from "react";

export type TeamFormInitial = {
  id?: string;
  name: string;
  description?: string | null;
  member_ids?: string[];
};

type UserOption = { id: string; label: string };

export default function TeamFormCard({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  loadOrgUsers,
  meId,
}: {
  initial: TeamFormInitial;
  submitLabel: string;
  onSubmit: (v: TeamFormInitial) => Promise<void> | void;
  onCancel: () => void;
  loadOrgUsers: () => Promise<UserOption[]>;
  meId: string | null;
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>(
    initial.member_ids ?? (meId ? [meId] : [])
  );
  const [includeMe, setIncludeMe] = useState<boolean>(meId ? memberIds.includes(meId) : false);

  useEffect(() => {
    let active = true;
    loadOrgUsers()
      .then((rows) => { if (active) setUsers(rows); })
      .catch(console.error);
    return () => { active = false; };
  }, [loadOrgUsers]);

  useEffect(() => {
    if (!meId) return;
    setMemberIds((prev) => {
      const hasMe = prev.includes(meId);
      if (includeMe && !hasMe) return [...prev, meId];
      if (!includeMe && hasMe) return prev.filter((id) => id !== meId);
      return prev;
    });
  }, [includeMe, meId]);

  function toggleMember(id: string) {
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: TeamFormInitial = {
      ...(initial.id ? { id: initial.id } : {}),
      name,
      description: description || null,
      member_ids: memberIds,
    };
    await onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 max-w-xl">
      <label className="grid gap-1">
        <span className="text-sm opacity-80">Nome</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label className="grid gap-1">
        <span className="text-sm opacity-80">Descrição</span>
        <textarea
          className="input"
          rows={3}
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="grid gap-2">
        <div className="text-sm opacity-80">Selecione membros para a equipe</div>
        {meId && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeMe}
              onChange={(e) => setIncludeMe(e.target.checked)}
            />
            Me adicionar
          </label>
        )}
        <div className="grid gap-1 max-h-56 overflow-auto border rounded-md p-2">
          {users.length === 0 ? (
            <div className="text-sm opacity-70">Nenhum funcionario encontrado.</div>
          ) : (
            users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={memberIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                />
                <span>{u.label}</span>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
