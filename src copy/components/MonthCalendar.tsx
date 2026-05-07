import React, { useMemo, useState } from "react";
import { generateCalendar, CalendarWeek } from "../calendarUtils";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { calculateHours, Assignment } from "../hoursUtils";
import OverridePanel from "./OverridePanel";
import EmployeePanel from "./EmployeePanel"; // ⭐ NEU

type Employee = {
  id: string;
  name: string;
};

type OverrideData = {
  date: string;
  note: string;
  shifts: {
    name: string;
    start: string;
    end: string;
  }[];
};

type Props = {
  stationName: string;
  employees: Employee[];
  initialAssignments: Assignment[];
  initialOverrides: OverrideData[];
};

const MONTHS_DE = [
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
  "Dezember"
];

export default function MonthCalendar({
  stationName,
  employees,
  initialAssignments,
  initialOverrides
}: Props) {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());

  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [overrides, setOverrides] =
    useState<OverrideData[]>(initialOverrides);

  const [dragEmployeeId, setDragEmployeeId] = useState<string | null>(null);
  const [overrideDate, setOverrideDate] = useState<string | null>(null);

  // ⭐ NEU: Mitarbeiter-Panel öffnen/schließen
  const [employeePanelOpen, setEmployeePanelOpen] = useState(false);

  const shiftModel = useMemo(
    () => getShiftModelForStation(stationName),
    [stationName]
  );

  const weeks: CalendarWeek[] = useMemo(
    () => generateCalendar(year, month),
    [year, month]
  );

  const hoursPerEmployee = useMemo(
    () =>
      calculateHours(
        assignments.filter((a) => a.station === stationName),
        shiftModel
      ),
    [assignments, shiftModel, stationName]
  );

  const currentMonthName = MONTHS_DE[month];
  const title = `Dienstplan ${stationName} – ${currentMonthName} ${year}`;

  const yearsRange = Array.from({ length: 15 }).map((_, i) => 2020 + i);

  const getOverridesMap = useMemo(() => {
    const map: Record<string, OverrideData> = {};
    for (const o of overrides) {
      map[o.date] = o;
    }
    return map;
  }, [overrides]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number(e.target.value));
  };

  const onDragStart = (employeeId: string) => {
    setDragEmployeeId(employeeId);
  };

  const onDragEnd = () => {
    setDragEmployeeId(null);
  };

  const onDropOnShift = (dateISO: string, shiftName: string) => {
    if (!dragEmployeeId) return;

    const newAssignment: Assignment = {
      id: `${dateISO}-${shiftName}-${dragEmployeeId}-${Date.now()}`,
      date: dateISO,
      employeeId: dragEmployeeId,
      shift_name: shiftName,
      station: stationName
    };

    setAssignments((prev) => [...prev, newAssignment]);
    setDragEmployeeId(null);
  };

  const removeAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const getAssignmentsForDayAndShift = (dateISO: string, shiftName: string) => {
    return assignments.filter(
      (a) =>
        a.station === stationName &&
        a.date === dateISO &&
        a.shift_name === shiftName
    );
  };

  const openOverride = (dateISO: string) => {
    setOverrideDate(dateISO);
  };

  const handleSaveOverride = (override: OverrideData | null) => {
    if (!override) {
      setOverrides((prev) => prev.filter((o) => o.date !== overrideDate));
      return;
    }

    setOverrides((prev) => {
      const existing = prev.find((o) => o.date === override.date);
      if (existing) {
        return prev.map((o) => (o.date === override.date ? override : o));
      }
      return [...prev, override];
    });
  };

  const closeOverride = () => {
    setOverrideDate(null);
  };

  // ⭐ KORREKT: Wochentag ohne UTC-Shift
  const getShiftsForDay = (day: { date: Date; iso: string }) => {
    const d = day.date;
    const weekday = (d.getDay() + 6) % 7;

    const override = getOverridesMap[day.iso];
    if (override) return override.shifts;

    if (weekday === 6) return shiftModel.sunday;
    if (weekday === 5) return shiftModel.saturday;
    return shiftModel.weekdays;
  };

  const hasSunday = stationName !== "Bell Oil Station Wilnsdorf";
  const dayColumns = hasSunday ? 7 : 6;
  const gridTemplateColumns = `40px repeat(${dayColumns}, 1fr)`;

  const handlePrint = () => window.print();
  const handlePdfExport = () => window.print();

  return (
    <div className="calendar-root">
      <div className="calendar-main">
        <div className="calendar-header">
          <div className="calendar-controls">
            <select value={month} onChange={handleMonthChange}>
              {MONTHS_DE.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>

            <select value={year} onChange={handleYearChange}>
              {yearsRange.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="calendar-title">{title}</div>
        </div>

        <div className="calendar-actions">
          <button className="btn btn-secondary" onClick={handlePrint}>
            Drucken
          </button>
          <button className="btn btn-primary" onClick={handlePdfExport}>
            PDF exportieren
          </button>

          {/* ⭐ NEU: Mitarbeiterverwaltung öffnen */}
          <button
            className="btn btn-primary"
            onClick={() => setEmployeePanelOpen(true)}
          >
            Mitarbeiter verwalten
          </button>
        </div>

        <div className="calendar-grid">
          <div
            className="calendar-weekday-row"
            style={{ gridTemplateColumns }}
          >
            <div className="calendar-weekday calendar-weekday-kw">KW</div>
            <div className="calendar-weekday">Mo</div>
            <div className="calendar-weekday">Di</div>
            <div className="calendar-weekday">Mi</div>
            <div className="calendar-weekday">Do</div>
            <div className="calendar-weekday">Fr</div>
            <div className="calendar-weekday">Sa</div>
            {hasSunday && <div className="calendar-weekday">So</div>}
          </div>

          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="calendar-week-row"
              style={{ gridTemplateColumns }}
            >
              <div className="calendar-weeknumber-cell">
                {week.weekNumber}
              </div>

              {week.days
                .filter((d) => (hasSunday ? true : !d.isSunday))
                .map((day) => {
                  const classes = ["calendar-day"];
                  if (day.isOutsideMonth) classes.push("outside-month");
                  if (day.isSaturday) classes.push("saturday");
                  if (day.isSunday) classes.push("sunday");
                  if (day.isHoliday) classes.push("holiday");
                  if (day.isToday) classes.push("today");

                  const shifts = getShiftsForDay(day);

                  return (
                    <div
                      key={day.iso}
                      className={classes.join(" ")}
                      onDoubleClick={() => openOverride(day.iso)}
                    >
                      <div className="calendar-day-header">
                        <span className="calendar-day-number">
                          {day.day}
                        </span>
                        {day.isHoliday && (
                          <span className="calendar-day-holiday">
                            {day.holidayName}
                          </span>
                        )}
                      </div>

                      <div className="calendar-day-shifts">
                        {shifts.map((shift) => (
                          <div
                            key={shift.name}
                            className="calendar-shift-slot"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              onDropOnShift(day.iso, shift.name);
                            }}
                          >
                            <div className="calendar-shift-label">
                              {shift.name} ({shift.start}–{shift.end})
                            </div>

                            <div className="calendar-shift-employees">
  {getAssignmentsForDayAndShift(
    day.iso,
    shift.name
  ).map((a) => {
    const emp = employees.find(
      (e) => e.id === a.employeeId
    );
    if (!emp) return null;

    return (
      <div
        key={a.id}
        className="calendar-employee-pill"
        style={{ fontWeight: 700, fontSize: "1.1em" }}
      >
        {emp.name}
        <span
          className="pill-remove"
          onClick={() => removeAssignment(a.id)}
        >
          ×
        </span>
      </div>
    );
  })}
</div>

                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="hours-summary">
          <h3>Stundenauswertung</h3>
          <table className="hours-table">
            <thead>
              <tr>
                <th>Mitarbeiter</th>
                <th>Stunden</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{hoursPerEmployee[emp.id] ?? 0} Std</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="calendar-sidebar">
        <h3>Mitarbeiter</h3>
        <div className="employee-list">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="employee-pill"
              draggable
              onDragStart={() => onDragStart(emp.id)}
              onDragEnd={onDragEnd}
            >
              {emp.name}
              <span className="employee-hours">
                {hoursPerEmployee[emp.id] ?? 0} Std
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ⭐ NEU: Mitarbeiter-Panel */}
      <EmployeePanel
        stationId={stationName.toLowerCase()}
        isOpen={employeePanelOpen}
        onClose={() => setEmployeePanelOpen(false)}
      />

      <OverridePanel
        date={overrideDate}
        onClose={() => setOverrideDate(null)}
        onSave={handleSaveOverride}
        shiftModel={shiftModel}
        existingOverride={
          overrideDate ? getOverridesMap[overrideDate] ?? null : null
        }
      />
    </div>
  );
}
