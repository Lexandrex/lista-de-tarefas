import { useState } from "react";

type HeaderProps = {
  appName?: string;
  onSearch?: (q: string) => void;
  onCreate?: () => void;
  onBellClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
};

export default function Header({
  appName = "Lista de Tarefas",
  onSearch,
  onCreate,
  onBellClick,
  onSettingsClick,
  onProfileClick,
  }: HeaderProps) {
  const [q, setQ] = useState("");

/*
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(q.trim());
  };
*/
  const iconBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    width: 36,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
  };

  return (
    <header style={styles.wrap}>
      <div style={styles.left}>
        <span style={styles.brand}>{appName}</span>
      </div>

      <div></div>

      <div style={styles.right}>
        <button type="button" onClick={onBellClick} title="Notifications" style={iconBtn} aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
            <path d="M9 17a3 3 0 0 0 6 0" />
          </svg>
        </button>

        <button type="button" onClick={onSettingsClick} title="Settings" style={iconBtn} aria-label="Settings">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15.4 9c.3 0 .6-.07.86-.2l.06-.06A2 2 0 1 1 19.15 11l-.06.06c-.13.26-.2.56-.2.86z"/>
          </svg>
        </button>

        <button type="button" onClick={onProfileClick} title="Profile" style={{ ...iconBtn, width: 40, borderRadius: 999 }}>
          <div style={styles.avatar}>U</div>
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    background: "#ffffffcc",
    backdropFilter: "saturate(180%) blur(10px)",
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    alignItems: "center",
    padding: "0 16px",
    gap: 12,
    borderBottom: "1px solid #e5e7eb",
    zIndex: 50,
  },
  left: { display: "flex", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: 700 },
  center: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: 8,
  },
  searchWrap: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "center",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 6,
  },
  input: {
    border: "none",
    outline: "none",
    padding: "6px 8px",
    fontSize: 14,
    background: "transparent",
  },
  searchBtn: {
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
  },
  createBtn: {
    border: "1px solid #e5e7eb",
    background: "#111827",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  right: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
  avatar: {
    height: 28,
    width: 28,
    borderRadius: "50%",
    background: "#111827",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
