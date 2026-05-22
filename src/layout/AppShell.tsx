// src/layout/AppShell.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useStations } from "../hooks/useStations";
import { useTheme } from "../theme/ThemeProvider";
import { useAppStore } from "../store/useAppStore";

import Sidebar from "../components/Sidebar/Sidebar";
import MonthCalendar from "../calendar/MonthCalendar";
import LoginScreen from "../auth/LoginScreen";

import "./AppShell.css";

export default function AppShell() {
  const { user, logout } = useAuth();
  const { stations, loading: stationsLoading } = useStations();
  const { mode, setMode } = useTheme();

  const stationIdFromStore = useAppStore((s) => s.stationId);
  const role = useAppStore((s) => s.role);

  const [stationId, setStationId] = useState<string>("");

  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth());

  // Wenn der Mitarbeiter aus AppRouter geladen wurde, stationId übernehmen
  useEffect(() => {
    if (stationIdFromStore) {
      setStationId(stationIdFromStore);
    }
  }, [stationIdFromStore]);

  if (!user) {
    return <LoginScreen />;
  }

  const displayStation =
    stations.find((s) => s.id === stationId)?.name ?? stationId ?? "";

  const handleStationChange = (id: string) => {
    // Mitarbeiter dürfen die Station nicht wechseln
    if (role === "employee") return;
    setStationId(id);
  };

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const handlePrint = () => {
    window.print();
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
          <button className="print-btn" onClick={handlePrint}>
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
          stationId={stationId || null}
          stations={stationsLoading ? [] : stations}
          onStationChange={handleStationChange}
          year={year}
          month={month}
        />

        <div className="calendar-container">
          <MonthCalendar
            stationName={stationId}
            year={year}
            month={month}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>
    </div>
  );
}
