import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/useAuth";

export default function Login() {
  const { user, isLoading } = useAuth();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!isLoading && user) {
    const from = (loc.state as any)?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setPending(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
      <form onSubmit={signIn} style={{ width: 340, display: "grid", gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Login</h1>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={{ border: "1px solid #ddd", padding: 10, borderRadius: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ border: "1px solid #ddd", padding: 10, borderRadius: 10 }}
          />
        </label>

        {err && <div style={{ color: "crimson", fontSize: 12 }}>{err}</div>}

        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        { <div style={{ fontSize: 12 }}>
          <Link to="/RequestReset">Forgot password?</Link>
        </div> }
      </form>
    </div>
  );
}
