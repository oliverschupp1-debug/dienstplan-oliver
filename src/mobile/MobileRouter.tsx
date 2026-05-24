import { useEffect, useMemo, useState } from "react";
import { useEmployees } from "../hooks/useEmployees";
import { useAllMonthlyHours } from "../hooks/useAllMonthlyHours";
import { useAbsences } from "../hooks/useAbsences";
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

function absenceLabel(type: string) {
  if (type === "vacation") return "Urlaub";
  if (type === "sick") return "Krank";
  return "Abwesend";
}

function countVacationDays(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  let count = 0;

  const current = new Date(startDate);

  while (current <= endDate) {
    count += 1;
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export default function MobileRouter({
  role,
  stationName,
  employees,
  stations,
  onStationChange,
}: Props) {
  const today = new Date();

  const [view, setView] = useState<"today" | "month">("today");
  const [showEmployees, setShowEmployees] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  const [mobileYear, setMobileYear] = useState(today.getFullYear());
  const [mobileMonth, setMobileMonth] = useState(today.getMonth());

  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(
    null
  );

  const [absenceDrafts, setAbsenceDrafts] = useState<
    Record<
      string,
      {
        start_date: string;
        end_date: string;
        type: "vacation" | "sick" | "unavailable";
        note: string;
      }
    >
  >({});

  const { employees: allPanelEmployees } = useEmployees(stationName);

  const panelEmployees = allPanelEmployees.filter(
    (employee) => employee.role !== "admin"
  );

  const { absences, createAbsence, deleteAbsence } =
    useAbsences(stationName);

  const { hoursMap } = useAllMonthlyHours(
    stationName,
    mobileYear,
    mobileMonth,
    reloadFlag
  );

  useEffect(() => {
    const nextDrafts: Record<
      string,
      {
        start_date: string;
        end_date: string;
        type: "vacation" | "sick" | "unavailable";
        note: string;
      }
    > = {};

    for (const employee of panelEmployees) {
      nextDrafts[employee.id] = {
        start_date: "",
        end_date: "",
        type: "vacation",
        note: "",
      };
    }

    setAbsenceDrafts(nextDrafts);
  }, [panelEmployees]);

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

  const currentYearAbsences = useMemo(() => {
    return absences.filter((absence) => {
      const year = new Date(absence.start_date).getFullYear();
      return year === mobileYear;
    });
  }, [absences, mobileYear]);

  function updateAbsenceDraft(
    employeeId: string,
    patch: Partial<{
      start_date: string;
      end_date: string;
      type: "vacation" | "sick" | "unavailable";
      note: string;
    }>
  ) {
    setAbsenceDrafts((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        ...patch,
      },
    }));
  }

  async function handleCreateAbsence(employeeId: string) {
    const draft = absenceDrafts[employeeId];

    if (!draft?.start_date || !draft?.end_date) {
      alert("Bitte Zeitraum auswählen.");
      return;
    }

    try {
      await createAbsence({
        employee_id: employeeId,
        station_id: stationName,
        start_date: draft.start_date,
        end_date: draft.end_date,
        type: draft.type,
        note: draft.note,
      });

      setAbsenceDrafts((current) => ({
        ...current,
        [employeeId]: {
          start_date: "",
          end_date: "",
          type: "vacation",
          note: "",
        },
      }));
    } catch {
      alert("Abwesenheit konnte nicht gespeichert werden.");
    }
  }

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
          <h3 className="mobile-employee-panel-title">
            Mitarbeiter · {mobileMonth + 1}/{mobileYear}
          </h3>

          <div className="mobile-employee-panel-list">
            {panelEmployees.map((employee) => {
              const hours = hoursMap[employee.id] ?? 0;
              const max = employee.max_hours ?? 0;
              const remaining = max - hours;

              const employeeAbsences = currentYearAbsences.filter(
                (absence) => absence.employee_id === employee.id
              );

              const vacationTotal =
                employee.vacation_days_total ?? 0;

              const vacationUsed = employeeAbsences
                .filter((absence) => absence.type === "vacation")
                .reduce(
                  (sum, absence) =>
                    sum +
                    countVacationDays(
                      absence.start_date,
                      absence.end_date
                    ),
                  0
                );

              const vacationRemaining =
                vacationTotal - vacationUsed;

              const expanded =
                expandedEmployeeId === employee.id;

              const draft = absenceDrafts[employee.id];

              return (
                <div
                  key={employee.id}
                  className="mobile-employee-panel-item mobile-employee-expandable"
                >
                  <div
                    className="mobile-employee-main"
                    onClick={() =>
                      setExpandedEmployeeId((current) =>
                        current === employee.id
                          ? null
                          : employee.id
                      )
                    }
                  >
                    <div>
                      <strong>
                        {employee.name ?? "Ohne Namen"}
                      </strong>

                      <span>
                        {hours.toFixed(2)} /{" "}
                        {max.toFixed(2)} Std ·{" "}
                        {remaining.toFixed(2)} frei
                      </span>

                      <span>
                        Urlaub: {vacationUsed} /{" "}
                        {vacationTotal} · offen:{" "}
                        {vacationRemaining}
                      </span>
                    </div>

                    <div className="mobile-employee-expand-icon">
                      {expanded ? "−" : "+"}
                    </div>
                  </div>

                  {expanded && draft && (
                    <div className="mobile-employee-expanded">
                      <div className="mobile-absence-form">
                        <input
                          type="date"
                          value={draft.start_date}
                          onChange={(e) =>
                            updateAbsenceDraft(employee.id, {
                              start_date: e.target.value,
                            })
                          }
                        />

                        <input
                          type="date"
                          value={draft.end_date}
                          onChange={(e) =>
                            updateAbsenceDraft(employee.id, {
                              end_date: e.target.value,
                            })
                          }
                        />

                        <select
                          value={draft.type}
                          onChange={(e) =>
                            updateAbsenceDraft(employee.id, {
                              type: e.target
                                .value as any,
                            })
                          }
                        >
                          <option value="vacation">
                            Urlaub
                          </option>

                          <option value="sick">
                            Krank
                          </option>

                          <option value="unavailable">
                            Abwesend
                          </option>
                        </select>

                        <input
                          type="text"
                          placeholder="Notiz"
                          value={draft.note}
                          onChange={(e) =>
                            updateAbsenceDraft(employee.id, {
                              note: e.target.value,
                            })
                          }
                        />

                        <button
                          type="button"
                          className="mobile-employee-save-btn"
                          onClick={() =>
                            handleCreateAbsence(employee.id)
                          }
                        >
                          Speichern
                        </button>
                      </div>

                      <div className="mobile-absence-list">
                        {employeeAbsences.map((absence) => (
                          <div
                            key={absence.id}
                            className={`mobile-absence-pill mobile-absence-${absence.type}`}
                          >
                            <div>
                              <strong>
                                {absenceLabel(absence.type)}
                              </strong>

                              <div>
                                {absence.start_date} →{" "}
                                {absence.end_date}
                              </div>

                              {absence.note && (
                                <div>{absence.note}</div>
                              )}
                            </div>

                            <button
                              type="button"
                              className="mobile-absence-delete"
                              onClick={() =>
                                deleteAbsence(absence.id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
        <MobileMonthViewAdmin
          stationName={stationName}
          year={mobileYear}
          month={mobileMonth}
          onMonthChange={(nextYear, nextMonth) => {
            setMobileYear(nextYear);
            setMobileMonth(nextMonth);
          }}
        />
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