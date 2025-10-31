import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";

export default function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo]   = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setInfo("Enviamos para o seu email um link de recuperacao de senha.");
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirm) {
      setError("Senhas diferentes.");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) {
      setInfo("Senha atualizada. Voce agora pode logar normalmente.");
      setTimeout(() => nav("/login"), 800);
    }
  }

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Insira uma nova senha</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm">Nova senha</span>
            <input
              className="mt-1 w-full rounded border p-2"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm">Confirmar senha</span>
            <input
              className="mt-1 w-full rounded border p-2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info  && <p className="text-sm text-green-700">{info}</p>}

          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">Voltar ao login</Link>
        </div>
    </div>
  </div>
  );
}
