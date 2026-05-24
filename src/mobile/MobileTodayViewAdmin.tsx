import { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { useOverrides } from "../useOverrides";
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

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getStoredShiftName(date: Date, shiftName: string, holidayName?: string) {
  const jsDay = date.getDay();

  if (holidayName) return `Feiertag ${shiftName}`;
  if (jsDay === 0) return `Sonntag ${shiftName}`;
  if (jsDay === 6) return `Samstag ${shiftName}`;

  return shiftName;
}

export default function MobileTodayViewAdmin({ stationName }: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const stationId = stationName;
  const iso = getLocalISO(currentDate);

  const { employees } = useEmployees(stationId);
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments, addAssignment, removeAssignment } =
    useAssignments(stationId);

  const { overrides } = useOverrides(stationId);
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

  function handleShiftTap(shiftName: string) {
    if (!selectedEmployeeId) return;

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
          onClick={() => setCurrentDate((date) => addDays(date, -1))}
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
          onClick={() => setCurrentDate((date) => addDays(date, 1))}
        >
          →
        </button>
      </div>

      <div className="admin-override-row">
        <button
          className="mobile-button"
          type="button"
          onClick={() => setCurrentDate(new Date())}
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

          return (
            <button
              key={employee.id}
              type="button"
              className={
                "mobile-employee-pill" + (isSelected ? " selected" : "")
              }
              onClick={() =>
                setSelectedEmployeeId(isSelected ? null : employee.id)
              }
            >
              {employee.name ?? "Ohne Namen"}
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

                {shiftAssignments.map((assignment) => (
                  <span
                    key={assignment.id}
                    className="mobile-employee-pill"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeAssignment(assignment.id);
                    }}
                  >
                    {getEmployeeName(assignment.employee_id)} ×
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}