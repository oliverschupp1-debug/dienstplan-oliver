import React, { useState, useEffect,  } from "react";
import { useAuth } from "../hooks/useAuth";
import Sidebar from "../components/Sidebar/Sidebar";
import MonthCalendar from "../calendar/MonthCalendar";
import LoginScreen from "../auth/LoginScreen";
import { useStations } from "../hooks/useStations";
import { useTheme } from "../theme/ThemeProvider";
import "./AppShell.css";

export default function AppShell() {
  const { user, logout } = useAuth();
  const u = user ?? null;

  const { stations, loading: stationsLoading } = useStations();
  const [stationName, setStationName] = useState("");

  const { mode, setMode, resolvedTheme } = useTheme();

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    if (!stationsLoading && u?.station) {
      // station aus dem User, wie bisher, in Kleinbuchstaben
      setStationName(u.station.trim().toLowerCase());
    }
  }, [u, stationsLoading]);

  if (!u) return <LoginScreen />;

  const displayStation =
    (stations.find((s) => s.id === stationName)?.name ?? stationName) ||
    "Keine Station";

  function handlePrint() {
    window.print();
  }

  function handleMonthChange(year: number, month: number) {
    setCurrentYear(year);
    setCurrentMonth(month);
  }

  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column" }}>
      <div className="topbar no-print">
        <div className="topbar-left">
          <div className="topbar-title">DIENSTPLAN</div>
          <div className="topbar-subtitle">
            {displayStation} · {u.email}
          </div>
        </div>

        <div className="topbar-actions">
          <button className="print-btn" onClick={handlePrint}>
            Drucken / PDF
          </button>

          <select
  className="theme-select"
  value={mode}
  onChange={(e) => setMode(e.target.value as "light" | "dark" | "system")}
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

      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar
          stationId={stationName}
          stations={stationsLoading ? [] : stations}
          onStationChange={(s) => setStationName(s)}
          year={currentYear}
          month={currentMonth}
        />

        <div style={{ flex: 1, overflow: "auto" }}>
          <MonthCalendar
            stationName={stationName}
            year={currentYear}
            month={currentMonth}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>
    </div>
  );
}
