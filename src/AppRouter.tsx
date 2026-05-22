// AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

import LoginScreen from "./auth/LoginScreen";
import AppShell from "./layout/AppShell";

import InfoPageWrapper from "./components/Info/InfoPageWrapper";
import EmployeePanel from "./components/EmployeePanel";

import MobileRouter from "./mobile/MobileRouter";
import { useEmployees } from "./hooks/useEmployees";
import { useAppStore } from "./store/useAppStore";

type Employee = {
  id: string;
  auth_user_id: string;
  role: "admin" | "planner" | "employee";
  station_id: string;
};

export default function AppRouter() {
  const { user, loading } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [empLoading, setEmpLoading] = useState(true);

  const setStation = useAppStore((state) => state.setStation);
  const setRole = useAppStore((state) => state.setRole);

  useEffect(() => {
    async function loadEmployee() {
      if (!user) {
        setEmployee(null);
        setStation(null);
        setRole(null);
        setEmpLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        console.error("Fehler beim Laden des Mitarbeiters:", error);
      }

      setEmployee(data ?? null);

      if (data) {
        setStation(data.station_id);
        setRole(data.role);
      } else {
        setStation(null);
        setRole(null);
      }

      setEmpLoading(false);
    }

    loadEmployee();
  }, [user, setStation, setRole]);

  if (loading || empLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade…</h2>
      </div>
    );
  }

  const isLoggedIn = !!user;

  if (isLoggedIn && !employee) {
    return <LoginScreen />;
  }

  const role = employee?.role ?? null;
  const stationId = employee?.station_id ?? null;

  const { employees } = useEmployees(stationId ?? "");

  // Mitarbeiter → Mobile
  if (isLoggedIn && role === "employee") {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="/m/*"
            element={
              <MobileRouter
                role={role}
                stationName={stationId ?? ""}
                employees={employees}
                onOpenMonth={() => {}}
              />
            }
          />
          <Route path="*" element={<Navigate to="/m/today" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Admin & Planner → Desktop
  return (
    <BrowserRouter>
      <Routes>
        {!isLoggedIn && <Route path="*" element={<LoginScreen />} />}

        {isLoggedIn && (role === "admin" || role === "planner") && (
          <>
            <Route path="/" element={<AppShell />} />

            <Route
              path="/info"
              element={
                <InfoPageWrapper
                  role={role}
                  stationId={stationId ?? ""}
                  userId={user!.id}
                />
              }
            />

            <Route
              path="/employees"
              element={
                role === "admin" || role === "planner" ? (
                  <EmployeePanel
                    stationId={stationId ?? ""}
                    isOpen={true}
                    onClose={() => {}}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route path="/m/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {isLoggedIn && !role && (
          <Route path="*" element={<Navigate to="/m/today" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
