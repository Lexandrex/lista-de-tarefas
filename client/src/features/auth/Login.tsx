import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/app/AuthProvider";

type Mode = "signin" | "signup";

const card = {
  background: "white",
  borderRadius: 8,
  padding: 32,
  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
};

const title = {
  fontSize: 24,
  fontWeight: "500",
  color: "#111827",
  marginBottom: 24,
  textAlign: "center" as const,
};

const formGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginBottom: "16px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: "500",
  color: "#374151",
  textAlign: "left",
};

const inputStyle: React.CSSProperties = {
  height: "36px",
  padding: "4px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s ease",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  fontWeight: "500",
  fontSize: "14px",
  transition: "all 0.2s ease",
  cursor: "pointer",
};

const tabButtonStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "none",
  padding: "8px 16px",
  fontSize: "14px",
  cursor: "pointer",
  borderBottom: "2px solid transparent",
};

const linkButtonStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "none",
  padding: "4px 0",
  fontSize: "14px",
  color: "#2563eb",
  cursor: "pointer",
};

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
    <div style={{ 
      minHeight: "100vh",
      background: "#f8fafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={card}>
          <h1 style={title}>Lista de Tarefas</h1>
          
          <div style={{ 
            display: "flex", 
            gap: 8, 
            marginBottom: 24,
            borderBottom: "1px solid #e5e7eb",
          }}>
            <button 
              onClick={() => { setMode("signin"); setErr(null); setMsg(null); }} 
              style={{
                ...tabButtonStyle,
                borderBottom: mode === "signin" ? "2px solid #2563eb" : undefined,
                fontWeight: mode === "signin" ? 600 : 400,
                color: mode === "signin" ? "#2563eb" : "#6b7280",
              }}
            >
              Sign in
            </button>
            <button 
              onClick={() => { setMode("signup"); setErr(null); setMsg(null); }} 
              style={{
                ...tabButtonStyle,
                borderBottom: mode === "signup" ? "2px solid #2563eb" : undefined,
                fontWeight: mode === "signup" ? 600 : 400,
                color: mode === "signup" ? "#2563eb" : "#6b7280",
              }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                placeholder="Insira o seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Senha</label>
              <input
                style={inputStyle}
                placeholder="Insira a sua senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{
                ...buttonStyle,
                width: "100%",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Aguarde" : mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>

          <div style={{ marginTop: 16, minHeight: "48px" }}>
            {err && <p style={{ color: "#dc2626", fontSize: "14px" }}>{err}</p>}
            {msg && <p style={{ color: "#16a34a", fontSize: "14px" }}>{msg}</p>}
          </div>

          {mode === "signin" && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button 
                type="button" 
                style={linkButtonStyle}
                onClick={async () => {
                  if (!email) { setErr("Insira o seu email primeiro"); return; }
                  setErr(null); setMsg(null);
                  setLoading(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${location.origin}/auth/reset`
                    });
                    if (error) setErr(normalizeAuthError(error.message));
                    else setMsg("O link de recuperação de senha foi enviado para o seu email");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Esqueceu a senha ?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
