import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/AuthProvider";
import { Link } from "react-router-dom";

export default function App() {
  const { user, isLoading } = useAuth(); 

  return (
    <>
      <main>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "20px 16px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: "#6b7280" }}>Bem vindo, {user?.email}</div>
            <button onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>

          {/* Agenda */}
          <section style={card}>
            <h3 style={title}>Agenda</h3>
          </section>

          {/* Calendário */}
          <section style={card}>
            <h3 style={title}>Calendário</h3>
          </section>

          {/* links */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16 }}>
            <Link to="/teams" style={cardLink}>Teams</Link>
            <Link to="/projects" style={cardLink}>Projects</Link>
            <Link to="/tasks" style={cardLink}>Tasks</Link>
          </div>
        </div>
      </main>
    </>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};
const title: React.CSSProperties = { margin: 0, fontSize: 18, fontWeight: 700, marginBottom: 8 };
const muted: React.CSSProperties = { color: "#6b7280", margin: 0 };
const cardLink: React.CSSProperties = {
  ...card,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 600,
};
