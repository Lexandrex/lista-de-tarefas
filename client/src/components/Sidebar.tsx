import { NavLink } from "react-router-dom";
import { RoleGate } from "@/lib/RoleGate";

const HEADER_H = 64;
const SIDEBAR_W = 240;

export default function Sidebar() {
  
  return (
    <aside
      style={{
        position: "fixed",
        top: HEADER_H,
        left: 0,
        bottom: 0,
        width: SIDEBAR_W,
        borderRight: "1px solid #e5e7eb",
        background: "#fff",
        padding: 12,
        overflowY: "auto",
        zIndex: 40,
      }}
    >
      <div style={{ fontWeight: 700, margin: "8px 8px 12px" }}>Navegação</div>

      <nav style={{ display: "grid", gap: 6 }}>
        <NavItem to="/" label="Home" />
        <RoleGate required="admin">
          <NavItem to="/teams" label="Teams" />
        </RoleGate>
        <NavItem to="/projects" label="Projects" />
        <NavItem to="/tasks" label="Tasks" />
        <NavItem to="/users" label="Users" />
        {
        //<NavItem to="/agenda" label="Agenda" />
        }
      </nav>
    </aside>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        height: 40,
        padding: "0 12px",
        borderRadius: 10,
        textDecoration: "none",
        color: "#111827",
        border: isActive ? "1px solid #e5e7eb" : "1px solid transparent",
        background: isActive ? "#eef2ff" : "transparent",
        fontWeight: isActive ? 700 : 500,
      })}
    >
      {label}
    </NavLink>
  );
}
