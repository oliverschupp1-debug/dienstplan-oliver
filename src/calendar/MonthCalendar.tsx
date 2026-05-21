import React, { useState, useMemo, useEffect } from "react";
import type { DragEvent } from "react";
import { generateCalendar } from "./calendarUtils";
import OverridePanel from "../components/OverridePanel";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { supabase } from "../lib/supabaseClient";
import { assignmentsChanged, onAssignmentsChanged } from "../events";
import "./MonthCalendar.css";

type Props = {
  stationName: string;
  year: number;
  month: number;
  onMonthChange?: (year: number, month: number) => void;
};

const ORDER = ["Früh", "Früh 2", "Mittel", "Spät"];

function mapShiftNameForStorage(day: any, shiftName: string) {
  if (day.isHoliday) return `Feiertag ${shiftName}`;
  if (day.weekday === 6) return `Sonntag ${shiftName}`;
  if (day.weekday === 5) return `Samstag ${shiftName}`;
  return shiftName;
}

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

export default function MonthCalendar({
  stationName,
  year,
  month,
  onMonthChange,
}: Props) {
  const safeStation = (stationName ?? "").toLowerCase();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const calendar = useMemo(
    () => generateCalendar(year, month),
    [year, month]
  );

  const model = useMemo(
    () => getShiftModelForStation(safeStation),
    [safeStation]
  );

  const monthNames = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];

  // ------------------------------------------------------------
  // Laden von Assignments + Employees
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      if (!safeStation) return;

      const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
      const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

      const { data: aData } = await supabase
        .from("assignments")
        .select("*")
        .eq("station_id", safeStation)
        .gte("date", firstDay)
        .lte("date", lastDay);

      setAssignments((aData ?? []) as Assignment[]);

      const { data: eData } = await supabase
        .from("employees")
        .select("id,name")
        .eq("station_id", safeStation)
        .order("name", { ascending: true });

      setEmployees((eData ?? []) as Employee[]);
    }

    load();

    const off = onAssignmentsChanged(() => {
      load();
    });

    return () => off();
  }, [safeStation, year, month]);

  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------
  function handlePrevMonth() {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    onMonthChange?.(newYear, newMonth);
  }

  function handleNextMonth() {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    onMonthChange?.(newYear, newMonth);
  }

  // ------------------------------------------------------------
  // Hilfsfunktionen
  // ------------------------------------------------------------
  function getShiftsForDay(day: any) {
    if (day.isHoliday) return model.holiday;
    if (day.isSunday) return model.sunday;
    if (day.isSaturday) return model.saturday;
    return model.weekdays;
  }

  function getAssignmentsForDayAndShift(iso: string, shiftName: string) {
    return assignments.filter(
      (a) => a.date === iso && a.shift_name === shiftName
    );
  }

  function getEmployeeName(id: string) {
    return employees.find((e) => e.id === id)?.name ?? "Unbekannt";
  }

  // ------------------------------------------------------------
  // Drag & Drop
  // ------------------------------------------------------------
  async function assignEmployee(
    iso: string,
    shiftName: string,
    employeeId: string
  ) {
    const day = calendar.flatMap((w) => w.days).find((d) => d.iso === iso);
    if (!day) return;

    const mappedName = mapShiftNameForStorage(day, shiftName);

    await supabase.from("assignments").insert({
      station_id: safeStation,
      date: iso,
      shift_name: mappedName,
      employee_id: employeeId,
    });

    assignmentsChanged();
  }

  function handleDrop(
    e: DragEvent<HTMLDivElement>,
    iso: string,
    shiftName: string
  ) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed.employeeId) return;
      assignEmployee(iso, shiftName, parsed.employeeId);
    } catch {}
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // ------------------------------------------------------------
  // Override Panel
  // ------------------------------------------------------------
  function openOverride(iso: string) {
    setSelectedDate(iso);
  }

  function closeOverride() {
    setSelectedDate(null);
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="month-root">
      <div className="calendar-header">
        <button className="nav-btn" onClick={handlePrevMonth}>◀</button>

        <h2 className="calendar-title">
          {monthNames[month]} {year}
        </h2>

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

              return (
                <div
                  key={day.iso}
                  className={
                    "calendar-cell" +
                    (day.isOutsideMonth ? " outside-month" : "")
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
                  </div>

                  <div className="shift-list">
                    {shifts
                      .slice()
                      .sort(
                        (a, b) =>
                          ORDER.indexOf(a.name) - ORDER.indexOf(b.name)
                      )
                      .map((shift) => {
                        const baseName = shift.name;
                        const mappedName = mapShiftNameForStorage(
                          day,
                          baseName
                        );

                        const dayAssignments = getAssignmentsForDayAndShift(
                          day.iso,
                          mappedName
                        );

                        return (
                          <div
                            key={baseName}
                            className="shift-row"
                            onDrop={(e) =>
                              handleDrop(e, day.iso, baseName)
                            }
                            onDragOver={handleDragOver}
                          >
                            <div className="shift-header">
                              <span className="shift-name">{baseName}</span>
                              <span className="shift-time">
                                {shift.start} - {shift.end}
                              </span>
                            </div>

                            <div className="shift-employees-dark">
                              {dayAssignments.map((a) => (
                                <div
                                  key={a.id}
                                  className="shift-employee-item-dark"
                                >
                                  <div className="shift-employee-name-dark">
                                    {getEmployeeName(a.employee_id)}
                                  </div>
                                  <button
                                    className="shift-employee-remove-dark"
                                    onClick={() =>
                                      supabase
                                        .from("assignments")
                                        .delete()
                                        .eq("id", a.id)
                                        .then(() => assignmentsChanged())
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}

                              {dayAssignments.length === 0 && (
                                <div className="shift-dropzone">
                                  <span className="drop-hint">
                                    Mitarbeiter hierher ziehen
                                  </span>
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

      {selectedDate && (
        <OverridePanel
          date={selectedDate}
          stationName={safeStation}
          onClose={closeOverride}
        />
      )}
    </div>
  );
}
