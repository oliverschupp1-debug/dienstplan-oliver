// src/layout/AppShell.tsx
import { useEffect, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useStations } from "../hooks/useStations";
import { useAuth } from "../hooks/useAuth";
import { useAppStore } from "../store/useAppStore";
import { useEmployees } from "../hooks/useEmployees";

import Sidebar from "../components/Sidebar/Sidebar";
import MonthCalendar from "../calendar/MonthCalendar";
import LoginScreen from "../auth/LoginScreen";
import MobileRouter from "../mobile/MobileRouter";

import "./AppShell.css";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return isMobile;
}

export default function AppShell() {
  const { user, loading: authLoading, logout } = useAuth();
  const { stations, loading: stationsLoading } = useStations();
  const { mode, setMode } = useTheme();
  const isMobile = useIsMobile();

  const stationId = useAppStore((s) => s.stationId);
  const role = useAppStore((s) => s.role);

  const yearFromStore = useAppStore((s) => s.year);
  const monthFromStore = useAppStore((s) => s.month);

  const setStationId = useAppStore((s) => s.setStationId);
  const setYear = useAppStore((s) => s.setYear);
  const setMonth = useAppStore((s) => s.setMonth);

  const year = yearFromStore ?? new Date().getFullYear();
  const month = monthFromStore ?? new Date().getMonth();

  const { employees } = useEmployees(stationId ?? null);

  if (authLoading) {
  return <div className="app-loading">Lade Anmeldung…</div>;
}

if (!user) return <LoginScreen />;

  const displayStation =
    stations.find((s) => s.id === stationId)?.name ?? stationId ?? "";

  const handleStationChange = (id: string) => {
    if (role === "employee") return;
    setStationId(id);
  };

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  if (isMobile && role && stationId) {
    return (
      <MobileRouter
        role={role}
        stationName={stationId}
        employees={employees.map((employee) => ({
          id: employee.id,
          name: employee.name ?? "Ohne Namen",
        }))}
        onOpenMonth={() => {
          window.history.pushState({}, "", "/month");
          window.dispatchEvent(new PopStateEvent("popstate"));
        }}
      />
    );
  }

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