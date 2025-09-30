import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      style={{
        position: "fixed",
        top: 64,
        left: 0,
        bottom: 0,
        width: 240,
        borderRight: "1px solid #e5e7eb",
        background: "#fff",
        padding: 12,
        overflowY: "auto",
        zIndex: 40,
      }}
    >
      <div style={{ fontWeight: 700, margin: "8px 8px 12px" }}>Navegação</div>
      <nav style={{ display: "grid", gap: 6 }}>
        <Link to="/" style={{...itemStyle, ...(location.pathname === "/" ? activeStyle : {})}}>
          Home
        </Link>
        <Link to="/teams" style={{...itemStyle, ...(location.pathname === "/teams" ? activeStyle : {})}}>
          Teams
        </Link>
        <Link to="/projects" style={{...itemStyle, ...(location.pathname === "/projects" ? activeStyle : {})}}>
          Projects
        </Link>
        <Link to="/tasks" style={{...itemStyle, ...(location.pathname === "/tasks" ? activeStyle : {})}}>
          Tasks
        </Link>
      </nav>
    </aside>
  );
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 40,
  padding: "0 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: "#111827",
  border: "1px solid transparent",
};

const activeStyle: React.CSSProperties = {
  backgroundColor: "#f1f5f9",
  borderColor: "#e2e8f0",
  fontWeight: 500,
};