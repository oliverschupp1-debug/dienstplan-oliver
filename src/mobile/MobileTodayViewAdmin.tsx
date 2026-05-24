import { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { useOverrides } from "../useOverrides";
import { useAbsences } from "../hooks/useAbsences";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import "./MobileTodayView.css";

type Props = {
  stationName: string;
};

function getLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addIsoDays(iso: string, days: number): string {
  const date = parseLocalISO(iso);
  date.setDate(date.getDate() + days);
  return getLocalISO(date);
}

function getStoredShiftName(date: Date, shiftName: string, holidayName?: string) {
  const jsDay = date.getDay();

  if (holidayName) return `Feiertag ${shiftName}`;
  if (jsDay === 0) return `Sonntag ${shiftName}`;
  if (jsDay === 6) return `Samstag ${shiftName}`;

  return shiftName;
}

function absenceLabel(type: string) {
  if (type === "vacation") return "Urlaub";
  if (type === "sick") return "Krank";
  return "Abwesend";
}

export default function MobileTodayViewAdmin({ stationName }: Props) {
  const [currentIso, setCurrentIso] = useState(() => getLocalISO(new Date()));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const currentDate = parseLocalISO(currentIso);
  const stationId = stationName;
  const iso = currentIso;

  const { employees } = useEmployees(stationId);
  const safeEmployees = Array.isArray(employees)
    ? employees.filter((employee) => employee.role !== "admin")
    : [];

  const { assignments, addAssignment, removeAssignment } =
    useAssignments(stationId);

  const { overrides } = useOverrides(stationId);
  const { absences } = useAbsences(stationId);

  const shiftModel = getShiftModelForStation(stationId);

  const holiday = isHoliday(iso);
  const holidayName = holiday?.name ?? undefined;

  const weekdayIndex = (currentDate.getDay() + 6) % 7;
  const overrideShifts = overrides[iso] ?? null;

  const shiftList = useMemo(() => {
    if (overrideShifts && overrideShifts.length > 0) {
      return overrideShifts.map((shift) => ({
        name: shift.name,
        start: shift.start,
        end: shift.end,
      }));
    }

    if (holidayName && shiftModel.holiday.length > 0) return shiftModel.holiday;
    if (weekdayIndex === 6) return shiftModel.sunday;
    if (weekdayIndex === 5) return shiftModel.saturday;

    return shiftModel.weekdays;
  }, [overrideShifts, holidayName, shiftModel, weekdayIndex]);

  const filteredEmployees = useMemo(() => {
    return safeEmployees.filter((employee) => {
      const employeeName = employee.name ?? "Ohne Namen";
      return employeeName.toLowerCase().includes(search.toLowerCase());
    });
  }, [safeEmployees, search]);

  function getEmployeeName(employeeId: string) {
    return (
      safeEmployees.find((employee) => employee.id === employeeId)?.name ??
      "Unbekannt"
    );
  }

  function getAbsenceForEmployee(employeeId: string) {
    return absences.find(
      (absence) =>
        absence.employee_id === employeeId &&
        absence.start_date <= iso &&
        absence.end_date >= iso
    );
  }

  function handleEmployeeTap(employeeId: string) {
    const absence = getAbsenceForEmployee(employeeId);

    if (absence) {
      alert(
        `${getEmployeeName(employeeId)} ist am ${iso} als "${absenceLabel(
          absence.type
        )}" markiert.`
      );
      return;
    }

    setSelectedEmployeeId((current) =>
      current === employeeId ? null : employeeId
    );
  }

  function handleShiftTap(shiftName: string) {
    if (!selectedEmployeeId) return;

    const absence = getAbsenceForEmployee(selectedEmployeeId);

    if (absence) {
      alert(
        `${getEmployeeName(selectedEmployeeId)} ist am ${iso} als "${absenceLabel(
          absence.type
        )}" markiert und kann nicht eingeplant werden.`
      );
      setSelectedEmployeeId(null);
      return;
    }

    addAssignment({
      date: iso,
      shift_name: getStoredShiftName(currentDate, shiftName, holidayName),
      employee_id: selectedEmployeeId,
      station_id: stationId,
    });

    setSelectedEmployeeId(null);
  }

  const weekdayNames = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ];

  return (
    <div className="mobile-root">
      <div className="mobile-today-header">
        <button
          className="mobile-button small"
          type="button"
          onClick={() => {
            setSelectedEmployeeId(null);
            setCurrentIso((value) => addIsoDays(value, -1));
          }}
        >
          ←
        </button>

        <div>
          <h2 className="mobile-today-title">
            {weekdayNames[weekdayIndex]}, {currentDate.getDate()}.
            {currentDate.getMonth() + 1}.{currentDate.getFullYear()}
          </h2>

          {holidayName && (
            <div className="mobile-holiday-banner">{holidayName}</div>
          )}
        </div>

        <button
          className="mobile-button small"
          type="button"
          onClick={() => {
            setSelectedEmployeeId(null);
            setCurrentIso((value) => addIsoDays(value, 1));
          }}
        >
          →
        </button>
      </div>

      <div className="admin-override-row">
        <button
          className="mobile-button"
          type="button"
          onClick={() => {
            setSelectedEmployeeId(null);
            setCurrentIso(getLocalISO(new Date()));
          }}
        >
          Heute
        </button>
      </div>

      <input
        type="text"
        placeholder="Mitarbeiter suchen…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mobile-search"
      />

      <div className="mobile-employee-list">
        {filteredEmployees.map((employee) => {
          const isSelected = selectedEmployeeId === employee.id;
          const absence = getAbsenceForEmployee(employee.id);

          return (
            <button
              key={employee.id}
              type="button"
              className={
                "mobile-employee-pill" +
                (isSelected ? " selected" : "") +
                (absence ? " mobile-employee-pill-absent" : "")
              }
              onClick={() => handleEmployeeTap(employee.id)}
            >
              {employee.name ?? "Ohne Namen"}
              {absence ? ` · ${absenceLabel(absence.type)}` : ""}
            </button>
          );
        })}
      </div>

      {selectedEmployeeId && (
        <div className="mobile-empty-hint">
          Schicht antippen, um{" "}
          <strong>{getEmployeeName(selectedEmployeeId)}</strong> einzuplanen.
        </div>
      )}

      <div className="mobile-shift-list">
        {shiftList.map((shift) => {
          const storedShiftName = getStoredShiftName(
            currentDate,
            shift.name,
            holidayName
          );

          const shiftAssignments = assignments.filter(
            (assignment) =>
              assignment.date === iso &&
              assignment.shift_name === storedShiftName &&
              assignment.station_id === stationId
          );

          return (
            <button
              key={`${iso}-${shift.name}`}
              className="mobile-shift-card"
              type="button"
              onClick={() => handleShiftTap(shift.name)}
            >
              <div className="mobile-shift-title">
                <strong>{shift.name}</strong>
                <span>
                  {shift.start} – {shift.end}
                </span>
              </div>

              <div className="mobile-employee-list">
                {shiftAssignments.length === 0 && (
                  <div className="mobile-empty-hint">
                    Mitarbeiter antippen, dann diese Schicht antippen
                  </div>
                )}

                {shiftAssignments.map((assignment) => {
                  const absence = getAbsenceForEmployee(assignment.employee_id);

                  return (
                    <span
                      key={assignment.id}
                      className={
                        "mobile-employee-pill" +
                        (absence ? " mobile-employee-pill-absent" : "")
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        removeAssignment(assignment.id);
                      }}
                    >
                      {getEmployeeName(assignment.employee_id)}
                      {absence ? ` · ${absenceLabel(absence.type)}` : ""} ×
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}