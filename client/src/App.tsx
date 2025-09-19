import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/app/AuthProvider";

const card: React.CSSProperties = {
  padding: "16px 20px",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  textDecoration: "none",
  color: "inherit",
  fontWeight: 600,
  textAlign: "center",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
};

export default function App() {
  const session = useSession();

  return (
    <div style={{maxWidth: 960, margin: "40px auto", padding: "0 16px"}}>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{margin:0}}>Home (protected)</h2>
        <div>
          <span style={{marginRight:12}}>{session?.user?.email}</span>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      <p style={{marginBottom:24, color:"#4b5563"}}>Escolha uma area para comecar:</p>

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:16}}>
        <Link to="/teams" style={card}>Teams</Link>
        <Link to="/projects" style={card}>Projects</Link>
        <Link to="/tasks" style={card}>Tasks</Link>
      </div>
    </div>
  );
}
