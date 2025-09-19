import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/app/AuthProvider";

type Mode = "signin" | "signup";

function normalizeAuthError(msg?: string) {
  if (!msg) return "Algo deu de errado, tente dnv.";
  if (msg.toLowerCase().includes("invalid login")) return "email ou senha invalido.";
  return msg;
}

export default function Login() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErr(normalizeAuthError(error.message));
          return;
        }
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErr(normalizeAuthError(error.message));
        return;
      }
      if (!data.session) {
        setMsg("Abra o seu email pra confirmar a conta.");
      } else {
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "64px auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode("signin"); setErr(null); setMsg(null); }} style={{ fontWeight: mode === "signin" ? 700 : 400 }}>
          Sign in
        </button>
        <button onClick={() => { setMode("signup"); setErr(null); setMsg(null); }} style={{ fontWeight: mode === "signup" ? 700 : 400 }}>
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          style={{ display: "block", width: "100%", marginBottom: 8 }}
        />
        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div style={{ marginTop: 8 }}>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
        {msg && <p style={{ color: "green" }}>{msg}</p>}
      </div>

      {mode === "signin" && (
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={async () => {
            if (!email) { setErr("Escreva seu email antes"); return; }
            setErr(null); setMsg(null);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${location.origin}/auth/reset`
            });
            if (error) setErr(normalizeAuthError(error.message));
            else setMsg("se email existir, manda link");
          }}>
            esqueceu senha
          </button>
        </div>
      )}
    </div>
  );
}
