import { useEffect, useState } from "react";
import { useEmployees } from "../hooks/useEmployees";
import { useAllMonthlyHours } from "../hooks/useAllMonthlyHours";
import { onAssignmentsChanged } from "../events";

import MobileTodayViewAdmin from "./MobileTodayViewAdmin";
import MobileTodayViewEmployee from "./MobileTodayViewEmployee";
import MobileMonthViewAdmin from "./MobileMonthViewAdmin";
import MobileMonthViewEmployee from "./MobileMonthViewEmployee";

import MobileNavBar from "./MobileNavBar";
import "./MobileEmployeePanel.css";

type Station = {
  id: string;
  name: string;
};

type Props = {
  role: "admin" | "planner" | "employee";
  stationName: string;
  employees: { id: string; name: string }[];
  stations: Station[];
  onStationChange: (id: string) => void;
};

export default function MobileRouter({
  role,
  stationName,
  employees,
  stations,
  onStationChange,
}: Props) {
  const [view, setView] = useState<"today" | "month">("today");
  const [showEmployees, setShowEmployees] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  const today = new Date();

  const { employees: allPanelEmployees } = useEmployees(stationName);

  const panelEmployees = allPanelEmployees.filter(
    (employee) => employee.role !== "admin"
  );

  const { hoursMap } = useAllMonthlyHours(
    stationName,
    today.getFullYear(),
    today.getMonth(),
    reloadFlag
  );

  useEffect(() => {
    const off = onAssignmentsChanged(() => {
      setReloadFlag((value) => value + 1);
    });

    return () => {
      off();
    };
  }, []);

  const isAdmin = role === "admin";
  const isPlanner = role === "planner";
  const isEmployee = role === "employee";

  return (
    <div className="mobile-root">
      <MobileNavBar
        role={role}
        activeView={view}
        onViewChange={setView}
        onToggleEmployees={() => setShowEmployees((current) => !current)}
      />

      {isAdmin && (
        <div className="mobile-station-select-wrap">
          <label className="mobile-station-label">Station</label>

          <select
            className="mobile-station-select"
            value={stationName}
            onChange={(event) => onStationChange(event.target.value)}
          >
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {showEmployees && (isAdmin || isPlanner) && (
        <div className="mobile-employee-panel">
          <h3 className="mobile-employee-panel-title">Mitarbeiter</h3>

          <div className="mobile-employee-panel-list">
            {panelEmployees.map((employee) => {
              const hours = hoursMap[employee.id] ?? 0;
              const max = employee.max_hours ?? 0;
              const remaining = max - hours;

              return (
                <div key={employee.id} className="mobile-employee-panel-item">
                  <strong>{employee.name ?? "Ohne Namen"}</strong>

                  <span>
                    {hours.toFixed(2)} / {max.toFixed(2)} Std ·{" "}
                    {remaining.toFixed(2)} frei
                  </span>
                </div>
              );
            })}
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

      {view === "today" && (isAdmin || isPlanner) && (
        <MobileTodayViewAdmin stationName={stationName} />
      )}

      {view === "today" && isEmployee && (
        <MobileTodayViewEmployee
          stationName={stationName}
          employees={employees}
          onOpenMonth={() => setView("month")}
        />
      )}

      {view === "month" && (isAdmin || isPlanner) && (
        <MobileMonthViewAdmin stationName={stationName} />
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