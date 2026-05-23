// src/layout/AppShell.tsx
import { useTheme } from "../theme/ThemeProvider";
import { useStations } from "../hooks/useStations";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store/useAppStore";

import Sidebar from "../components/Sidebar/Sidebar";
import MonthCalendar from "../calendar/MonthCalendar";
import LoginScreen from "../auth/LoginScreen";

import "./AppShell.css";

export default function AppShell() {
  const { user, logout } = useAuth();
  const { stations, loading: stationsLoading } = useStations();
  const { mode, setMode } = useTheme();

  // ⭐ stationId kommt NUR aus dem Store
  const stationId = useAppStore((s) => s.stationId);
  const role = useAppStore((s) => s.role);
  const setStationId = useAppStore((s) => s.setStationId);

  const [year, setYear] = useAppStore((s) => [
    s.year ?? new Date().getFullYear(),
    s.setYear,
  ]);

  const [month, setMonth] = useAppStore((s) => [
    s.month ?? new Date().getMonth(),
    s.setMonth,
  ]);

  if (!user) return <LoginScreen />;

  const displayStation =
    stations.find((s) => s.id === stationId)?.name ?? stationId ?? "";

  const handleStationChange = (id: string) => {
    if (role === "employee") return; // Mitarbeiter dürfen NICHT wechseln
    setStationId(id); // ⭐ direkt in den Store schreiben
  };

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  return (
    <div className="app-shell">
      <div className="topbar no-print">
        <div className="topbar-left">
          <div className="topbar-title">DIENSTPLAN</div>
          <div className="topbar-subtitle">
            {displayStation || "Keine Station"} · {user.email}
          </div>
        </div>

        <div className="topbar-actions">
          <button className="print-btn" onClick={() => window.print()}>
            Drucken / PDF
          </button>

          <select
            className="theme-select"
            value={mode}
            onChange={(e) =>
              setMode(e.target.value as "light" | "dark" | "system")
            }
          >
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
            <option value="system">System</option>
          </select>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="main-layout">
        <Sidebar
          stationId={stationId ?? ""}
          stations={stationsLoading ? [] : stations}
          onStationChange={handleStationChange}
          year={year}
          month={month}
        />

        <div className="calendar-container">
          <MonthCalendar
            stationName={stationId ?? ""}
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>
    </div>
  );
}
