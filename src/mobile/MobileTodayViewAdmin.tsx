// src/mobile/MobileTodayViewAdmin.tsx
import React, { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useOverrides } from "../useOverrides";
import { getHolidayInfo } from "../calendar/calendarUtils";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { useTouchNavigation } from "../useTouchNavigation";

interface Employee {
  id: string;
  name: string;
}

interface Props {
  stationName: string;
  employees: Employee[];
  onOpenMonth: () => void;
}

function getLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function MobileTodayViewAdmin({
  stationName,
  employees,
  onOpenMonth,
}: Props) {
  const today = new Date();
  const iso = getLocalISO(today);

  const safeStation = (stationName ?? "").toLowerCase();
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const shiftModel = getShiftModelForStation(safeStation);

  const { assignments, addAssignment, removeAssignment } =
    useAssignments(safeStation);

  const { overrides, saveOverride } = useOverrides(safeStation);

  const [dragEmployee, setDragEmployee] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const holiday = getHolidayInfo(iso);

  const overrideShifts = overrides[iso] ?? null;

  const model = useMemo(() => {
    if (!shiftModel) return [];

    if (overrideShifts) return overrideShifts;

    if (holiday?.name) return shiftModel.holiday;

    const weekdayIndex = (today.getDay() + 6) % 7;

    if (weekdayIndex === 6) return shiftModel.sunday;
    if (weekdayIndex === 5) return shiftModel.saturday;

    return shiftModel.weekdays;
  }, [overrideShifts, holiday, shiftModel, today]);

  const filteredEmployees = useMemo(() => {
    return safeEmployees.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [safeEmployees, search]);

  useTouchNavigation({
    onSwipeLeft: onOpenMonth,
    onSwipeRight: onOpenMonth,
  });

  function onDragStart(empId: string) {
    setDragEmployee(empId);
  }

  function onDragEnd() {
    setDragEmployee(null);
  }

  function handleDrop(shiftName: string, e: React.DragEvent) {
    e.currentTarget.classList.remove("mobile-drop-active");

    const existing = assignments.find(
      (a) =>
        a.date === iso &&
        a.shift_name === shiftName &&
        a.station_id === safeStation
    );

    if (existing) removeAssignment(existing.id);
    if (!dragEmployee) return;

    addAssignment({
      date: iso,
      shift_name: shiftName,
      employee_id: dragEmployee,
      station_id: safeStation,
    });
  }

  function openOverrideEditor() {
    const names = prompt(
      "Override setzen: Früh,Mittel,Spät (Komma getrennt) oder leer für Standard"
    );

    if (names === null) return;

    if (names.trim() === "") {
      saveOverride(iso, null);
      return;
    }

    const list = names.split(",").map((s) => s.trim());
    const base = shiftModel.weekdays;

    const newShifts = list
      .map((n) => base.find((s) => s.name === n))
      .filter(Boolean) as any[];

    saveOverride(iso, newShifts);
  }

  function deleteOverride() {
    saveOverride(iso, null);
  }

  return (
    <div className="mobile-root">
      <h2 className="mobile-today-title">Heute – {iso}</h2>

      {holiday?.name && (
        <div className="mobile-holiday-banner">{holiday.name}</div>
      )}

      <div className="admin-override-row">
        <button className="mobile-button" onClick={openOverrideEditor}>
          Override setzen
        </button>

        {overrideShifts && (
          <button className="mobile-button danger" onClick={deleteOverride}>
            Override löschen
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Mitarbeiter suchen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mobile-search"
      />

      <div className="mobile-employee-list">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="mobile-employee-pill"
            draggable
            onDragStart={() => onDragStart(emp.id)}
            onDragEnd={onDragEnd}
          >
            {emp.name}
          </div>
        ))}
      </div>

      <div className="mobile-shift-list">
        {model?.map((shift: any) => (
          <div
            key={shift.name}
            className="mobile-shift-card"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("mobile-drop-active");
            }}
            onDragLeave={(e) =>
              e.currentTarget.classList.remove("mobile-drop-active")
            }
            onDrop={(e) => handleDrop(shift.name, e)}
          >
            <div className="mobile-shift-title">
              {shift.name} ({shift.start}–{shift.end})
            </div>

            <div className="mobile-employee-list">
              {assignments
                .filter(
                  (a) =>
                    a.date === iso &&
                    a.shift_name === shift.name &&
                    a.station_id === safeStation
                )
                .map((a) => {
                  const emp = safeEmployees.find((e) => e.id === a.employee_id);
                  if (!emp) return null;

                  return (
                    <div
                      key={a.id}
                      className="mobile-employee-pill"
                      draggable
                      onDragStart={() => onDragStart(emp.id)}
                      onDragEnd={onDragEnd}
                    >
                      {emp.name}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <button className="mobile-button" onClick={onOpenMonth}>
        Monatsansicht anzeigen
      </button>
    </div>
  );
}
