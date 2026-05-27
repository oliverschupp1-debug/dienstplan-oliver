// src/calendar/MonthCalendar.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";

import { generateCalendar } from "./calendarUtils";
import OverridePanel from "../components/OverridePanel";
import { getShiftModelForStation, type Shift } from "../shiftModelsDefault";
import { supabase } from "../lib/supabaseClient";
import { assignmentsChanged, onAssignmentsChanged } from "../events";
import { useAppStore } from "../store/useAppStore";
import { useAbsences } from "../hooks/useAbsences";

import "./MonthCalendar.css";

type Props = {
  stationName: string;
  year: number;
  month: number;
  onMonthChange?: (year: number, month: number) => void;
};

type Assignment = {
  id: string;
  date: string;
  station_id: string;
  shift_name: string;
  employee_id: string;
};

type Employee = {
  id: string;
  name: string;
};

type DayOverride = {
  id: number;
  date: string;
  note: string | null;
};

type OverrideShift = {
  override_id: number;
  name: string;
  start_time: string;
  end_time: string;
  employee: string | null;
};

type PrintableShift = {
  name: string;
  start: string;
  end: string;
  people: string[];
};

const ORDER = ["Früh", "Früh 2", "Mittel", "Spät", "Sonstige"];

function normalizeShiftName(name: string) {
  return name
    .replace(/^Feiertag\s+/i, "")
    .replace(/^Samstag\s+/i, "")
    .replace(/^Sonntag\s+/i, "")
    .trim();
}

function sortShifts(a: Shift, b: Shift) {
  const ia = ORDER.indexOf(a.name);
  const ib = ORDER.indexOf(b.name);

  if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
  if (ia === -1) return 1;
  if (ib === -1) return -1;

  return ia - ib;
}

function absenceLabel(type: string) {
  if (type === "vacation") return "Urlaub";
  if (type === "sick") return "Krank";
  if (type === "unavailable") return "Abwesend";
  return "Abwesend";
}

function localDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isErsatzShift(name: string) {
  return name.startsWith("Ersatz");
}

function displayShiftName(name: string) {
  return isErsatzShift(name) ? "Ersatz" : name;
}

