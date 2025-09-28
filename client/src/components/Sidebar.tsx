export default function Sidebar() {
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
        <a href="/" style={itemStyle}>Home</a>
        <a href="/teams" style={itemStyle}>Teams</a>
        <a href="/projects" style={itemStyle}>Projects</a>
        <a href="/tasks" style={itemStyle}>Tasks</a>
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