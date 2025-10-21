import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase can sign the user in for password recovery flows; nothing special required here
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Senha atualizada com sucesso! Redirecionando para login...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err: any) {
      setMessage(err?.message ?? "Erro ao atualizar a senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Redefinir senha</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Digite a nova senha"
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirme a nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Digite a senha novamente"
            minLength={6}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Atualizando..." : "Atualizar senha"}
        </button>
        {message && (
          <p className={`text-sm mt-2 ${message.includes("sucesso") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}