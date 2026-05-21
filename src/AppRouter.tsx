// AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

import LoginScreen from "./auth/LoginScreen";
import AppShell from "./layout/AppShell";

import InfoPageWrapper from "./components/Info/InfoPageWrapper";
import EmployeePanel from "./components/EmployeePanel";

import MobileRouter from "./mobile/MobileRouter";
import { useEmployees } from "./hooks/useEmployees";

export default function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h2>Lade…</h2>
      </div>
    );
  }

  const meta = user?.user_metadata ?? {};
  const rawRole = meta.role as string | undefined;
  let role: "admin" | "planner" | "employee" | null = null;

  if (rawRole === "admin" || rawRole === "planner" || rawRole === "employee") {
    role = rawRole;
  } else if (user) {
    // Fallback: jeder eingeloggte User ohne gültige Rolle wird als Mitarbeiter behandelt
    role = "employee";
  }

  const stationId = (meta.station_id ?? null) as string | null;

  const { employees } = useEmployees(stationId ?? "");

  const isLoggedIn = !!user;

  // ⭐ Mitarbeiter (oder Fallback) → Mobile
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

  // ⭐ Admin & Planner → Desktop
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
