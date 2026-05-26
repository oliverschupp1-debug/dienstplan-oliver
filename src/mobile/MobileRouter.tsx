import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAppStore } from "../store/useAppStore";
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

type AbsenceDraft = {
  start_date: string;
  end_date: string;
  type: "vacation" | "sick" | "unavailable";
  note: string;
};

function absenceLabel(type: string) {
  if (type === "vacation") return "Urlaub";
  if (type === "sick") return "Krank";
  return "Abwesend";
}

function countVacationDaysInYear(start: string, end: string, year: number) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const current =
    startDate > yearStart ? new Date(startDate) : new Date(yearStart);
  const last = endDate < yearEnd ? new Date(endDate) : new Date(yearEnd);

  let count = 0;

  while (current <= last) {
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
  const employeeId = useAppStore((state) => state.employeeId);

  const [view, setView] = useState<"today" | "month">("today");
  const [showEmployees, setShowEmployees] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  const [mobileYear, setMobileYear] = useState(today.getFullYear());
  const [mobileMonth, setMobileMonth] = useState(today.getMonth());

  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(
    null
  );

  const [absenceDrafts, setAbsenceDrafts] = useState<
    Record<string, AbsenceDraft>
  >({});

  const [extraEmployeeStations, setExtraEmployeeStations] = useState<string[]>(
    []
  );

  const { employees: allPanelEmployees } = useEmployees(stationName);
  const { absences, createAbsence, deleteAbsence } = useAbsences(stationName);

  const panelEmployees = useMemo(
    () => allPanelEmployees.filter((employee) => employee.role !== "admin"),
    [allPanelEmployees]
  );

  const employeeStationIds = useMemo(() => {
    return Array.from(
      new Set([stationName, ...extraEmployeeStations].filter(Boolean))
    );
  }, [stationName, extraEmployeeStations]);

  const { hoursMap } = useAllMonthlyHours(
    stationName,
    mobileYear,
    mobileMonth,
    reloadFlag
  );

  useEffect(() => {
    async function loadEmployeeStationAccess() {
      if (role !== "employee" || !employeeId) {
        setExtraEmployeeStations([]);
        return;
      }

      const { data, error } = await supabase
        .from("employee_station_access")
        .select("station_id")
        .eq("employee_id", employeeId);

      if (error) {
        console.error("Zusatzstationen konnten nicht geladen werden:", error);
        setExtraEmployeeStations([]);
        return;
      }

      setExtraEmployeeStations(
        (data ?? [])
          .map((row) => row.station_id as string)
          .filter((stationId) => stationId && stationId !== stationName)
      );
    }

    loadEmployeeStationAccess();
  }, [role, employeeId, stationName]);

  useEffect(() => {
    const nextDrafts: Record<string, AbsenceDraft> = {};

    for (const employee of panelEmployees) {
      nextDrafts[employee.id] = absenceDrafts[employee.id] ?? {
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

  function updateAbsenceDraft(
    employeeIdValue: string,
    patch: Partial<AbsenceDraft>
  ) {
    setAbsenceDrafts((current) => ({
      ...current,
      [employeeIdValue]: {
        ...current[employeeIdValue],
        ...patch,
      },
    }));
  }

  async function handleCreateAbsence(employeeIdValue: string) {
    const draft = absenceDrafts[employeeIdValue];

    if (!draft?.start_date || !draft?.end_date) {
      alert("Bitte Zeitraum auswählen.");
      return;
    }

    try {
      await createAbsence({
        employee_id: employeeIdValue,
        station_id: stationName,
        start_date: draft.start_date,
        end_date: draft.end_date,
        type: draft.type,
        note: draft.note,
      });

      setAbsenceDrafts((current) => ({
        ...current,
        [employeeIdValue]: {
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

  async function handleDeleteAbsence(id: string) {
    try {
      await deleteAbsence(id);
    } catch {
      alert("Abwesenheit konnte nicht gelöscht werden.");
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

              const employeeAbsences = absences.filter(
                (absence) => absence.employee_id === employee.id
              );

              const vacationTotal = employee.vacation_days_total ?? 0;

              const vacationUsed = employeeAbsences
                .filter((absence) => absence.type === "vacation")
                .reduce(
                  (sum, absence) =>
                    sum +
                    countVacationDaysInYear(
                      absence.start_date,
                      absence.end_date,
                      mobileYear
                    ),
                  0
                );

              const vacationRemaining = vacationTotal - vacationUsed;
              const expanded = expandedEmployeeId === employee.id;
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
                        current === employee.id ? null : employee.id
                      )
                    }
                  >
                    <div>
                      <strong>{employee.name ?? "Ohne Namen"}</strong>

                      <span>
                        Stunden: {hours.toFixed(2)} / {max.toFixed(2)} ·{" "}
                        {remaining.toFixed(2)} frei
                      </span>

                      <span>
                        Urlaub: {vacationUsed.toFixed(1)} /{" "}
                        {vacationTotal.toFixed(1)} ·{" "}
                        {vacationRemaining.toFixed(1)} offen
                      </span>

                      {employee.remarks && (
                        <span>Bemerkung: {employee.remarks}</span>
                      )}
                    </div>

                    <div className="mobile-employee-expand-icon">
                      {expanded ? "−" : "+"}
                    </div>
                  </div>

                  {expanded && draft && (
                    <div className="mobile-employee-expanded">
                      {employee.vacation_note && (
                        <div className="mobile-employee-note">
                          Urlaub: {employee.vacation_note}
                        </div>
                      )}

                      <div className="mobile-absence-form">
                        <input
                          type="date"
                          value={draft.start_date}
                          onChange={(event) =>
                            updateAbsenceDraft(employee.id, {
                              start_date: event.target.value,
                            })
                          }
                        />

                        <input
                          type="date"
                          value={draft.end_date}
                          onChange={(event) =>
                            updateAbsenceDraft(employee.id, {
                              end_date: event.target.value,
                            })
                          }
                        />

                        <select
                          value={draft.type}
                          onChange={(event) =>
                            updateAbsenceDraft(employee.id, {
                              type: event.target.value as AbsenceDraft["type"],
                            })
                          }
                        >
                          <option value="vacation">Urlaub</option>
                          <option value="sick">Krank</option>
                          <option value="unavailable">Abwesend</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Notiz"
                          value={draft.note}
                          onChange={(event) =>
                            updateAbsenceDraft(employee.id, {
                              note: event.target.value,
                            })
                          }
                        />

                        <button
                          type="button"
                          className="mobile-employee-save-btn"
                          onClick={() => handleCreateAbsence(employee.id)}
                        >
                          Abwesenheit speichern
                        </button>
                      </div>

                      <div className="mobile-absence-list">
                        {employeeAbsences.map((absence) => (
                          <div
                            key={absence.id}
                            className={`mobile-absence-pill mobile-absence-${absence.type}`}
                          >
                            <div>
                              <strong>{absenceLabel(absence.type)}</strong>
                              <div>
                                {absence.start_date} → {absence.end_date}
                              </div>
                              {absence.note && <div>{absence.note}</div>}
                            </div>

                            <button
                              type="button"
                              className="mobile-absence-delete"
                              onClick={() => handleDeleteAbsence(absence.id)}
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
          stationIds={employeeStationIds}
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
          stationIds={employeeStationIds}
          employees={employees}
        />
      )}
    </div>
  );
}