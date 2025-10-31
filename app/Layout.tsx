import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";

const HEADER_H = 64;
const SIDEBAR_W = 240;

export default function Layout() {
  return (
    <>
      <Header
        appName="Lista de Tarefas"
        onSearch={(q) => console.log("search:", q)}
        onCreate={() => console.log("create")}
        onBellClick={() => console.log("bell")}
        onSettingsClick={() => console.log("settings")}
        onProfileClick={() => console.log("profile")}
      />
      <Sidebar />

      <main
        style={{
          position: "fixed",
          top: HEADER_H,
          left: SIDEBAR_W,
          right: 0,
          bottom: 0,
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px 32px" }}>
          <Outlet />
        </div>
      </main>
    </>
  );
}
