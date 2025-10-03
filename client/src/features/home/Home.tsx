import { useState } from "react";
import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
import { useAuth } from "@/app/useAuth";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function HomePage() {
  const { user } = useAuth();
  const [value, setValue] = useState<Value>(new Date());
  const selectedDate =
  value instanceof Date ? value : (value?.[0] as Date | null) ?? new Date();
  const isToday = isSameDay(selectedDate, new Date());

  const agenda = isToday
    ? [
        { time: "09:00", title: "meeting" },
        { time: "13:00", title: "lunch" },
        { time: "16:00", title: "zoom call" },
      ]
    : [
        { time: "10:00", title: "other days to-dos" },
        { time: "15:30", title: "to-dos" },
      ];

  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
        Ola{user?.email ? `, ${user.email}` : ""}
      </h1>
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard title="Projects" value="3 Active" />
        <StatCard title="Tasks" value="12 Due this week" />
        <StatCard title="Teams" value="2 to supervize" />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 420px) 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {isToday ? "Today's Agenda" : formatDate(selectedDate)}
          </div>
          {agenda.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.7 }}>No items.</div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
              {agenda.map((a, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "8px 10px",
                    background: "#fff",
                  }}
                >
                  <span style={{ fontSize: 13, opacity: 0.8 }}>{a.time}</span>
                  <span style={{ fontWeight: 500 }}>{a.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Calendar</div>
          <Calendar
            onChange={setValue}
            value={value}
          />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 14,
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.04)",
      }}
    >
      {children}
    </div>
  );
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date | null) {
  if (!d) return "";
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}
