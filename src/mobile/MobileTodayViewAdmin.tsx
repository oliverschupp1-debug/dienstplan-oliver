// src/mobile/MobileTodayViewAdmin.tsx
import React, { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useOverrides } from "../useOverrides";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { useTouchNavigation } from "../useTouchNavigation";
import "./MobileTodayView.css";

type Employee = {
  id: string;
  name: string;
};

type Props = {
  stationName: string;
  employees: Employee[];
  onOpenMonth: () => void;
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

export default function MobileTodayViewAdmin({
  stationName,
  employees,
  onOpenMonth,
}: Props) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(today);
  const [dragEmployee, setDragEmployee] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const iso = getLocalISO(currentDate);
  const stationId = stationName;
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const shiftModel = getShiftModelForStation(stationId);
  const { assignments, addAssignment, removeAssignment } =
    useAssignments(stationId);
  const { overrides } = useOverrides(stationId);

  const holiday = isHoliday(iso);
  const overrideShifts = overrides[iso] ?? null;
  const hasOverride = Boolean(overrideShifts && overrideShifts.length > 0);

  const weekdayIndex = (currentDate.getDay() + 6) % 7;

  const baseShifts = useMemo(() => {
    if (holiday?.name) return shiftModel.holiday;
    if (weekdayIndex === 6) return shiftModel.sunday;
    if (weekdayIndex === 5) return shiftModel.saturday;
    return shiftModel.weekdays;
  }, [holiday, weekdayIndex, shiftModel]);

  const shiftList = useMemo(() => {
    if (overrideShifts && overrideShifts.length > 0) {
      return overrideShifts.map((shift) => ({
        name: shift.name,
        start: shift.start,
        end: shift.end,
      }));
    }

    return baseShifts;
  }, [overrideShifts, baseShifts]);

  const filteredEmployees = useMemo(() => {
    return safeEmployees.filter((employee) => {
      const employeeName = employee.name ?? "Ohne Namen";
      return employeeName.toLowerCase().includes(search.toLowerCase());
    });
  }, [safeEmployees, search]);

  useTouchNavigation({
    onSwipeLeft: () => setCurrentDate((date) => addDays(date, 1)),
    onSwipeRight: () => setCurrentDate((date) => addDays(date, -1)),
    onSwipeUp: onOpenMonth,
    onSwipeDown: () => setCurrentDate(new Date()),
  });

  function handleDragStart(employeeId: string) {
    setDragEmployee(employeeId);
  }

  function handleDragEnd() {
    setDragEmployee(null);
  }

  function handleDrop(shiftName: string, event: React.DragEvent) {
    event.currentTarget.classList.remove("mobile-drop-active");

    if (!dragEmployee) return;

    addAssignment({
      date: iso,
      shift_name: shiftName,
      employee_id: dragEmployee,
      station_id: stationId,
    });

    setDragEmployee(null);
  }

  function handleRemoveAssignment(id: string) {
    removeAssignment(id);
  }

  function getEmployeeName(employeeId: string) {
    return (
      safeEmployees.find((employee) => employee.id === employeeId)?.name ??
      "Unbekannt"
    );
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

          {holiday?.name && (
            <div className="mobile-holiday-banner">{holiday.name}</div>
          )}

          {hasOverride && (
            <div className="mobile-month-override" title="Override vorhanden">
              *
            </div>
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

        <button className="mobile-button" type="button" onClick={onOpenMonth}>
          Monatsansicht
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
          const employeeName = employee.name ?? "Ohne Namen";

          return (
            <div
              key={employee.id}
              className="mobile-employee-pill"
              draggable
              onDragStart={() => handleDragStart(employee.id)}
              onDragEnd={handleDragEnd}
            >
              {employeeName}
            </div>
          );
        })}
      </div>

      <div className="mobile-shift-list">
        {shiftList.map((shift) => {
          const shiftAssignments = assignments.filter(
            (assignment) =>
              assignment.date === iso &&
              assignment.shift_name === shift.name &&
              assignment.station_id === stationId
          );

          return (
            <div
              key={`${iso}-${shift.name}`}
              className="mobile-shift-card"
              onDragOver={(event) => {
                event.preventDefault();
                event.currentTarget.classList.add("mobile-drop-active");
              }}
              onDragLeave={(event) =>
                event.currentTarget.classList.remove("mobile-drop-active")
              }
              onDrop={(event) => handleDrop(shift.name, event)}
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
                    Mitarbeiter hier ablegen
                  </div>
                )}

                {shiftAssignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    className="mobile-employee-pill"
                    type="button"
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    title="Antippen zum Entfernen"
                  >
                    {getEmployeeName(assignment.employee_id)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}