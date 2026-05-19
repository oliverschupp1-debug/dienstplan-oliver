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

  const isLoggedIn = !!user;

  let role: "admin" | "planner" | "employee" | null = null;
  let stationId: string | null = null;
  let employees: any[] = [];

  if (isLoggedIn) {
    const meta = user.user_metadata ?? {};
    role = meta.role ?? null;
    stationId = meta.station_id ?? null;

    employees = useEmployees(stationId).employees;
  }

  // ⭐ Mitarbeiter → Mobile
  if (isLoggedIn && role === "employee") {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="/m/*"
            element={
              <MobileRouter
                role={role ?? "employee"}
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
        {isLoggedIn && (
          <>
            <Route path="/" element={<AppShell />} />

            <Route
              path="/info"
              element={
                <InfoPageWrapper
                  role={role}
                  stationId={stationId ?? ""}
                  userId={user.id}
                />
              }
            />

            <Route
              path="/employees"
              element={
                role === "admin" || role === "planner"
                  ? (
                      <EmployeePanel
                        stationId={stationId ?? ""}
                        isOpen={true}
                        onClose={() => {}}
                      />
                    )
                  : <Navigate to="/" replace />
              }
            />

            {/* Admin/Planner dürfen NICHT auf Mobile */}
            <Route path="/m/*" element={<Navigate to="/" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

      </Routes>
    </BrowserRouter>
  );
}
