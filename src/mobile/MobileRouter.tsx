import { useState } from "react";

import MobileTodayView from "./MobileTodayView";
import MobileTodayViewAdmin from "./MobileTodayViewAdmin";
import MobileTodayViewEmployee from "./MobileTodayViewEmployee";

import MobileMonthView from "./MobileMonthView";
import MobileMonthViewAdmin from "./MobileMonthViewAdmin";
import MobileMonthViewEmployee from "./MobileMonthViewEmployee";

import MobileNavBar from "./MobileNavBar";
import "./MobileEmployeePanel.css";

type Props = {
  role: "admin" | "planner" | "employee";
  stationName: string;
  employees: { id: string; name: string }[];
};

export default function MobileRouter({
  role,
  stationName,
  employees,
}: Props) {
  const [view, setView] = useState<"today" | "month">("today");
  const [showEmployees, setShowEmployees] = useState(false);

  const isAdmin = role === "admin";
  const isPlanner = role === "planner";
  const isEmployee = role === "employee";

  return (
    <div className="mobile-root">
      <MobileNavBar
        role={role}
        activeView={view}
        onViewChange={setView}
        onToggleEmployees={() => setShowEmployees((s) => !s)}
      />

      {showEmployees && (isAdmin || isPlanner) && (
        <div className="mobile-employee-panel">
          <h3 className="mobile-employee-panel-title">Mitarbeiter</h3>

          <div className="mobile-employee-panel-list">
            {employees.map((employee) => (
              <div key={employee.id} className="mobile-employee-panel-item">
                {employee.name}
              </div>
            ))}
          </div>

          <button
            className="mobile-employee-panel-close"
            type="button"
            onClick={() => setShowEmployees(false)}
          >
            Schließen
          </button>
        </div>
      )}

      {view === "today" && isAdmin && (
        <MobileTodayViewAdmin
  stationName={stationName}
  onOpenMonth={() => setView("month")}
/>
      )}

      {view === "today" && isPlanner && (
        <MobileTodayView
          stationName={stationName}
          employees={employees}
          onOpenMonth={() => setView("month")}
        />
      )}

      {view === "today" && isEmployee && (
        <MobileTodayViewEmployee
          stationName={stationName}
          employees={employees}
          onOpenMonth={() => setView("month")}
        />
      )}

      {view === "month" && isAdmin && (
        <MobileMonthViewAdmin stationName={stationName} />
      )}

      {view === "month" && isPlanner && (
        <MobileMonthView stationName={stationName} employees={employees} />
      )}

      {view === "month" && isEmployee && (
        <MobileMonthViewEmployee
          stationName={stationName}
          employees={employees}
        />
      )}
    </div>
  );
}