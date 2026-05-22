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

// ⭐ Typ für employees-Tabelle
type Employee = {
  id: string;
  auth_user_id: string;
  role: "admin" | "planner" | "employee";
  station_id: string;
};

export default function AppRouter() {
  const { user, loading } = useAuth();

  // ⭐ employee sauber typisiert
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [empLoading, setEmpLoading] = useState(true);

  // ⭐ Mitarbeiter-Datensatz aus Supabase laden
  useEffect(() => {
    async function loadEmployee() {
      if (!user) {
        setEmployee(null);
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

      setEmployee(data);
      setEmpLoading(false);
    }

    loadEmployee();
  }, [user]);

  // ⭐ Ladeanzeige
  if (loading || empLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade…</h2>
      </div>
    );
  }

  const isLoggedIn = !!user;

  // ⭐ Falls kein Mitarbeiter-Datensatz → zurück zum Login
  if (isLoggedIn && !employee) {
    return <LoginScreen />;
  }

  // ⭐ Rolle & Station aus employees-Tabelle
  const role = employee?.role ?? null;
  const stationId = employee?.station_id ?? null;

  const { employees } = useEmployees(stationId ?? "");

  // ⭐ Mitarbeiter → Mobile Router
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

          {/* Mitarbeiter dürfen NICHT auf Desktop */}
          <Route path="*" element={<Navigate to="/m/today" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // ⭐ Admin & Planner → Desktop Router
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        {!isLoggedIn && <Route path="*" element={<LoginScreen />} />}

        {/* DESKTOP */}
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

            {/* Admin/Planner dürfen NICHT auf Mobile */}
            <Route path="/m/*" element={<Navigate to="/" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {/* Falls ein eingeloggter User ohne gültige Rolle hier landet */}
        {isLoggedIn && !role && (
          <Route path="*" element={<Navigate to="/m/today" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