export default function MonthCalendar({
  stationName,
  year,
  month,
  onMonthChange,
}: Props) {
  const role = useAppStore((s) => s.role);
  const stationId = stationName;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dayOverrides, setDayOverrides] = useState<DayOverride[]>([]);
  const [overrideShifts, setOverrideShifts] = useState<OverrideShift[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { absences } = useAbsences(stationId);

  const calendar = useMemo(() => generateCalendar(year, month), [year, month]);

  const model = useMemo(() => getShiftModelForStation(stationId), [stationId]);

  const overrideByDate = useMemo(() => {
    const map = new Map<string, DayOverride>();
    for (const row of dayOverrides) map.set(row.date, row);
    return map;
  }, [dayOverrides]);

  const overrideShiftsByDate = useMemo(() => {
    const map = new Map<string, OverrideShift[]>();
    const dateByOverrideId = new Map<number, string>();

    for (const row of dayOverrides) {
      dateByOverrideId.set(row.id, row.date);
    }

    for (const shift of overrideShifts) {
      const date = dateByOverrideId.get(shift.override_id);
      if (!date) continue;
      map.set(date, [...(map.get(date) ?? []), shift]);
    }

    return map;
  }, [dayOverrides, overrideShifts]);

  const monthNames = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!stationId) {
        setAssignments([]);
        setEmployees([]);
        setDayOverrides([]);
        setOverrideShifts([]);
        return;
      }

      const firstDay = localDateString(new Date(year, month, 1));
      const lastDay = localDateString(new Date(year, month + 1, 0));

      const { data: aData } = await supabase
        .from("assignments")
        .select("*")
        .eq("station_id", stationId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      const { data: stationEmployees } = await supabase
        .from("employees")
        .select("id, name")
        .eq("station_id", stationId)
        .order("name", { ascending: true });

      const { data: accessRows } = await supabase
        .from("employee_station_access")
        .select("employee_id")
        .eq("station_id", stationId);

      const extraEmployeeIds = (accessRows ?? [])
        .map((row) => row.employee_id as string)
        .filter(Boolean);

      let extraEmployees: Employee[] = [];

      if (extraEmployeeIds.length > 0) {
        const { data } = await supabase
          .from("employees")
          .select("id, name")
          .in("id", extraEmployeeIds);

        extraEmployees = (data ?? []) as Employee[];
      }

      const employeeMap = new Map<string, Employee>();

      for (const employee of (stationEmployees ?? []) as Employee[]) {
        employeeMap.set(employee.id, employee);
      }

      for (const employee of extraEmployees) {
        employeeMap.set(employee.id, employee);
      }

      const mergedEmployees = Array.from(employeeMap.values()).sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "de")
      );

      const { data: overrideData } = await supabase
        .from("day_overrides")
        .select("id, date, note")
        .eq("station_id", stationId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      if (cancelled) return;

      setAssignments((aData ?? []) as Assignment[]);
      setEmployees(mergedEmployees);

      const overrides = (overrideData ?? []) as DayOverride[];
      setDayOverrides(overrides);

      const overrideIds = overrides.map((row) => row.id);

      if (overrideIds.length === 0) {
        setOverrideShifts([]);
        return;
      }

      const { data: shiftData } = await supabase
        .from("override_shifts")
        .select("override_id, name, start_time, end_time, employee")
        .in("override_id", overrideIds);

      if (cancelled) return;

      setOverrideShifts((shiftData ?? []) as OverrideShift[]);
    }

    load();

    const off = onAssignmentsChanged(() => load());

    return () => {
      cancelled = true;
      off();
    };
  }, [stationId, year, month]);

  function handlePrevMonth() {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    onMonthChange?.(newYear, newMonth);
  }

  function handleNextMonth() {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    onMonthChange?.(newYear, newMonth);
  }

  function getBaseShiftsForDay(day: any) {
    if (day.isHoliday) return model.holiday;
    if (day.isSunday) return model.sunday;
    if (day.isSaturday) return model.saturday;
    return model.weekdays;
  }

  function getShiftsForDay(day: any): Shift[] {
    const baseShifts = getBaseShiftsForDay(day);
    const overridesForDay = overrideShiftsByDate.get(day.iso) ?? [];

    if (overridesForDay.length === 0) {
      return baseShifts.slice().sort(sortShifts);
    }

    const overrideByName = new Map<string, OverrideShift>();

    for (const shift of overridesForDay) {
      overrideByName.set(normalizeShiftName(shift.name), shift);
    }

    const merged: Shift[] = baseShifts.map((baseShift) => {
      const override = overrideByName.get(normalizeShiftName(baseShift.name));
      return override
        ? {
            name: baseShift.name,
            start: override.start_time,
            end: override.end_time,
          }
        : baseShift;
    });

    for (const override of overridesForDay) {
      const exists = merged.some(
        (shift) =>
          normalizeShiftName(shift.name) === normalizeShiftName(override.name)
      );

      if (!exists) {
        merged.push({
          name: override.name,
          start: override.start_time,
          end: override.end_time,
        });
      }
    }

    return merged.sort(sortShifts);
  }

  function getAssignmentsForDayAndShift(iso: string, shiftName: string) {
    return assignments.filter(
      (assignment) =>
        assignment.date === iso &&
        normalizeShiftName(assignment.shift_name) === normalizeShiftName(shiftName)
    );
  }

  function getOverrideEmployeesForDayAndShift(iso: string, shiftName: string) {
    return (overrideShiftsByDate.get(iso) ?? []).filter(
      (shift) =>
        normalizeShiftName(shift.name) === normalizeShiftName(shiftName) &&
        shift.employee
    );
  }

  function getEmployeeName(id: string) {
    return employees.find((employee) => employee.id === id)?.name ?? "Unbekannt";
  }

  function getAbsencesForDate(iso: string) {
    return absences.filter(
      (absence) => absence.start_date <= iso && absence.end_date >= iso
    );
  }

  function getPrintableShiftsForDay(day: any): PrintableShift[] {
    return getShiftsForDay(day)
      .map((shift) => {
        const assignedPeople = getAssignmentsForDayAndShift(day.iso, shift.name)
          .map((assignment) => getEmployeeName(assignment.employee_id))
          .filter(Boolean);

        const overridePeople = getOverrideEmployeesForDayAndShift(
          day.iso,
          shift.name
        )
          .map((overrideShift) => overrideShift.employee ?? "")
          .filter((name) => name.trim() !== "");

        const people = [...assignedPeople, ...overridePeople];

        return {
          name: shift.name,
          start: shift.start,
          end: shift.end,
          people,
        };
      })
      .filter((shift) => shift.people.length > 0);
  }

  async function assignEmployee(iso: string, shiftName: string, employeeId: string) {
    if (!stationId || role === "employee") return;

    const absence = absences.find(
      (item) =>
        item.employee_id === employeeId &&
        item.start_date <= iso &&
        item.end_date >= iso
    );

    if (absence) {
      const name = getEmployeeName(employeeId);
      alert(
        `${name} ist am ${iso} als "${absenceLabel(
          absence.type
        )}" markiert und kann nicht eingeplant werden.`
      );
      return;
    }

    const { error } = await supabase.from("assignments").insert({
      station_id: stationId,
      date: iso,
      shift_name: shiftName,
      employee_id: employeeId,
    });

    if (error) {
      console.error("Assignment konnte nicht gespeichert werden:", error);
      alert("Mitarbeiter konnte nicht eingeplant werden.");
      return;
    }

    assignmentsChanged();
  }

  async function removeAssignment(id: string) {
    if (role === "employee") return;

    const { error } = await supabase.from("assignments").delete().eq("id", id);

    if (error) {
      console.error("Assignment konnte nicht gelöscht werden:", error);
      alert("Mitarbeiter konnte nicht aus dem Plan entfernt werden.");
      return;
    }

    assignmentsChanged();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, iso: string, shiftName: string) {
    if (role === "employee") return;
    e.preventDefault();

    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.employeeId) assignEmployee(iso, shiftName, parsed.employeeId);
    } catch {}
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    if (role === "employee") return;
    e.preventDefault();
  }

  function openOverride(iso: string) {
    if (role === "employee") return;
    setSelectedDate(iso);
  }

  function closeOverride() {
    setSelectedDate(null);
    assignmentsChanged();
  }

  return (
    <div className="month-root">
      <div className="calendar-header">
        <button className="nav-btn" onClick={handlePrevMonth}>◀</button>
        <h2 className="calendar-title">{monthNames[month]} {year}</h2>
        <button className="nav-btn" onClick={handleNextMonth}>▶</button>
      </div>

      <div className="calendar-weekdays">
        <div>KW</div><div>Mo</div><div>Di</div><div>Mi</div>
        <div>Do</div><div>Fr</div><div>Sa</div><div>So</div>
      </div>

      <div className="calendar-grid">
        {calendar.map((week) => (
          <React.Fragment key={week.weekNumber}>
            <div className="calendar-weeknumber">{week.weekNumber}</div>

            {week.days.map((day) => {
              const shifts = getShiftsForDay(day);
              const dayOverride = overrideByDate.get(day.iso);
              const dayAbsences = getAbsencesForDate(day.iso);

              return (
                <div
                  key={day.iso}
                  className={
                    "calendar-cell" +
                    (day.isOutsideMonth ? " outside-month" : "") +
                    (dayOverride ? " has-override" : "") +
                    (dayAbsences.length > 0 ? " has-absence" : "")
                  }
                  onDoubleClick={() => openOverride(day.iso)}
                >
                  <div className="calendar-date">
                    {day.day}

                    {day.isHoliday && (
                      <span className="holiday-badge">
                        {day.holidayName ?? "Feiertag"}
                      </span>
                    )}

                    {dayOverride && (
                      <span className="holiday-badge" title="Override vorhanden">
                        *
                      </span>
                    )}
                  </div>

                  {dayOverride?.note && (
                    <div className="override-note">{dayOverride.note}</div>
                  )}

                  {dayAbsences.length > 0 && (
                    <div className="absence-list">
                      {dayAbsences.map((absence) => (
                        <div
                          key={absence.id}
                          className={`absence-badge absence-${absence.type}`}
                        >
                          {absenceLabel(absence.type)}:{" "}
                          {getEmployeeName(absence.employee_id)}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="shift-list">
                    {shifts.map((shift) => {
                      const dayAssignments = getAssignmentsForDayAndShift(day.iso, shift.name);
                      const overrideEmployees = getOverrideEmployeesForDayAndShift(day.iso, shift.name);

                      return (
                        <div
                          key={`${day.iso}-${shift.name}`}
                          className="shift-row"
                          onDrop={(e) => handleDrop(e, day.iso, shift.name)}
                          onDragOver={handleDragOver}
                        >
                          <div className="shift-header">
                            <span className="shift-name">{displayShiftName(shift.name)}</span>
                            {!isErsatzShift(shift.name) && (
                              <span className="shift-time">
                                {shift.start} - {shift.end}
                              </span>
                            )}
                          </div>

                          <div className="shift-employees-dark">
                            {dayAssignments.map((assignment) => (
                              <div key={assignment.id} className="shift-employee-item-dark">
                                <div className="shift-employee-name-dark">
                                  {getEmployeeName(assignment.employee_id)}
                                </div>

                                {role !== "employee" && (
                                  <button
                                    className="shift-employee-remove-dark"
                                    type="button"
                                    onClick={() => removeAssignment(assignment.id)}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}

                            {overrideEmployees.map((overrideShift, index) => (
                              <div
                                key={`${overrideShift.override_id}-${overrideShift.name}-${index}`}
                                className="shift-employee-item-dark"
                              >
                                <div className="shift-employee-name-dark">
                                  {overrideShift.employee}
                                </div>
                              </div>
                            ))}

                            {role !== "employee" &&
                              dayAssignments.length === 0 &&
                              overrideEmployees.length === 0 && (
                                <div className="shift-dropzone">
                                  Mitarbeiter hierher ziehen
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="print-calendar">
        <div className="print-title">
          {monthNames[month]} {year}
        </div>

        <div className="print-weekdays">
          <div>KW</div>
          <div>Mo</div>
          <div>Di</div>
          <div>Mi</div>
          <div>Do</div>
          <div>Fr</div>
          <div>Sa</div>
          <div>So</div>
        </div>

        <div className="print-grid">
          {calendar.map((week) => (
            <React.Fragment key={`print-${week.weekNumber}`}>
              <div className="print-weeknumber">{week.weekNumber}</div>

              {week.days.map((day) => {
                const dayOverride = overrideByDate.get(day.iso);
                const dayAbsences = getAbsencesForDate(day.iso);
                const printShifts = getPrintableShiftsForDay(day);

                return (
                  <div
                    key={`print-${day.iso}`}
                    className={
                      "print-cell" +
                      (day.isOutsideMonth ? " print-outside-month" : "") +
                      (day.isHoliday ? " print-holiday" : "")
                    }
                  >
                    <div className="print-date">
                      <strong>{day.day}</strong>

                      {day.isHoliday && (
                        <span>{day.holidayName ?? "Feiertag"}</span>
                      )}

                      {dayOverride && <span>*</span>}
                    </div>

                    {dayOverride?.note && (
                      <div className="print-note">{dayOverride.note}</div>
                    )}

                    {dayAbsences.map((absence) => (
                      <div
                        key={`print-absence-${absence.id}`}
                        className="print-absence"
                      >
                        {absenceLabel(absence.type)}:{" "}
                        {getEmployeeName(absence.employee_id)}
                      </div>
                    ))}

                    {printShifts.map((shift) => (
                      <div
                        key={`print-${day.iso}-${shift.name}-${shift.start}-${shift.end}`}
                        className="print-shift"
                      >
                        <div className="print-shift-head">
                          <strong>{displayShiftName(shift.name)}</strong>

                          {!isErsatzShift(shift.name) && (
                            <span>
                              {shift.start} - {shift.end}
                            </span>
                          )}
                        </div>

                        <div className="print-people">
                          {shift.people.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selectedDate && role !== "employee" && (
        <OverridePanel
          date={selectedDate}
          stationName={stationId}
          onClose={closeOverride}
        />
      )}
    </div>
  );
}
