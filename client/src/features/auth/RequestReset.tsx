import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function RequestReset() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo]   = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/resetPassword`,
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Enviamos ao seu email um link de recuperacao de senha.");
  }

  return (
    <div className="min-h-[100dvh] grid place-items-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Recuperar senha</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm">Email</span>
            <input
              className="mt-1 w-full rounded border p-2"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {submitting ? "Enviando..." : "enviar link"}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">Voltar ao login</Link>
        </div>
      </div>
    </div>
  );
}
