// src/AppRouter.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useAppStore } from "./store/useAppStore";
import AppShell from "./layout/AppShell";
import LoginScreen from "./auth/LoginScreen";
import StationMonitorView from "./monitor/StationMonitorView";
import { supabase } from "./lib/supabaseClient";

type AppRole = "admin" | "planner" | "employee";

type EmployeeProfile = {
  id: string;
  name: string | null;
  station_id: string | null;
  role: AppRole | null;
};

function isValidRole(role: unknown): role is AppRole {
  return role === "admin" || role === "planner" || role === "employee";
}

export default function AppRouter() {
  const { user, loading: authLoading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const setStationId = useAppStore((s) => s.setStationId);
  const setRole = useAppStore((s) => s.setRole);
  const setEmployeeId = useAppStore((s) => s.setEmployeeId);
  const setUserName = useAppStore((s) => s.setUserName);
  const resetStore = useAppStore((s) => s.reset);

  useEffect(() => {
    let cancelled = false;

    async function loadUserData() {
      if (!user) {
        resetStore();
        setProfileLoading(false);
        setProfileError(null);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      const { data, error } = await supabase
        .from("employees")
        .select("id, name, station_id, role")
        .eq("auth_user_id", user.id)
        .maybeSingle<EmployeeProfile>();

      if (cancelled) return;

      if (error) {
        console.error("Fehler beim Laden der Userdaten:", error);
        resetStore();
        setProfileError("Deine Benutzerdaten konnten nicht geladen werden.");
        setProfileLoading(false);
        return;
      }

      if (!data) {
        resetStore();
        setProfileError(
          "Für diesen Login wurde kein Mitarbeiterprofil gefunden. Bitte prüfe auth_user_id in Supabase."
        );
        setProfileLoading(false);
        return;
      }

      const role = isValidRole(data.role) ? data.role : "employee";

      setEmployeeId(data.id);
      setUserName(data.name ?? user.email ?? "");
      setRole(role);
      setStationId(data.station_id);
      setProfileLoading(false);
    }

    loadUserData();

    return () => {
      cancelled = true;
    };
  }, [user, resetStore, setEmployeeId, setRole, setStationId, setUserName]);

  if (authLoading) return <div className="app-loading">Lade Anmeldung…</div>;
  if (!user) return <LoginScreen />;
  if (profileLoading) return <div className="app-loading">Lade Benutzerprofil…</div>;
  if (profileError) return <div className="app-error">{profileError}</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/monitor" element={<StationMonitorView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}