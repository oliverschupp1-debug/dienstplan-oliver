import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { useOverrides } from "../useOverrides";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import "./StationMonitorView.css";

function getLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeShiftName(name: string) {
  return name
    .replace(/^Feiertag\s+/i, "")
    .replace(/^Samstag\s+/i, "")
    .replace(/^Sonntag\s+/i, "")
    .trim();
}

function getStoredShiftName(date: Date, shiftName: string, holidayName?: string) {
  const jsDay = date.getDay();

  if (holidayName) return `Feiertag ${shiftName}`;
  if (jsDay === 0) return `Sonntag ${shiftName}`;
  if (jsDay === 6) return `Samstag ${shiftName}`;

  return shiftName;
}

export default function StationMonitorView() {
  const stationId = useAppStore((s) => s.stationId);
  const userName = useAppStore((s) => s.userName);

  const [now, setNow] = useState(() => new Date());
  const iso = getLocalISO(now);

  const { assignments, reload } = useAssignments(stationId ?? "");
  const { employees } = useEmployees(stationId ?? null);
  const { overrides } = useOverrides(stationId ?? "");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
      reload();
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [reload]);

  const model = getShiftModelForStation(stationId ?? "");
  const holiday = isHoliday(iso);
  const holidayName = holiday?.name ?? undefined;
  const weekdayIndex = (now.getDay() + 6) % 7;
  const overrideShifts = overrides[iso];

  const shifts = useMemo(() => {
    if (overrideShifts && overrideShifts.length > 0) {
      return overrideShifts.map((shift) => ({
        name: shift.name,
        start: shift.start,
        end: shift.end,
        employee: shift.employee ?? null,
        isOverride: true,
      }));
    }

    const baseShifts =
      holidayName && model.holiday.length > 0
        ? model.holiday
        : weekdayIndex === 6
        ? model.sunday
        : weekdayIndex === 5
        ? model.saturday
        : model.weekdays;

    return baseShifts.map((shift) => ({
      ...shift,
      employee: null,
      isOverride: false,
    }));
  }, [overrideShifts, holidayName, weekdayIndex, model]);

  function getEmployeeName(employeeId: string) {
    return employees.find((employee) => employee.id === employeeId)?.name ?? "Unbekannt";
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

  if (!stationId) {
    return (
      <div className="monitor-root">
        <div className="monitor-empty">Keine Station ausgewählt.</div>
      </div>
    );
  }

  return (
    <div className="monitor-root">
      <header className="monitor-header">
        <div>
          <div className="monitor-kicker">Stationsmonitor</div>
          <h1>{stationId}</h1>
        </div>

        <div className="monitor-date">
          <strong>
            {weekdayNames[weekdayIndex]}, {now.getDate()}.{now.getMonth() + 1}.
            {now.getFullYear()}
          </strong>
          <span>
            {now.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </header>

      {holidayName && <div className="monitor-holiday">{holidayName}</div>}

      <main className="monitor-shifts">
        {shifts.map((shift) => {
          const storedShiftName = shift.isOverride
            ? shift.name
            : getStoredShiftName(now, shift.name, holidayName);

          const assignmentPeople = assignments
            .filter(
              (assignment) =>
                assignment.date === iso &&
                assignment.station_id === stationId &&
                normalizeShiftName(assignment.shift_name) ===
                  normalizeShiftName(storedShiftName)
            )
            .map((assignment) => getEmployeeName(assignment.employee_id));

          const overridePeople =
            shift.employee && shift.employee.trim() !== "" ? [shift.employee] : [];

          const people = [...assignmentPeople, ...overridePeople];

          return (
            <section
              key={`${iso}-${shift.name}-${shift.start}-${shift.end}`}
              className="monitor-shift-card"
            >
              <div className="monitor-shift-head">
                <h2>{shift.name}</h2>
                <span>
                  {shift.start} – {shift.end}
                </span>
              </div>

              {people.length === 0 ? (
                <div className="monitor-unassigned">Nicht besetzt</div>
              ) : (
                <div className="monitor-people">
                  {people.map((name, index) => (
                    <div key={`${name}-${index}`} className="monitor-person">
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      <footer className="monitor-footer">
        Angemeldet als {userName || "Benutzer"} · Aktualisierung automatisch jede Minute
      </footer>
    </div>
  );
}